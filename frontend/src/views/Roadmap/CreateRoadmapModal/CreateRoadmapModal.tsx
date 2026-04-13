import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import type { UseToggleReturn } from "@/hooks/useToggle";
import { ApiRequestError } from "@/lib/api-client";

import { roadmapCreateMutationOptions } from "./mutations";

type CreateRoadmapModalProps = {
  /** 開閉状態（`useToggle`） */
  toggle: UseToggleReturn;
};

export function CreateRoadmapModal(props: CreateRoadmapModalProps) {
  return (
    <AnimatePresence>
      {props.toggle.isOpen ? <CreateRoadmapModalForm toggle={props.toggle} /> : null}
    </AnimatePresence>
  );
}

function CreateRoadmapModalForm({ toggle }: { toggle: UseToggleReturn }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");

  const {
    mutate: createRoadmap,
    isPending,
    isError,
    error,
  } = useMutation(
    roadmapCreateMutationOptions(queryClient, {
      onCreated: async (roadmapId) => {
        toggle.handleClose();
        await navigate({ to: "/roadmap/$roadmapId", params: { roadmapId } });
      },
    }),
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || isPending) return;
    const topicForGen = title.trim() ? `${title.trim()} — ${topic.trim()}` : topic.trim();
    createRoadmap({ topic: topicForGen });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={toggle.handleClose}
        className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
        aria-hidden
      />

      <m.div
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
              onClick={toggle.handleClose}
              className="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {isError ? (
            <p className="mb-6 text-sm text-red-600 font-medium" role="alert">
              {error instanceof ApiRequestError && error.code === "GEMINI_NOT_CONFIGURED"
                ? "AI によるロードマップ生成は、サーバーに GEMINI_API_KEY が設定されるまで利用できません。"
                : error instanceof ApiRequestError && error.code === "AI_GENERATION_LIMIT_EXCEEDED"
                  ? error.message
                  : error instanceof ApiRequestError && error.code === "ROADMAP_LIMIT_EXCEEDED"
                    ? error.message
                    : error instanceof ApiRequestError
                      ? error.message
                      : error instanceof Error
                        ? error.message
                        : "作成に失敗しました。"}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-8">
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
                  placeholder="例: Web開発入門（任意）"
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
                  placeholder="学びたいこと・目標を入力"
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
      </m.div>
    </div>
  );
}
