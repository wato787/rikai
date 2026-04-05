import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiDelete } from "@/lib/api-client";

import { roadmapsDetailQueryKey } from "../Detail/queries";
import { roadmapsListQueryKey } from "./queries";

export type RoadmapDeleteVariables = { roadmapId: string };

export function roadmapDeleteMutationOptions(
  queryClient: QueryClient,
  opts?: { onDeleted?: () => void | Promise<void> },
) {
  return mutationOptions({
    mutationFn: async ({ roadmapId }: RoadmapDeleteVariables) => {
      await apiDelete(`/roadmaps/${encodeURIComponent(roadmapId)}`);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: roadmapsListQueryKey });
      queryClient.removeQueries({ queryKey: roadmapsDetailQueryKey(variables.roadmapId) });
      await opts?.onDeleted?.();
    },
  });
}
