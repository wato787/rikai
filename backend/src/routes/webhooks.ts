import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import Stripe from "stripe";
import * as v from "valibot";

import { getDb } from "../db";
import { billingAccounts } from "../db/schemas/billing-account";
import { processedStripeEvents } from "../db/schemas/stripe-events";
import { jsonError } from "../lib/api-error";
import { ipRateLimit } from "../lib/rate-limit";
import { createStripeClient } from "../lib/stripe-server";
import type { AppEnv } from "../types/hono-env";

const stripeEventEnvelopeSchema = v.object({
  id: v.string(),
  type: v.string(),
  data: v.object({
    object: v.unknown(),
  }),
});

const checkoutCompletedObjectSchema = v.object({
  mode: v.optional(v.string()),
  payment_status: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.string())),
  client_reference_id: v.optional(v.nullable(v.string())),
  customer: v.optional(v.union([v.string(), v.object({ id: v.string() }), v.null()])),
});

function customerIdFromUnknown(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id;
  }
  return null;
}

/** wrangler dev + stripe listen が届けるホスト想定（本番 URL では常に false） */
function isLocalWebhookHost(c: Context): boolean {
  try {
    const host = new URL(c.req.url).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

/** テストキーかつローカルホストへのリクエストだけ署名省略（本番・sk_live_ では不可） */
function skipStripeWebhookSignatureVerify(
  c: Context,
  stripeSecretKey: string | undefined,
): boolean {
  if (!stripeSecretKey?.startsWith("sk_test_")) return false;
  return isLocalWebhookHost(c);
}

function parseStripeEventInsecure(rawBody: string): Stripe.Event | null {
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    const validated = v.safeParse(stripeEventEnvelopeSchema, parsed);
    if (!validated.success) return null;
    return validated.output as Stripe.Event;
  } catch {
    return null;
  }
}

const app = new Hono<AppEnv>();
const stripeWebhookRateLimit = ipRateLimit({
  routeKey: "webhooks:stripe",
  windowMs: 60_000,
  maxRequests: 120,
});

/** POST /api/webhooks/stripe — 署名検証のみ（認証なし） */
app.post("/stripe", stripeWebhookRateLimit, async (c) => {
  const apiKey = process.env.STRIPE_SECRET_KEY ?? c.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "Stripe API key not configured");
  }

  const rawBody = await c.req.text();
  const stripe = createStripeClient(apiKey);

  const skipVerify = skipStripeWebhookSignatureVerify(c, apiKey);
  let event: Stripe.Event;

  if (skipVerify) {
    const parsed = parseStripeEventInsecure(rawBody);
    if (!parsed) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "Webhook 本文の解析に失敗しました。" } },
        400,
      );
    }
    event = parsed;
  } else {
    const secret = process.env.STRIPE_WEBHOOK_SECRET ?? c.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return jsonError(c, 400, "VALIDATION_ERROR", "Webhook secret not configured");
    }

    const signature = c.req.header("stripe-signature");
    if (!signature) {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "stripe-signature がありません。" } },
        400,
      );
    }

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      return c.json(
        { error: { code: "VALIDATION_ERROR", message: "署名検証に失敗しました。" } },
        400,
      );
    }
  }

  const db = getDb(c.env.rikai_db);

  const [already] = await db
    .select()
    .from(processedStripeEvents)
    .where(eq(processedStripeEvents.eventId, event.id))
    .limit(1);
  if (already) {
    return c.body(null, 200);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const parsed = v.safeParse(checkoutCompletedObjectSchema, event.data.object);
      if (parsed.success) {
        const session = parsed.output;
        if (session.mode === "payment" && session.payment_status === "paid") {
          const userId = session.metadata?.userId ?? session.client_reference_id;
          const custId = customerIdFromUnknown(session.customer);
          const grantRaw = session.metadata?.creditsGrant ?? "0";
          const grant = Number.parseInt(grantRaw, 10);

          if (userId && typeof userId === "string" && Number.isInteger(grant) && grant > 0) {
            const [row] = await db
              .select()
              .from(billingAccounts)
              .where(eq(billingAccounts.userId, userId))
              .limit(1);

            if (row) {
              await db
                .update(billingAccounts)
                .set({
                  stripeCustomerId: custId ?? row.stripeCustomerId,
                  creditBalance: Math.max(0, row.creditBalance ?? 0) + grant,
                  updatedAt: Date.now(),
                })
                .where(eq(billingAccounts.userId, userId));
            }
          }
        }
      }
    }

    await db.insert(processedStripeEvents).values({
      eventId: event.id,
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("Stripe webhook failed", error);
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "Webhook の処理に失敗しました。");
  }

  return c.body(null, 200);
});

export default app;
