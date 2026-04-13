import type Stripe from "stripe";

import { subscriptionCurrentPeriodEndMs } from "./stripe-util";

/**
 * Webhook の Invoice ペイロードには `subscription` が付くが、Stripe SDK v22 の型定義に
 * 含まれない場合があるため、ランタイムで読み取る。
 */
export function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };
  const s = inv.subscription;
  if (typeof s === "string") return s;
  if (s && typeof s === "object" && "id" in s) return s.id;
  return null;
}

/** DB `subscriptions` 行への部分更新用（Webhook / 同期） */
export type SubscriptionSyncPatch = {
  plan: "free" | "pro";
  status: "active" | "inactive" | "canceled" | "past_due";
  stripeSubscriptionId: string | null;
  currentPeriodEnd: number | null;
};

/**
 * Stripe Subscription からアプリ側の plan / status を導出する。
 * @see https://docs.stripe.com/billing/subscriptions/webhooks
 */
export function subscriptionSyncPatchFromStripe(sub: Stripe.Subscription): SubscriptionSyncPatch {
  const periodEnd = subscriptionCurrentPeriodEndMs(sub);
  const s = sub.status;

  if (s === "canceled" || s === "incomplete_expired") {
    return {
      plan: "free",
      status: "canceled",
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
    };
  }

  if (s === "incomplete") {
    return {
      plan: "free",
      status: "inactive",
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: null,
    };
  }

  if (s === "active" || s === "trialing") {
    return {
      plan: "pro",
      status: "active",
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd,
    };
  }

  if (s === "past_due" || s === "unpaid") {
    return {
      plan: "pro",
      status: "past_due",
      stripeSubscriptionId: sub.id,
      currentPeriodEnd: periodEnd,
    };
  }

  return {
    plan: "pro",
    status: "inactive",
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: periodEnd,
  };
}

export function stripeCustomerIdFromStripeObject(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | null {
  if (typeof customer === "string") return customer;
  if (customer && typeof customer === "object" && "deleted" in customer && customer.deleted) {
    return null;
  }
  if (customer && typeof customer === "object" && "id" in customer) {
    return customer.id;
  }
  return null;
}
