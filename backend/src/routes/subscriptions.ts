import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import { subscriptions } from "../db/schemas/subscription";
import { jsonError } from "../lib/api-error";
import {
  currentAiUsageMonthKey,
  FREE_AI_GENERATIONS_PER_MONTH,
  PRO_AI_GENERATIONS_PER_MONTH,
} from "../lib/plan-limits";
import { createStripeClient } from "../lib/stripe-server";
import { subscriptionCurrentPeriodEndMs } from "../lib/stripe-util";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/hono-env";

function frontendBase(c: { env: { FRONTEND_URL: string } }) {
  return c.env.FRONTEND_URL.replace(/\/$/, "");
}

const app = new Hono<AppEnv>();

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
      status: "inactive",
      createdAt: now,
      updatedAt: now,
    });
    return c.json({
      subscription: {
        plan: "free",
        status: "inactive",
        currentPeriodEnd: null,
        aiUsage: {
          usedThisMonth: 0,
          limitThisMonth: FREE_AI_GENERATIONS_PER_MONTH,
          month: currentAiUsageMonthKey(),
        },
      },
    });
  }

  const month = currentAiUsageMonthKey();
  const isPro = row.plan === "pro";
  const usedThisMonth = row.aiUsageMonth === month ? Math.max(0, row.aiGenerationsUsed ?? 0) : 0;
  const limitThisMonth = isPro ? PRO_AI_GENERATIONS_PER_MONTH : FREE_AI_GENERATIONS_PER_MONTH;

  return c.json({
    subscription: {
      plan: row.plan,
      status: row.status,
      currentPeriodEnd: row.currentPeriodEnd ?? null,
      aiUsage: {
        usedThisMonth,
        limitThisMonth,
        month,
      },
    },
  });
});

/** POST /api/subscriptions/checkout */
app.post("/checkout", async (c) => {
  const userId = c.get("user").id;
  const secret = process.env.STRIPE_SECRET_KEY ?? c.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_PRO ?? c.env.STRIPE_PRICE_PRO;
  if (!secret || !priceId) {
    return jsonError(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Stripe の設定（STRIPE_SECRET_KEY / STRIPE_PRICE_PRO）がありません。",
    );
  }

  const db = getDb(c.env.rikai_db);
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!row) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "サブスクリプション行が存在しません。");
  }

  const stripe = createStripeClient(secret);
  let customerId = row.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    customerId = customer.id;
    await db
      .update(subscriptions)
      .set({ stripeCustomerId: customerId, updatedAt: Date.now() })
      .where(eq(subscriptions.userId, userId));
  }

  const base = frontendBase(c);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/settings?checkout=success`,
    cancel_url: `${base}/settings?checkout=cancel`,
    metadata: { userId },
    client_reference_id: userId,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) {
    return jsonError(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Checkout セッションの URL を取得できませんでした。",
    );
  }

  return c.json({ checkoutUrl: session.url });
});

/** POST /api/subscriptions/cancel */
app.post("/cancel", async (c) => {
  const userId = c.get("user").id;
  const secret = process.env.STRIPE_SECRET_KEY ?? c.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "Stripe の設定がありません。");
  }

  const db = getDb(c.env.rikai_db);
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!row) {
    return jsonError(c, 400, "VALIDATION_ERROR", "サブスクリプション情報がありません。");
  }

  if (row.plan !== "pro" || !row.stripeSubscriptionId) {
    return jsonError(c, 400, "VALIDATION_ERROR", "キャンセル対象の Pro 契約がありません。");
  }

  const stripe = createStripeClient(secret);

  try {
    const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
    if (sub.status === "canceled") {
      return jsonError(c, 400, "VALIDATION_ERROR", "すでに解約済みです。");
    }
    await stripe.subscriptions.update(row.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    const updated = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
    const currentPeriodEnd = subscriptionCurrentPeriodEndMs(updated);

    await db
      .update(subscriptions)
      .set({
        updatedAt: Date.now(),
        currentPeriodEnd: currentPeriodEnd ?? row.currentPeriodEnd,
      })
      .where(eq(subscriptions.userId, userId));

    return c.json({
      subscription: {
        plan: "pro",
        status: "active",
        currentPeriodEnd,
      },
    });
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "Stripe でのキャンセル処理に失敗しました。");
  }
});

export default app;
