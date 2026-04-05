import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback } from "react";
import type { RoadmapNode } from "@/types/roadmap";
import { RoadmapDetail, useRoadmapMock } from "@/views/Roadmap";

export const Route = createFileRoute("/roadmap/$roadmapId")({
  component: RoadmapDetailPage,
});

function RoadmapDetailPage() {
  const { roadmapId } = Route.useParams();
  const { roadmaps, updateNodeStatus } = useRoadmapMock();
  const roadmap = roadmaps.find((r) => r.id === roadmapId);

  const handleUpdateNodeStatus = useCallback(
    (nodeId: string, status: RoadmapNode["status"]) => {
      updateNodeStatus(roadmapId, nodeId, status);
    },
    [roadmapId, updateNodeStatus],
  );

  if (!roadmap) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-zinc-500 font-medium">ロードマップが見つかりませんでした。</p>
        <Link to="/" className="text-emerald-700 font-bold hover:underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  return <RoadmapDetail roadmap={roadmap} onUpdateNodeStatus={handleUpdateNodeStatus} />;
}
