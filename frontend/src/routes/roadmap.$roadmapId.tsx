import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { useCallback, useOptimistic } from "react";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";
import { ApiRequestError } from "@/lib/api-client";
import { RoadmapDetail } from "@/views/Roadmap";
import { roadmapNodePatchMutationOptions } from "@/views/Roadmap/Detail/mutations";
import { roadmapsDetailQueryOptions } from "@/views/Roadmap/Detail/queries";

type RoadmapOptimisticUpdate = { type: "status"; nodeId: string; status: RoadmapNode["status"] };

function applyRoadmapOptimistic(state: Roadmap, update: RoadmapOptimisticUpdate): Roadmap {
  return {
    ...state,
    nodes: state.nodes.map((n) => {
      if (n.id !== update.nodeId) return n;
      return { ...n, status: update.status };
    }),
  };
}

const DetailPending = () => (
  <div className="py-16 text-center text-zinc-500 font-medium">読み込み中…</div>
);

function RoadmapDetailError({ error }: ErrorComponentProps) {
  const err = error as unknown;
  const is404 = err instanceof ApiRequestError && err.status === 404;
  return (
    <div className="py-16 text-center space-y-4">
      <p className="text-zinc-500 font-medium">
        {is404 ? "ロードマップが見つかりませんでした。" : "読み込みに失敗しました。"}
      </p>
      <Link to="/" className="text-emerald-700 font-bold hover:underline">
        一覧へ戻る
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/roadmap/$roadmapId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(roadmapsDetailQueryOptions(params.roadmapId)),
  pendingComponent: DetailPending,
  errorComponent: RoadmapDetailError,
  component: RoadmapDetailPage,
});

function RoadmapDetailPage() {
  const { roadmapId } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: roadmap, dataUpdatedAt } = useSuspenseQuery(roadmapsDetailQueryOptions(roadmapId));

  const [optimisticRoadmap, addOptimisticRoadmap] = useOptimistic(roadmap, applyRoadmapOptimistic);

  const patchMutation = useMutation(roadmapNodePatchMutationOptions(roadmapId, queryClient));

  const handleUpdateNodeStatus = useCallback(
    (nodeId: string, status: RoadmapNode["status"]) => {
      addOptimisticRoadmap({ type: "status", nodeId, status });
      patchMutation.mutate({ nodeId, status });
    },
    [addOptimisticRoadmap, patchMutation],
  );

  return (
    <RoadmapDetail
      roadmap={optimisticRoadmap}
      syncRevision={dataUpdatedAt}
      onUpdateNodeStatus={handleUpdateNodeStatus}
    />
  );
}
