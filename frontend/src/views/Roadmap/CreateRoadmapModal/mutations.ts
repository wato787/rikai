import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiPost } from "@/lib/api-client";

import { subscriptionMeQueryKey } from "@/views/Settings/queries";

import { roadmapsListQueryKey } from "../List/queries";

type RoadmapCreateVariables = { topic: string };

type RoadmapCreateResponse = { roadmapId: string };

export function roadmapCreateMutationOptions(
  queryClient: QueryClient,
  opts: { onCreated: (roadmapId: string) => void | Promise<void> },
) {
  return mutationOptions({
    mutationFn: async ({ topic }: RoadmapCreateVariables) => {
      return apiPost<RoadmapCreateResponse, { topic: string }>("/roadmaps", { topic });
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: roadmapsListQueryKey });
      await queryClient.invalidateQueries({ queryKey: subscriptionMeQueryKey });
      await opts.onCreated(data.roadmapId);
    },
  });
}
