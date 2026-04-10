import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import { edges, nodes, roadmaps } from "../db/schemas/roadmap";
import { subscriptions } from "../db/schemas/subscription";
import { generateRoadmapWithGemini } from "../lib/gemini";
import { jsonError } from "../lib/api-error";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/hono-env";

const NODE_STATUSES = ["not_started", "in_progress", "completed"] as const;
type NodeStatus = (typeof NODE_STATUSES)[number];

function isNodeStatus(v: unknown): v is NodeStatus {
  return typeof v === "string" && (NODE_STATUSES as readonly string[]).includes(v);
}

const POSITION_COORD_MAX = 1_000_000;

function isFiniteCoord(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && Math.abs(n) <= POSITION_COORD_MAX;
}

const app = new Hono<AppEnv>();

app.use("*", requireAuth);

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
app.post("/", async (c) => {
  const userId = c.get("user").id;
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "JSON の形式が不正です。");
  }
  if (!body || typeof body !== "object") {
    return jsonError(c, 400, "VALIDATION_ERROR", "リクエストボディが不正です。");
  }
  const topic = (body as { topic?: unknown }).topic;
  if (typeof topic !== "string" || topic.length < 1 || topic.length > 200) {
    return jsonError(
      c,
      400,
      "VALIDATION_ERROR",
      "topic は必須で、1〜200文字である必要があります。",
    );
  }

  const db = getDb(c.env.rikai_db);

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  const isPro = sub?.plan === "pro";
  if (!isPro) {
    const [{ c: roadmapCount }] = await db
      .select({ c: count() })
      .from(roadmaps)
      .where(eq(roadmaps.userId, userId));
    if (roadmapCount >= 3) {
      return jsonError(
        c,
        409,
        "ROADMAP_LIMIT_EXCEEDED",
        "無料プランの作成上限（3件）に達しています。",
      );
    }
  }

  const apiKey = process.env.GEMINI_API_KEY ?? c.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonError(
      c,
      502,
      "AI_GENERATION_FAILED",
      "AI 生成用の設定（GEMINI_API_KEY）がありません。",
    );
  }

  const geminiModel = process.env.GEMINI_MODEL ?? c.env.GEMINI_MODEL;
  const payload = await generateRoadmapWithGemini(apiKey, topic, {
    model: geminiModel,
  });
  if (!payload || payload.nodes.length === 0) {
    return jsonError(
      c,
      502,
      "AI_GENERATION_FAILED",
      "AI から有効なロードマップを取得できませんでした。",
    );
  }

  const roadmapId = uuidv7();
  const now = Date.now();
  const idMap = new Map<string, string>();
  for (const n of payload.nodes) {
    if (!idMap.has(n.id)) idMap.set(n.id, uuidv7());
  }

  const nodeRows = payload.nodes.map((n) => ({
    id: idMap.get(n.id)!,
    roadmapId,
    label: n.label,
    description: n.description,
    status: "not_started" as const,
    orderIndex: Math.floor(n.order),
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

/** PATCH /api/roadmaps/:id/nodes/:nodeId（status / label / description / position のいずれか1つ以上） */
app.patch("/:id/nodes/:nodeId", async (c) => {
  const userId = c.get("user").id;
  const roadmapId = c.req.param("id");
  const nodeId = c.req.param("nodeId");
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "JSON の形式が不正です。");
  }
  if (!body || typeof body !== "object") {
    return jsonError(c, 400, "VALIDATION_ERROR", "リクエストボディが不正です。");
  }
  const raw = body as {
    status?: unknown;
    label?: unknown;
    description?: unknown;
    positionX?: unknown;
    positionY?: unknown;
  };

  const updates: {
    status?: NodeStatus;
    label?: string;
    description?: string;
    positionX?: number;
    positionY?: number;
  } = {};

  if (raw.status !== undefined) {
    if (!isNodeStatus(raw.status)) {
      return jsonError(
        c,
        400,
        "VALIDATION_ERROR",
        "status は not_started / in_progress / completed のいずれかである必要があります。",
      );
    }
    updates.status = raw.status;
  }

  if (raw.label !== undefined) {
    if (typeof raw.label !== "string") {
      return jsonError(c, 400, "VALIDATION_ERROR", "label は文字列である必要があります。");
    }
    const t = raw.label.trim();
    if (t.length < 1 || t.length > 500) {
      return jsonError(c, 400, "VALIDATION_ERROR", "label は1〜500文字である必要があります。");
    }
    updates.label = t;
  }

  if (raw.description !== undefined) {
    if (typeof raw.description !== "string") {
      return jsonError(c, 400, "VALIDATION_ERROR", "description は文字列である必要があります。");
    }
    if (raw.description.length > 5000) {
      return jsonError(
        c,
        400,
        "VALIDATION_ERROR",
        "description は5000文字以内である必要があります。",
      );
    }
    updates.description = raw.description;
  }

  const hasPosX = raw.positionX !== undefined;
  const hasPosY = raw.positionY !== undefined;
  if (hasPosX !== hasPosY) {
    return jsonError(c, 400, "VALIDATION_ERROR", "positionX と positionY は両方指定してください。");
  }
  if (hasPosX) {
    if (!isFiniteCoord(raw.positionX) || !isFiniteCoord(raw.positionY)) {
      return jsonError(
        c,
        400,
        "VALIDATION_ERROR",
        `positionX / positionY は ±${POSITION_COORD_MAX} 以内の有限数である必要があります。`,
      );
    }
    updates.positionX = raw.positionX;
    updates.positionY = raw.positionY;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError(
      c,
      400,
      "VALIDATION_ERROR",
      "status / label / description / position（positionX と positionY のペア）のいずれかを指定してください。",
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
      positionX: nodes.positionX,
      positionY: nodes.positionY,
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
      positionX: updated.positionX ?? null,
      positionY: updated.positionY ?? null,
      updatedAt: updated.updatedAt,
    },
  });
});

export default app;
