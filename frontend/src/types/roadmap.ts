export type RoadmapNodeStatus = "not_started" | "in_progress" | "completed";

export interface RoadmapNode {
  id: string;
  label: string;
  description: string;
  level: number;
  status: RoadmapNodeStatus;
  position?: { x: number; y: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface Roadmap {
  id: string;
  title: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  createdAt: string;
  updatedAt: string;
}
