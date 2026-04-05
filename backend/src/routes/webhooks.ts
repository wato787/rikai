import { eq } from "drizzle-orm";
import { Hono } from "hono";
import Stripe from "stripe";

import { getDb } from "../db";
import { subscriptionCurrentPeriodEndMs } from "../lib/stripe-util";
import { processedStripeEvents } from "../db/schemas/stripe-events";
import { subscriptions } from "../db/schemas/subscription";
import type { AppEnv } from "../types/hono-env";

function stripeClient(secret: string) {
  return new Stripe(secret);
}

const app = new Hono<AppEnv>();

/** POST /api/webhooks/stripe — 署名検証のみ（認証なし） */
app.post("/stripe", async (c) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? c.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return c.text("Webhook secret not configured", 400);
  }

  const signature = c.req.header("stripe-signature");
  if (!signature) {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "stripe-signature がありません。" } },
      400,
    );
  }

  const apiKey = process.env.STRIPE_SECRET_KEY ?? c.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    return c.text("Stripe API key not configured", 500);
  }

  const rawBody = await c.req.text();
  const stripe = stripeClient(apiKey);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch {
    return c.json(
      { error: { code: "VALIDATION_ERROR", message: "署名検証に失敗しました。" } },
      400,
    );
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
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId ?? session.client_reference_id;
        if (!userId || typeof userId !== "string") {
          break;
        }
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const custId =
          typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!subId || !custId) {
          break;
        }
        const sub = await stripe.subscriptions.retrieve(subId);
        const periodEnd = subscriptionCurrentPeriodEndMs(sub);
        await db
          .update(subscriptions)
          .set({
            stripeCustomerId: custId,
            stripeSubscriptionId: sub.id,
            plan: "pro",
            status: "active",
            currentPeriodEnd: periodEnd,
            updatedAt: Date.now(),
          })
          .where(eq(subscriptions.userId, userId));
        break;
      }
      case "customer.subscription.deleted": {
        const subObj = event.data.object as Stripe.Subscription;
        const [row] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subObj.id))
          .limit(1);
        if (row) {
          await db
            .update(subscriptions)
            .set({
              plan: "free",
              status: "canceled",
              stripeSubscriptionId: null,
              currentPeriodEnd: null,
              updatedAt: Date.now(),
            })
            .where(eq(subscriptions.userId, row.userId));
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
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
    return c.text("handler error", 500);
  }

  return c.body(null, 200);
});

export default app;
