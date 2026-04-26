import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";
import { startTransition, useCallback, useOptimistic } from "react";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";
import { ApiRequestError } from "@/lib/api-client";
import { RoadmapDetail } from "@/views/Roadmap";
import { roadmapNodePatchMutationOptions } from "@/views/Roadmap/Detail/mutations";
import { roadmapsDetailQueryOptions } from "@/views/Roadmap/Detail/queries";
import { useDebouncedNodePositionSave } from "@/views/Roadmap/Detail/useDebouncedNodePositionSave";

const POSITION_SAVE_DEBOUNCE_MS = 400;

type RoadmapOptimisticUpdate =
  | { type: "position"; nodeId: string; x: number; y: number }
  | { type: "status"; nodeId: string; status: RoadmapNode["status"] };

function applyRoadmapOptimistic(state: Roadmap, update: RoadmapOptimisticUpdate): Roadmap {
  return {
    ...state,
    nodes: state.nodes.map((n) => {
      if (n.id !== update.nodeId) return n;
      if (update.type === "position") return { ...n, position: { x: update.x, y: update.y } };
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

  const persistNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      startTransition(async () => {
        addOptimisticRoadmap({ type: "position", nodeId, x, y });
        await patchMutation.mutateAsync({
          nodeId,
          positionX: x,
          positionY: y,
        });
      });
    },
    [addOptimisticRoadmap, patchMutation],
  );

  const schedulePositionSave = useDebouncedNodePositionSave(persistNodePosition, {
    wait: POSITION_SAVE_DEBOUNCE_MS,
    flushScopeKey: roadmapId,
  });

  const handleUpdateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      const node = optimisticRoadmap.nodes.find((n) => n.id === nodeId);
      const px = node?.position?.x;
      const py = node?.position?.y;
      const same =
        px !== undefined && py !== undefined && Math.abs(px - x) < 0.5 && Math.abs(py - y) < 0.5;
      if (same) return;

      schedulePositionSave(nodeId, x, y);
    },
    [optimisticRoadmap.nodes, schedulePositionSave],
  );

  return (
    <RoadmapDetail
      roadmap={optimisticRoadmap}
      syncRevision={dataUpdatedAt}
      onUpdateNodeStatus={handleUpdateNodeStatus}
      onUpdateNodePosition={handleUpdateNodePosition}
    />
  );
}
