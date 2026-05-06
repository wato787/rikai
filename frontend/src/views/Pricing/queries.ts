import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";

export const billingMeQueryKey = ["billing", "me"] as const;

type BillingMeJson = {
  billing: {
    creditModel: "credits";
    remainingCredits: number;
    costPerRoadmapGeneration: number;
  };
};

export function billingMeQueryOptions() {
  return queryOptions({
    queryKey: billingMeQueryKey,
    queryFn: () => apiGet<BillingMeJson>("/billing/me"),
  });
}
