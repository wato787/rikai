import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { mockGenerateRoadmap, useRoadmapMock } from "@/views/Roadmap/Mock";

export const CreateRoadmapModal = () => {
  const { isCreateModalOpen, closeCreateModal, addRoadmap } = useRoadmapMock();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!isCreateModalOpen) {
      setTitle("");
      setTopic("");
    }
  }, [isCreateModalOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isPending) return;
    const topicForGen = title.trim() ? `${title.trim()} — ${topic.trim()}` : topic.trim();
    setIsPending(true);
    try {
      const generated = await mockGenerateRoadmap(topicForGen);
      addRoadmap({
        id: crypto.randomUUID(),
        title: generated.title,
        nodes: generated.nodes,
        edges: generated.edges,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      closeCreateModal();
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AnimatePresence>
      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCreateModal}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-zinc-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-roadmap-title"
          >
            <div className="p-12">
              <div className="flex items-center justify-between mb-10">
                <h2
                  id="create-roadmap-title"
                  className="text-2xl font-bold text-zinc-900 tracking-tight"
                >
                  ロードマップ作成
                </h2>
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                  aria-label="閉じる"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="create-roadmap-title-input"
                      className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1"
                    >
                      タイトル
                    </label>
                    <input
                      id="create-roadmap-title-input"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="ロードマップの名称（任意・学習目標と併せて送信されます）"
                      className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="create-roadmap-topic"
                      className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1"
                    >
                      学習目標
                    </label>
                    <textarea
                      id="create-roadmap-topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="習得したいスキルや目標を入力してください..."
                      className="w-full h-32 px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 transition-all resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!topic.trim() || isPending}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98]"
                >
                  {isPending ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      <span className="tracking-tight">構築中...</span>
                    </>
                  ) : (
                    <>
                      <span className="tracking-tight">作成する</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
