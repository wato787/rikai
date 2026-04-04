import type { Roadmap, RoadmapEdge, RoadmapNode } from "@/types/roadmap";

export type MockGeneratedRoadmap = Pick<Roadmap, "title" | "nodes" | "edges">;

/** サーバー未接続時の疑似生成（UI のローディング再現用に短い遅延あり） */
export async function mockGenerateRoadmap(topic: string): Promise<MockGeneratedRoadmap> {
  await new Promise((r) => setTimeout(r, 650));
  const base = crypto.randomUUID();
  const nodes: RoadmapNode[] = [
    {
      id: `${base}-a`,
      label: `${topic.slice(0, 24)}の基礎`,
      description: "全体像と前提知識を押さえます。",
      level: 1,
      status: "not_started",
    },
    {
      id: `${base}-b`,
      label: "コア概念",
      description: "重要な考え方と用語を整理します。",
      level: 2,
      status: "not_started",
    },
    {
      id: `${base}-c`,
      label: "実践課題",
      description: "手を動かして定着させます。",
      level: 3,
      status: "not_started",
    },
  ];
  const edges: RoadmapEdge[] = [];
  return {
    title: topic.trim().slice(0, 80) || "新しいロードマップ",
    nodes,
    edges,
  };
}
