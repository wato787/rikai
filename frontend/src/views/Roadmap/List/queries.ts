import { queryOptions } from "@tanstack/react-query";

import { apiGet } from "@/lib/api-client";
import type { RoadmapSummary } from "@/types/roadmap";

type ApiRoadmapListRow = {
  id: string;
  title: string;
  topic: string;
  totalNodes: number;
  completedNodes: number;
  createdAt: number | string;
};

export type ApiRoadmapsListResponse = {
  roadmaps: ApiRoadmapListRow[];
};

const mapListRow = (r: ApiRoadmapListRow): RoadmapSummary => ({
  id: r.id,
  title: r.title,
  createdAt: typeof r.createdAt === "number" ? new Date(r.createdAt).toISOString() : r.createdAt,
  totalNodes: r.totalNodes,
  completedNodes: r.completedNodes,
});

export const roadmapsListQueryKey = ["roadmaps", "list"] as const;

export const roadmapsListQueryOptions = queryOptions({
  queryKey: roadmapsListQueryKey,
  queryFn: () => apiGet<ApiRoadmapsListResponse>("/roadmaps"),
  select: (data): RoadmapSummary[] => data.roadmaps.map(mapListRow),
});
