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

type ApiRoadmapsListResponse = {
  roadmaps: ApiRoadmapListRow[];
};

const mapListRow = (r: ApiRoadmapListRow): RoadmapSummary => ({
  id: r.id,
  title: r.title,
  createdAt: typeof r.createdAt === "number" ? new Date(r.createdAt).toISOString() : r.createdAt,
  totalNodes: r.totalNodes,
  completedNodes: r.completedNodes,
});

export async function fetchRoadmapsList(): Promise<RoadmapSummary[]> {
  const res = await apiGet<ApiRoadmapsListResponse>("/roadmaps");
  return res.roadmaps.map(mapListRow);
}

export const roadmapsListQueryOptions = queryOptions({
  queryKey: ["roadmaps", "list"] as const,
  queryFn: fetchRoadmapsList,
});
