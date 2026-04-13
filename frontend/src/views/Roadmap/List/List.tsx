import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { m } from "motion/react";
import type { RoadmapSummary } from "@/types/roadmap";

import { roadmapDeleteMutationOptions } from "./mutations";
import { roadmapsListQueryOptions } from "./queries";

type RoadmapListProps = {
  onOpenCreate: () => void;
};

export function RoadmapList({ onOpenCreate }: RoadmapListProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: roadmaps } = useSuspenseQuery(roadmapsListQueryOptions);

  const deleteMutation = useMutation({
    ...roadmapDeleteMutationOptions(queryClient),
    onError: (error) => {
      window.alert(error instanceof Error ? error.message : "削除に失敗しました。");
    },
  });

  const requestDelete = (roadmap: RoadmapSummary) => {
    const ok = window.confirm(`「${roadmap.title}」を削除しますか？この操作は取り消せません。`);
    if (!ok) return;
    deleteMutation.mutate({ roadmapId: roadmap.id });
  };

  const calculateProgress = (r: RoadmapSummary) => {
    if (r.totalNodes === 0) return 0;
    return Math.round((r.completedNodes / r.totalNodes) * 100);
  };

  return (
    <div className="space-y-16">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-bold text-zinc-900 tracking-tight">ロードマップ</h1>
          <p className="text-zinc-400 mt-3 font-medium">
            あなたの学習の旅を、穏やかにサポートします。
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
        >
          <Plus size={18} />
          <span>作成</span>
        </button>
      </header>

      <div className="space-y-6">
        {roadmaps.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed border-zinc-100 rounded-3xl bg-white/50">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus size={32} className="text-emerald-200" />
            </div>
            <p className="text-zinc-400 font-medium mb-8">ロードマップがまだありません</p>
            <button
              type="button"
              onClick={onOpenCreate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20"
            >
              <Plus size={18} />
              <span>ロードマップを作成</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {roadmaps.map((roadmap, index) => (
              <m.div
                key={roadmap.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex w-full items-stretch bg-white border border-zinc-100 rounded-[2rem] hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => {
                    navigate({ to: "/roadmap/$roadmapId", params: { roadmapId: roadmap.id } });
                  }}
                  className="flex flex-1 min-w-0 items-center justify-between gap-4 p-8 text-left cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        {calculateProgress(roadmap)}% 完了
                      </span>
                      <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                        {new Date(roadmap.createdAt)
                          .toLocaleDateString("ja-JP", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                          .replace(/\//g, ".")}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 truncate group-hover:text-emerald-700 transition-colors">
                      {roadmap.title}
                    </h3>
                  </div>

                  <div className="w-14 h-14 shrink-0 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-600/30 transition-all duration-300 font-bold text-xs">
                    開く
                  </div>
                </button>

                <div className="flex items-center border-l border-zinc-100 pr-2 pl-1">
                  <button
                    type="button"
                    onClick={() => requestDelete(roadmap)}
                    disabled={
                      deleteMutation.isPending && deleteMutation.variables?.roadmapId === roadmap.id
                    }
                    className="p-4 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    aria-label={`「${roadmap.title}」を削除`}
                  >
                    <Trash2 size={20} strokeWidth={2} />
                  </button>
                </div>
              </m.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
