import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";

export const subscriptionMeQueryKey = ["subscriptions", "me"] as const;

export type SubscriptionMeJson = {
  subscription: {
    plan: "free" | "pro";
    status: string;
    currentPeriodEnd: number | null;
    aiUsage: {
      usedThisMonth: number;
      limitThisMonth: number;
      month: string;
    };
  };
};

export function subscriptionMeQueryOptions() {
  return queryOptions({
    queryKey: subscriptionMeQueryKey,
    queryFn: () => apiGet<SubscriptionMeJson>("/subscriptions/me"),
  });
}
