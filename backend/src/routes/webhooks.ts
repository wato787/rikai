import { eq } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import Stripe from "stripe";
import * as v from "valibot";

import { getDb } from "../db";
import { processedStripeEvents } from "../db/schemas/stripe-events";
import { subscriptions } from "../db/schemas/subscription";
import { jsonError } from "../lib/api-error";
import {
  stripeCustomerIdFromStripeObject,
  subscriptionSyncPatchFromStripe,
  type SubscriptionSyncPatch,
} from "../lib/stripe-subscription-sync";
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
  subscription: v.optional(v.union([v.string(), v.object({ id: v.string() }), v.null()])),
  customer: v.optional(v.union([v.string(), v.object({ id: v.string() }), v.null()])),
});

const subscriptionEventObjectSchema = v.object({
  id: v.string(),
  customer: v.optional(v.unknown()),
});

const invoiceEventObjectSchema = v.object({
  subscription: v.optional(v.union([v.string(), v.object({ id: v.string() }), v.null()])),
  customer: v.optional(v.union([v.string(), v.object({ id: v.string() }), v.null()])),
});

function customerIdFromUnknown(v: unknown): string | null {
  if (typeof v === "string") return v;
  if (v && typeof v === "object" && "id" in v && typeof v.id === "string") {
    return v.id;
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

async function applySubscriptionPatchByStripeSubId(
  db: ReturnType<typeof getDb>,
  stripeSubId: string,
  stripeCustomerId: string | null,
  patch: SubscriptionSyncPatch,
) {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubId))
    .limit(1);
  if (!row) return;

  await db
    .update(subscriptions)
    .set({
      plan: patch.plan,
      status: patch.status,
      stripeSubscriptionId: patch.stripeSubscriptionId,
      currentPeriodEnd: patch.currentPeriodEnd,
      stripeCustomerId: stripeCustomerId ?? row.stripeCustomerId,
      updatedAt: Date.now(),
    })
    .where(eq(subscriptions.userId, row.userId));
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
    switch (event.type) {
      case "checkout.session.completed": {
        const parsed = v.safeParse(checkoutCompletedObjectSchema, event.data.object);
        if (!parsed.success) {
          break;
        }
        const session = parsed.output;
        if (session.mode !== "subscription") {
          break;
        }
        if (session.payment_status !== "paid") {
          break;
        }
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId || typeof userId !== "string") {
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const custId = customerIdFromUnknown(session.customer);
        if (!subId || !custId) {
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subId);
        const patch = subscriptionSyncPatchFromStripe(sub);
        await db
          .update(subscriptions)
          .set({
            stripeCustomerId: custId,
            stripeSubscriptionId: patch.stripeSubscriptionId,
            plan: patch.plan,
            status: patch.status,
            currentPeriodEnd: patch.currentPeriodEnd,
            updatedAt: Date.now(),
          })
          .where(eq(subscriptions.userId, userId));
        break;
      }
      case "customer.subscription.updated": {
        const parsed = v.safeParse(subscriptionEventObjectSchema, event.data.object);
        if (!parsed.success) {
          break;
        }
        const subObj = parsed.output;
        const custId = customerIdFromUnknown(subObj.customer);
        const fullSub = await stripe.subscriptions.retrieve(subObj.id);
        const patch = subscriptionSyncPatchFromStripe(fullSub);
        await applySubscriptionPatchByStripeSubId(db, fullSub.id, custId, patch);
        break;
      }
      case "customer.subscription.deleted": {
        const parsed = v.safeParse(subscriptionEventObjectSchema, event.data.object);
        if (!parsed.success) {
          break;
        }
        const subObj = parsed.output;
        const custId = customerIdFromUnknown(subObj.customer);
        const fullSub = await stripe.subscriptions.retrieve(subObj.id);
        const patch = subscriptionSyncPatchFromStripe(fullSub);
        await applySubscriptionPatchByStripeSubId(db, fullSub.id, custId, patch);
        break;
      }
      case "invoice.paid": {
        const parsed = v.safeParse(invoiceEventObjectSchema, event.data.object);
        if (!parsed.success) {
          break;
        }
        const invoice = parsed.output;
        const subId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subId) {
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subId);
        const custId =
          customerIdFromUnknown(invoice.customer) ?? stripeCustomerIdFromStripeObject(sub.customer);
        const patch = subscriptionSyncPatchFromStripe(sub);
        await applySubscriptionPatchByStripeSubId(db, sub.id, custId, patch);
        break;
      }
      case "invoice.payment_failed": {
        const parsed = v.safeParse(invoiceEventObjectSchema, event.data.object);
        if (!parsed.success) {
          break;
        }
        const invoice = parsed.output;
        const custId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!custId) {
          break;
        }
        const [row] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeCustomerId, custId))
          .limit(1);
        if (row) {
          await db
            .update(subscriptions)
            .set({ status: "past_due", updatedAt: Date.now() })
            .where(eq(subscriptions.userId, row.userId));
        }
        break;
      }
      default:
        break;
    }

    await db.insert(processedStripeEvents).values({
      eventId: event.id,
      createdAt: Date.now(),
    });
  } catch (e) {
    console.error("stripe webhook handler error", e);
    return jsonError(c, 500, "INTERNAL_SERVER_ERROR", "handler error");
  }

  return c.body(null, 200);
});

export default app;
