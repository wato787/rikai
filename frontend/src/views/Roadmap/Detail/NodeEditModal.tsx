import { useState, type FormEvent } from "react";
import { Loader2, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

import { ApiRequestError } from "@/lib/api-client";
import type { RoadmapNode } from "@/types/roadmap";

export type NodeEditModalProps = {
  node: RoadmapNode | null;
  onClose: () => void;
  onSave: (nodeId: string, label: string, description: string) => Promise<void>;
};

export function NodeEditModal({ node, onClose, onSave }: NodeEditModalProps) {
  return (
    <AnimatePresence>
      {node ? (
        <NodeEditModalForm key={node.id} node={node} onClose={onClose} onSave={onSave} />
      ) : null}
    </AnimatePresence>
  );
}

function NodeEditModalForm({
  node,
  onClose,
  onSave,
}: {
  node: RoadmapNode;
  onClose: () => void;
  onSave: (nodeId: string, label: string, description: string) => Promise<void>;
}) {
  const [label, setLabel] = useState(node.label);
  const [description, setDescription] = useState(node.description);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = label.trim();
    if (trimmed.length < 1 || isPending) return;
    setErrorMessage(null);
    setIsPending(true);
    try {
      await onSave(node.id, trimmed, description);
      onClose();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("保存に失敗しました。");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
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
        aria-labelledby="node-edit-title"
      >
        <form onSubmit={handleSubmit} className="p-12">
          <div className="flex items-center justify-between mb-10">
            <h2 id="node-edit-title" className="text-2xl font-bold text-zinc-900 tracking-tight">
              ステップを編集
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-zinc-300 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
              aria-label="閉じる"
            >
              <X size={20} />
            </button>
          </div>

          {errorMessage ? (
            <p className="mb-6 text-sm text-red-600 font-medium" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="space-y-6 mb-10">
            <div className="space-y-2">
              <label
                htmlFor="node-edit-label"
                className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1"
              >
                タイトル
              </label>
              <input
                id="node-edit-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={500}
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="node-edit-description"
                className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest ml-1"
              >
                説明（任意）
              </label>
              <textarea
                id="node-edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={5000}
                rows={4}
                className="w-full px-6 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:border-zinc-900 transition-all resize-none font-medium leading-relaxed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!label.trim() || isPending}
            className="w-full flex items-center justify-center gap-3 py-5 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-zinc-900/20 active:scale-[0.98]"
          >
            {isPending ? (
              <>
                <Loader2 size={20} className="animate-spin" aria-hidden />
                <span className="tracking-tight">保存中…</span>
              </>
            ) : (
              <span className="tracking-tight">保存する</span>
            )}
          </button>
        </form>
      </m.div>
    </div>
  );
}
