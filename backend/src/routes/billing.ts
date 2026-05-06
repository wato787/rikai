import { eq } from "drizzle-orm";
import { Hono } from "hono";
import * as v from "valibot";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import { billingAccounts } from "../db/schemas/billing-account";
import { jsonError } from "../lib/api-error";
import { INITIAL_FREE_CREDITS, ROADMAP_GENERATION_CREDIT_COST } from "../lib/plan-limits";
import { ipRateLimit } from "../lib/rate-limit";
import { createStripeClient } from "../lib/stripe-server";
import { requireAuth } from "../middleware/auth";
import type { AppEnv } from "../types/hono-env";

function frontendBase(c: { env: { FRONTEND_URL: string } }): string | null {
  const parsed = v.safeParse(v.pipe(v.string(), v.trim(), v.url()), c.env.FRONTEND_URL);
  if (!parsed.success) {
    return null;
  }
  return parsed.output.replace(/\/$/, "");
}

const app = new Hono<AppEnv>();
const billingWriteRateLimit = ipRateLimit({
  routeKey: "billing:write",
  windowMs: 60_000,
  maxRequests: 20,
});
const creditGrantBodySchema = v.object({
  amount: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(200)),
});

app.use("*", requireAuth);

/** GET /api/billing/me */
app.get("/me", async (c) => {
  const userId = c.get("user").id;
  const db = getDb(c.env.rikai_db);

  const [row] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);

  if (!row) {
    const now = Date.now();
    await db.insert(billingAccounts).values({
      id: uuidv7(),
      userId,
      creditBalance: INITIAL_FREE_CREDITS,
      createdAt: now,
      updatedAt: now,
    });
    return c.json({
      billing: {
        creditModel: "credits",
        remainingCredits: INITIAL_FREE_CREDITS,
        costPerRoadmapGeneration: ROADMAP_GENERATION_CREDIT_COST,
      },
    });
  }

  return c.json({
    billing: {
      creditModel: "credits",
      remainingCredits: Math.max(0, row.creditBalance ?? 0),
      costPerRoadmapGeneration: ROADMAP_GENERATION_CREDIT_COST,
    },
  });
});

/** POST /api/billing/checkout */
app.post("/checkout", billingWriteRateLimit, async (c) => {
  const userId = c.get("user").id;
  const secret = process.env.STRIPE_SECRET_KEY ?? c.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_CREDITS ?? c.env.STRIPE_PRICE_CREDITS;
  if (!secret || !priceId) {
    return jsonError(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "Stripe の設定（STRIPE_SECRET_KEY / STRIPE_PRICE_CREDITS）がありません。",
    );
  }

  const creditsPerPurchaseRaw =
    process.env.STRIPE_CREDITS_PER_PURCHASE ?? c.env.STRIPE_CREDITS_PER_PURCHASE ?? "10";
  const creditsPerPurchase = Number.parseInt(creditsPerPurchaseRaw, 10);
  if (!Number.isInteger(creditsPerPurchase) || creditsPerPurchase <= 0) {
    return jsonError(
      c,
      500,
      "INTERNAL_SERVER_ERROR",
      "STRIPE_CREDITS_PER_PURCHASE の設定が不正です。",
    );
  }

  const db = getDb(c.env.rikai_db);
  const [row] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);

  if (!row) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "課金アカウント情報が見つかりません。");
  }

  const stripe = createStripeClient(secret);
  let customerId = row.stripeCustomerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId },
    });
    customerId = customer.id;
    await db
      .update(billingAccounts)
      .set({ stripeCustomerId: customerId, updatedAt: Date.now() })
      .where(eq(billingAccounts.userId, userId));
  }

  const base = frontendBase(c);
  if (!base) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "FRONTEND_URL の設定が不正です。");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/settings?checkout=success`,
    cancel_url: `${base}/settings?checkout=cancel`,
    metadata: {
      userId,
      creditsGrant: String(creditsPerPurchase),
    },
    client_reference_id: userId,
    allow_promotion_codes: true,
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

/** POST /api/billing/credits/grant （開発環境限定） */
app.post("/credits/grant", billingWriteRateLimit, async (c) => {
  const nodeEnv = process.env.NODE_ENV ?? c.env.NODE_ENV;
  if (nodeEnv === "production") {
    return jsonError(c, 403, "FORBIDDEN", "本番環境では手動クレジット付与は無効です。");
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return jsonError(c, 400, "VALIDATION_ERROR", "JSON の形式が不正です。");
  }
  const parsed = v.safeParse(creditGrantBodySchema, rawBody);
  if (!parsed.success) {
    return jsonError(c, 400, "VALIDATION_ERROR", "amount は 1〜200 の整数で指定してください。");
  }

  const userId = c.get("user").id;
  const amount = parsed.output.amount;
  const db = getDb(c.env.rikai_db);
  const now = Date.now();

  const [row] = await db
    .select()
    .from(billingAccounts)
    .where(eq(billingAccounts.userId, userId))
    .limit(1);
  if (!row) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "課金アカウント情報が見つかりません。");
  }

  const next = Math.max(0, row.creditBalance ?? 0) + amount;

  await db
    .update(billingAccounts)
    .set({
      creditBalance: next,
      updatedAt: now,
    })
    .where(eq(billingAccounts.userId, userId));

  return c.json({
    granted: amount,
    remainingCredits: next,
  });
});

export default app;
