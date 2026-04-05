import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiPatch } from "@/lib/api-client";
import type { RoadmapNodeStatus } from "@/types/roadmap";

import { roadmapsDetailQueryKey } from "./queries";

export type RoadmapNodePatchVariables = {
  nodeId: string;
  status: RoadmapNodeStatus;
};

export type RoadmapNodePatchResponse = {
  node: { id: string; status: string; updatedAt: number };
};

export function roadmapNodeStatusPatchMutationOptions(roadmapId: string, queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: async ({ nodeId, status }: RoadmapNodePatchVariables) => {
      return apiPatch<RoadmapNodePatchResponse>(
        `/roadmaps/${encodeURIComponent(roadmapId)}/nodes/${encodeURIComponent(nodeId)}`,
        { status },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roadmapsDetailQueryKey(roadmapId) });
    },
  });
}
