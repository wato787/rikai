import { mutationOptions, type QueryClient } from "@tanstack/react-query";

import { apiPatch } from "@/lib/api-client";
import type { RoadmapNodeStatus } from "@/types/roadmap";

import { roadmapsDetailQueryKey } from "./queries";

export type RoadmapNodePatchVariables = {
  nodeId: string;
  status?: RoadmapNodeStatus;
  label?: string;
  description?: string;
  positionX?: number;
  positionY?: number;
};

export type RoadmapNodePatchResponse = {
  node: {
    id: string;
    label: string;
    description: string;
    status: string;
    positionX?: number | null;
    positionY?: number | null;
    updatedAt: number;
  };
};

function buildNodePatchBody(vars: RoadmapNodePatchVariables): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (vars.status !== undefined) body.status = vars.status;
  if (vars.label !== undefined) body.label = vars.label;
  if (vars.description !== undefined) body.description = vars.description;
  if (vars.positionX !== undefined && vars.positionY !== undefined) {
    body.positionX = vars.positionX;
    body.positionY = vars.positionY;
  }
  return body;
}

export function roadmapNodePatchMutationOptions(roadmapId: string, queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: async (vars: RoadmapNodePatchVariables) => {
      const { nodeId } = vars;
      return apiPatch<RoadmapNodePatchResponse>(
        `/roadmaps/${encodeURIComponent(roadmapId)}/nodes/${encodeURIComponent(nodeId)}`,
        buildNodePatchBody(vars),
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: roadmapsDetailQueryKey(roadmapId) });
    },
  });
}
