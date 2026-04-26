import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";

export const subscriptionMeQueryKey = ["subscriptions", "me"] as const;

type SubscriptionMeJson = {
  subscription: {
    creditModel: "credits";
    remainingCredits: number;
    costPerRoadmapGeneration: number;
  };
};

export function subscriptionMeQueryOptions() {
  return queryOptions({
    queryKey: subscriptionMeQueryKey,
    queryFn: () => apiGet<SubscriptionMeJson>("/subscriptions/me"),
  });
}
