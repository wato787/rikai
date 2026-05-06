import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import { billingAccounts } from "../db/schemas/billing-account";
import { edges, nodes, roadmaps } from "../db/schemas/roadmap";
import { generateRoadmapWithGemini } from "../lib/gemini";
import { ipRateLimit } from "../lib/rate-limit";
import { jsonError } from "../lib/api-error";
import { INITIAL_FREE_CREDITS, ROADMAP_GENERATION_CREDIT_COST } from "../lib/plan-limits";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/hono-env";

const NODE_STATUSES = ["not_started", "in_progress", "completed"] as const;
type NodeStatus = (typeof NODE_STATUSES)[number];

const createRoadmapBodySchema = v.object({
  topic: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
});

const patchNodeBodySchema = v.object({
  status: v.optional(v.picklist(NODE_STATUSES)),
  label: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(500))),
  description: v.optional(v.pipe(v.string(), v.maxLength(5000))),
});

const app = new Hono<AppEnv>();
const createRoadmapRateLimit = ipRateLimit({
  routeKey: "roadmaps:create",
  windowMs: 60_000,
  maxRequests: 10,
});

app.use("*", requireAuth);

const LAYOUT_X_GAP = 360;
const LAYOUT_Y_GAP = 220;

function computeAutoLayout(
  nodeIdsInOrder: string[],
  roadmapEdges: Array<{ sourceId: string; targetId: string }>,
): Map<string, { x: number; y: number }> {
  const indegree = new Map<string, number>();
  const children = new Map<string, string[]>();
  const levels = new Map<string, number>();

  for (const id of nodeIdsInOrder) {
    indegree.set(id, 0);
    children.set(id, []);
    levels.set(id, 0);
  }

  for (const e of roadmapEdges) {
    if (!indegree.has(e.sourceId) || !indegree.has(e.targetId)) continue;
    indegree.set(e.targetId, (indegree.get(e.targetId) ?? 0) + 1);
    children.get(e.sourceId)?.push(e.targetId);
  }

  const queue: string[] = [];
  for (const id of nodeIdsInOrder) {
    if ((indegree.get(id) ?? 0) === 0) queue.push(id);
  }
  if (queue.length === 0 && nodeIdsInOrder.length > 0) queue.push(nodeIdsInOrder[0]!);

  let head = 0;
  while (head < queue.length) {
    const id = queue[head]!;
    head += 1;
    const level = levels.get(id) ?? 0;
    for (const next of children.get(id) ?? []) {
      levels.set(next, Math.max(levels.get(next) ?? 0, level + 1));
      indegree.set(next, (indegree.get(next) ?? 1) - 1);
      if ((indegree.get(next) ?? 0) === 0) queue.push(next);
    }
  }

  const layers = new Map<number, string[]>();
  for (const id of nodeIdsInOrder) {
    const layer = levels.get(id) ?? 0;
    const list = layers.get(layer) ?? [];
    list.push(id);
    layers.set(layer, list);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [layer, ids] of layers.entries()) {
    const startY = -((ids.length - 1) * LAYOUT_Y_GAP) / 2;
    ids.forEach((id, idx) => {
      positions.set(id, {
        x: layer * LAYOUT_X_GAP,
        y: startY + idx * LAYOUT_Y_GAP,
      });
    });
  }
  return positions;
}

/** GET /api/roadmaps */
app.get("/", async (c) => {
  const userId = c.get("user").id;
  const db = getDb(c.env.rikai_db);

  const list = await db
    .select()
    .from(roadmaps)
    .where(eq(roadmaps.userId, userId))
    .orderBy(desc(roadmaps.createdAt));

  const statsRows = await db
    .select({
      roadmapId: nodes.roadmapId,
      totalNodes: count(),
      completedNodes: sql<number>`sum(CASE WHEN ${nodes.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
    .from(nodes)
    .innerJoin(roadmaps, eq(nodes.roadmapId, roadmaps.id))
    .where(eq(roadmaps.userId, userId))
    .groupBy(nodes.roadmapId);

  const statsByRoadmap = new Map<string, { total: number; completed: number }>();
  for (const row of statsRows) {
    statsByRoadmap.set(row.roadmapId, {
      total: Number(row.totalNodes),
      completed: Number(row.completedNodes),
    });
  }

  return c.json({
    roadmaps: list.map((r) => {
      const s = statsByRoadmap.get(r.id) ?? { total: 0, completed: 0 };
      return {
        id: r.id,
        title: r.title,
        topic: r.topic,
        totalNodes: s.total,
        completedNodes: s.completed,
        createdAt: r.createdAt,
      };
    }),
  });
});

/** POST /api/roadmaps */
app.post("/", createRoadmapRateLimit, async (c) => {
  const userId = c.get("user").id;
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "JSON の形式が不正です。");
  }
  const parsedBody = v.safeParse(createRoadmapBodySchema, rawBody);
  if (!parsedBody.success) {
    return jsonError(
      c,
      400,
      "VALIDATION_ERROR",
      "topic は必須で、1〜200文字である必要があります。",
    );
  }
  const { topic } = parsedBody.output;

  const db = getDb(c.env.rikai_db);
  const now = Date.now();

  let [sub] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);

  if (!sub) {
    const subId = uuidv7();
    await db.insert(billingAccounts).values({
      id: subId,
      userId,
      creditBalance: INITIAL_FREE_CREDITS,
      createdAt: now,
      updatedAt: now,
    });
    [sub] = await db
      .select()
      .from(billingAccounts)
      .where(eq(billingAccounts.userId, userId))
      .limit(1);
  }

  if (!sub) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "課金アカウントの初期化に失敗しました。");
  }

  const remainingCredits = Math.max(0, sub.creditBalance ?? 0);
  if (remainingCredits < ROADMAP_GENERATION_CREDIT_COST) {
    return jsonError(
      c,
      403,
      "AI_GENERATION_LIMIT_EXCEEDED",
      "クレジットが不足しています。クレジットを追加してください。",
    );
  }

  const rawGeminiKey = process.env.GEMINI_API_KEY ?? c.env.GEMINI_API_KEY;
  const apiKey = typeof rawGeminiKey === "string" ? rawGeminiKey.trim() : "";
  if (!apiKey) {
    return jsonError(
      c,
      503,
      "GEMINI_NOT_CONFIGURED",
      "AI 生成は未設定です。環境変数 GEMINI_API_KEY を設定してください。",
    );
  }

  const geminiModel = process.env.GEMINI_MODEL ?? c.env.GEMINI_MODEL;
  const result = await generateRoadmapWithGemini(apiKey, topic, {
    model: geminiModel,
  });
  const payload = result.payload;
  if (!payload || payload.nodes.length === 0) {
    if (result.failureKind === "transient_unavailable") {
      return jsonError(
        c,
        503,
        "AI_SERVICE_UNAVAILABLE",
        "AI サービスが混雑しています。少し時間をおいて再試行してください。",
      );
    }
    return jsonError(
      c,
      502,
      "AI_GENERATION_FAILED",
      "AI から有効なロードマップを取得できませんでした。",
    );
  }

  const roadmapId = uuidv7();
  const idMap = new Map<string, string>();
  for (const n of payload.nodes) {
    if (!idMap.has(n.id)) idMap.set(n.id, uuidv7());
  }

  const nodeRows = payload.nodes.map((n) => ({
    id: idMap.get(n.id)!,
    roadmapId,
    label: n.label,
    description: [
      n.summary,
      "",
      "学習ポイント",
      ...n.learningPoints.map((point) => `- ${point}`),
      "",
      "実践タスク",
      ...n.practiceTasks.map((task) => `- ${task}`),
      "",
      "完了条件",
      ...n.completionCriteria.map((criteria) => `- ${criteria}`),
      "",
      "参考リンク",
      ...n.trustedSources.map((source) => `- ${source.title} | ${source.url} | ${source.reason}`),
    ].join("\n"),
    status: "not_started" as const,
    orderIndex: Math.floor(n.order),
    positionX: null as number | null,
    positionY: null as number | null,
    createdAt: now,
    updatedAt: now,
  }));

  const edgeRows: {
    id: string;
    roadmapId: string;
    sourceId: string;
    targetId: string;
    createdAt: number;
  }[] = [];

  for (const e of payload.edges) {
    const sourceId = idMap.get(e.source);
    const targetId = idMap.get(e.target);
    if (!sourceId || !targetId || sourceId === targetId) {
      return jsonError(
        c,
        502,
        "AI_GENERATION_FAILED",
        "AI が返したエッジがノードと整合しませんでした。",
      );
    }
    edgeRows.push({
      id: uuidv7(),
      roadmapId,
      sourceId,
      targetId,
      createdAt: now,
    });
  }

  const nodeIdsInOrder = nodeRows
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((n) => n.id);
  const positions = computeAutoLayout(
    nodeIdsInOrder,
    edgeRows.map((e) => ({ sourceId: e.sourceId, targetId: e.targetId })),
  );
  for (const n of nodeRows) {
    const pos = positions.get(n.id);
    n.positionX = pos?.x ?? 0;
    n.positionY = pos?.y ?? 0;
  }

  const nextRemainingCredits = Math.max(0, remainingCredits - ROADMAP_GENERATION_CREDIT_COST);

  try {
    await db.batch([
      db.insert(roadmaps).values({
        id: roadmapId,
        userId,
        title: payload.title,
        topic,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(nodes).values(nodeRows),
      ...(edgeRows.length > 0 ? [db.insert(edges).values(edgeRows)] : []),
      db
        .update(billingAccounts)
        .set({
          creditBalance: nextRemainingCredits,
          updatedAt: now,
        })
        .where(eq(billingAccounts.userId, userId)),
    ]);
  } catch (e) {
    console.error(e);
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "ロードマップの保存に失敗しました。");
  }

  return c.json({ roadmapId }, 201);
});

/** GET /api/roadmaps/:id */
app.get("/:id", async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  const db = getDb(c.env.rikai_db);

  const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, id)).limit(1);
  if (!roadmap) {
    return jsonError(c, 404, "NOT_FOUND", "ロードマップが見つかりません。");
  }
  if (roadmap.userId !== userId) {
    return jsonError(c, 403, "FORBIDDEN", "このロードマップにアクセスできません。");
  }

  const nodeList = await db
    .select()
    .from(nodes)
    .where(eq(nodes.roadmapId, id))
    .orderBy(asc(nodes.orderIndex), asc(nodes.createdAt));

  const edgeList = await db.select().from(edges).where(eq(edges.roadmapId, id));

  return c.json({
    roadmap: {
      id: roadmap.id,
      title: roadmap.title,
      topic: roadmap.topic,
      createdAt: roadmap.createdAt,
    },
    nodes: nodeList.map((n) => ({
      id: n.id,
      label: n.label,
      description: n.description,
      status: n.status,
      orderIndex: n.orderIndex,
      positionX: n.positionX ?? null,
      positionY: n.positionY ?? null,
    })),
    edges: edgeList.map((e) => ({
      id: e.id,
      sourceId: e.sourceId,
      targetId: e.targetId,
    })),
  });
});

/** DELETE /api/roadmaps/:id */
app.delete("/:id", async (c) => {
  const userId = c.get("user").id;
  const id = c.req.param("id");
  const db = getDb(c.env.rikai_db);

  const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, id)).limit(1);
  if (!roadmap) {
    return jsonError(c, 404, "NOT_FOUND", "ロードマップが見つかりません。");
  }
  if (roadmap.userId !== userId) {
    return jsonError(c, 403, "FORBIDDEN", "このロードマップを削除できません。");
  }

  await db.delete(roadmaps).where(eq(roadmaps.id, id));
  return c.body(null, 204);
});

/** PATCH /api/roadmaps/:id/nodes/:nodeId（status / label / description のいずれか1つ以上） */
app.patch("/:id/nodes/:nodeId", async (c) => {
  const userId = c.get("user").id;
  const roadmapId = c.req.param("id");
  const nodeId = c.req.param("nodeId");
  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "JSON の形式が不正です。");
  }
  const parsedBody = v.safeParse(patchNodeBodySchema, rawBody);
  if (!parsedBody.success) {
    return jsonError(c, 400, "VALIDATION_ERROR", "リクエストボディが不正です。");
  }
  const raw = parsedBody.output;

  const updates: {
    status?: NodeStatus;
    label?: string;
    description?: string;
  } = {};

  if (raw.status !== undefined) {
    updates.status = raw.status;
  }

  if (raw.label !== undefined) {
    updates.label = raw.label;
  }

  if (raw.description !== undefined) {
    updates.description = raw.description;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError(
      c,
      400,
      "VALIDATION_ERROR",
      "status / label / description のいずれかを指定してください。",
    );
  }

  const db = getDb(c.env.rikai_db);

  const [roadmap] = await db.select().from(roadmaps).where(eq(roadmaps.id, roadmapId)).limit(1);
  if (!roadmap) {
    return jsonError(c, 404, "NOT_FOUND", "ロードマップが見つかりません。");
  }
  if (roadmap.userId !== userId) {
    return jsonError(c, 403, "FORBIDDEN", "このノードを更新できません。");
  }

  const now = Date.now();
  const result = await db
    .update(nodes)
    .set({ ...updates, updatedAt: now })
    .where(and(eq(nodes.id, nodeId), eq(nodes.roadmapId, roadmapId)))
    .returning({
      id: nodes.id,
      label: nodes.label,
      description: nodes.description,
      status: nodes.status,
      updatedAt: nodes.updatedAt,
    });

  const updated = result[0];
  if (!updated) {
    return jsonError(c, 404, "NOT_FOUND", "ノードが見つかりません。");
  }

  return c.json({
    node: {
      id: updated.id,
      label: updated.label,
      description: updated.description,
      status: updated.status,
      updatedAt: updated.updatedAt,
    },
  });
});

export default app;
