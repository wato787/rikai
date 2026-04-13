import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { Roadmap, RoadmapNodeStatus } from "@/types/roadmap";

/** `List/queries` の `["roadmaps", "list"]` とプレフィックスを揃える */
const roadmapsQueryKey = ["roadmaps"] as const;

export function roadmapsDetailQueryKey(id: string) {
  return [...roadmapsQueryKey, "detail", id] as const;
}

/** GET /roadmaps/:id */
type RoadmapDetailJson = {
  roadmap: { id: string; title: string; topic: string; createdAt: number };
  nodes: Array<{
    id: string;
    label: string;
    description: string;
    status: RoadmapNodeStatus;
    orderIndex: number;
    positionX?: number | null;
    positionY?: number | null;
  }>;
  edges: Array<{ id: string; sourceId: string; targetId: string }>;
};

function mapDetailJsonToRoadmap(d: RoadmapDetailJson): Roadmap {
  const sorted = [...d.nodes].sort((a, b) => a.orderIndex - b.orderIndex);
  const createdAt =
    typeof d.roadmap.createdAt === "number"
      ? new Date(d.roadmap.createdAt).toISOString()
      : String(d.roadmap.createdAt);

  return {
    id: d.roadmap.id,
    title: d.roadmap.title,
    createdAt,
    updatedAt: createdAt,
    nodes: sorted.map((n, idx) => {
      const px = n.positionX;
      const py = n.positionY;
      const hasSaved = px != null && py != null && Number.isFinite(px) && Number.isFinite(py);
      return {
        id: n.id,
        label: n.label,
        description: n.description,
        status: n.status,
        level: 0,
        position: hasSaved ? { x: px, y: py } : { x: 0, y: idx * 180 },
      };
    }),
    edges: d.edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
    })),
  };
}

export function roadmapsDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: roadmapsDetailQueryKey(id),
    queryFn: () => apiGet<RoadmapDetailJson>(`/roadmaps/${encodeURIComponent(id)}`),
    select: (data): Roadmap => mapDetailJsonToRoadmap(data),
  });
}
