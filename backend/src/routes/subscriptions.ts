import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import { subscriptions } from "../db/schemas/subscription";
import { jsonError } from "../lib/api-error";
import {
  CREDIT_SCHEMA_VERSION,
  INITIAL_FREE_CREDITS,
  ROADMAP_GENERATION_CREDIT_COST,
} from "../lib/plan-limits";
import { ipRateLimit } from "../lib/rate-limit";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/hono-env";

const app = new Hono<AppEnv>();
const billingWriteRateLimit = ipRateLimit({
  routeKey: "subscriptions:write",
  windowMs: 60_000,
  maxRequests: 20,
});

app.use("*", requireAuth);

/** GET /api/subscriptions/me */
app.get("/me", async (c) => {
  const userId = c.get("user").id;
  const db = getDb(c.env.rikai_db);

  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!row) {
    const now = Date.now();
    await db.insert(subscriptions).values({
      id: uuidv7(),
      userId,
      plan: "free",
      status: "active",
      aiGenerationsUsed: INITIAL_FREE_CREDITS,
      aiUsageMonth: CREDIT_SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
    });
    return c.json({
      subscription: {
        creditModel: "credits",
        remainingCredits: INITIAL_FREE_CREDITS,
        costPerRoadmapGeneration: ROADMAP_GENERATION_CREDIT_COST,
      },
    });
  }

  let remainingCredits: number;
  if (row.aiUsageMonth === CREDIT_SCHEMA_VERSION) {
    remainingCredits = Math.max(0, row.aiGenerationsUsed ?? 0);
  } else {
    // 旧「月次利用回数」運用からの緩やかな移行
    const usedLegacy = Math.max(0, row.aiGenerationsUsed ?? 0);
    remainingCredits = Math.max(0, INITIAL_FREE_CREDITS - usedLegacy);
    await db
      .update(subscriptions)
      .set({
        aiGenerationsUsed: remainingCredits,
        aiUsageMonth: CREDIT_SCHEMA_VERSION,
        updatedAt: Date.now(),
      })
      .where(eq(subscriptions.userId, userId));
  }

  return c.json({
    subscription: {
      creditModel: "credits",
      remainingCredits,
      costPerRoadmapGeneration: ROADMAP_GENERATION_CREDIT_COST,
    },
  });
});

/** POST /api/subscriptions/checkout */
app.post("/checkout", billingWriteRateLimit, async (c) => {
  return jsonError(c, 501, "INTERNAL_SERVER_ERROR", "クレジット購入導線は準備中です。");
});

/** POST /api/subscriptions/cancel */
app.post("/cancel", billingWriteRateLimit, async (c) => {
  return jsonError(c, 400, "VALIDATION_ERROR", "クレジット制では解約操作は不要です。");
});

export default app;
