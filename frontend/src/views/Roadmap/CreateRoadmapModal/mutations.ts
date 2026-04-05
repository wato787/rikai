import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiPost } from "@/lib/api-client";

import { roadmapsListQueryKey } from "../List/queries";

export type RoadmapCreateVariables = { topic: string };

export type RoadmapCreateResponse = { roadmapId: string };

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
      await opts.onCreated(data.roadmapId);
    },
  });
}
