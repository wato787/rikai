import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  Link,
  type ErrorComponentProps,
  useNavigate,
} from "@tanstack/react-router";
import { useCallback } from "react";
import type { RoadmapNode } from "@/types/roadmap";
import { ApiRequestError } from "@/lib/api-client";
import { RoadmapDetail } from "@/views/Roadmap";
import { roadmapNodeStatusPatchMutationOptions } from "@/views/Roadmap/Detail/mutations";
import { roadmapsDetailQueryOptions } from "@/views/Roadmap/Detail/queries";
import { roadmapDeleteMutationOptions } from "@/views/Roadmap/List/mutations";

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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: roadmap } = useSuspenseQuery(roadmapsDetailQueryOptions(roadmapId));

  const patchMutation = useMutation(roadmapNodeStatusPatchMutationOptions(roadmapId, queryClient));

  const deleteMutation = useMutation({
    ...roadmapDeleteMutationOptions(queryClient, {
      onDeleted: () => navigate({ to: "/" }),
    }),
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : "削除に失敗しました。");
    },
  });

  const handleUpdateNodeStatus = useCallback(
    (nodeId: string, status: RoadmapNode["status"]) => {
      patchMutation.mutate({ nodeId, status });
    },
    [patchMutation],
  );

  const handleDeleteRoadmap = useCallback(() => {
    const ok = window.confirm(`「${roadmap.title}」を削除しますか？この操作は取り消せません。`);
    if (!ok) return;
    deleteMutation.mutate({ roadmapId });
  }, [deleteMutation, roadmap.title, roadmapId]);

  return (
    <RoadmapDetail
      roadmap={roadmap}
      onUpdateNodeStatus={handleUpdateNodeStatus}
      onDeleteRoadmap={handleDeleteRoadmap}
      isDeletePending={deleteMutation.isPending}
    />
  );
}
