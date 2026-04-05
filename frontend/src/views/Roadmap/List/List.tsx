import { Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import type { Roadmap } from "@/types/roadmap";

export type RoadmapListProps = {
  roadmaps: Roadmap[];
  onSelect: (roadmap: Roadmap) => void;
  onDelete: (id: string) => void;
  onCreateClick: () => void;
};

export function RoadmapList({ roadmaps, onSelect, onDelete, onCreateClick }: RoadmapListProps) {
  const calculateProgress = (roadmap: Roadmap) => {
    if (roadmap.nodes.length === 0) return 0;
    const completed = roadmap.nodes.filter((n) => n.status === "completed").length;
    return Math.round((completed / roadmap.nodes.length) * 100);
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
          onClick={onCreateClick}
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
            <p className="text-zinc-400 font-medium">ロードマップがまだありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {roadmaps.map((roadmap, index) => (
              <motion.button
                key={roadmap.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelect(roadmap)}
                className="group w-full text-left bg-white border border-zinc-100 p-8 flex items-center justify-between hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5 transition-all cursor-pointer rounded-[2rem]"
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

                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(roadmap.id);
                    }}
                    className="p-2 text-zinc-200 hover:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-600/30 transition-all duration-300 font-bold text-xs">
                    開く
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
