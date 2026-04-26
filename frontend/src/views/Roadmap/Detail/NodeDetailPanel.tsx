import { Fragment, useEffect } from "react";
import { createPortal } from "react-dom";
import { BookOpen, CheckCircle2, Circle, ExternalLink, Info, Loader2, X } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import type { RoadmapNode } from "@/types/roadmap";

function parseLearningPoints(description: string): string[] {
  const sectionPoints = extractSectionItems(description, "学習ポイント");
  if (sectionPoints.length > 0) return sectionPoints.slice(0, 8);
  const trimmed = description.trim();
  if (!trimmed) return [];
  const lines = trimmed.split("\n").flatMap((s) => {
    const value = s.trim();
    return value ? [value] : [];
  });
  if (lines.length >= 2) {
    return lines.slice(0, 8);
  }
  const sentences = trimmed.split(/[。\n]+/).flatMap((s) => {
    const value = s.trim();
    return value ? [value] : [];
  });
  return sentences.slice(0, 5);
}

type ParsedSource = {
  title: string;
  href: string;
  reason: string;
};

function extractSectionItems(description: string, heading: string): string[] {
  const lines = description.split("\n").map((line) => line.trim());
  const start = lines.findIndex((line) => line === heading);
  if (start < 0) return [];
  const items: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    if (!line.startsWith("- ")) {
      if (items.length > 0) break;
      continue;
    }
    items.push(line.slice(2).trim());
  }
  return items;
}

function parseTrustedSources(description: string): ParsedSource[] {
  const lines = extractSectionItems(description, "参考リンク");
  return lines
    .map((line) => {
      const [titleRaw, hrefRaw, reasonRaw] = line.split("|").map((v) => v.trim());
      if (!titleRaw || !hrefRaw || !reasonRaw) return null;
      if (!/^https:\/\/\S+/i.test(hrefRaw)) return null;
      return { title: titleRaw, href: hrefRaw, reason: reasonRaw };
    })
    .filter((v): v is ParsedSource => v !== null);
}

type NodeDetailPanelProps = {
  node: RoadmapNode | null;
  onClose: () => void;
  onUpdateStatus: (nodeId: string, status: RoadmapNode["status"]) => void;
};

export function NodeDetailPanel({ node, onClose, onUpdateStatus }: NodeDetailPanelProps) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [node, onClose]);

  const learningPoints = node ? parseLearningPoints(node.description) : [];
  const trustedSources = node ? parseTrustedSources(node.description) : [];

  if (!node) return null;
  if (typeof document === "undefined") return null;

  const overlay = (
    <AnimatePresence>
      <Fragment key={node.id}>
        <m.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.2 }}
          onClick={onClose}
          aria-label="パネルを閉じる"
          className="fixed inset-0 z-[100] bg-zinc-900/5 backdrop-blur-[2px]"
        />

        <m.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={
            reduceMotion
              ? { duration: 0.2, ease: "easeOut" }
              : { type: "spring", damping: 25, stiffness: 200 }
          }
          role="dialog"
          aria-modal="true"
          aria-labelledby="node-detail-title"
          className="fixed top-0 right-0 bottom-0 z-[110] flex max-h-dvh w-[min(100%,520px)] flex-col border-l border-zinc-100 bg-white shadow-2xl"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-50 p-6">
            <div
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${
                node.status === "completed"
                  ? "bg-emerald-50 text-emerald-600"
                  : node.status === "in_progress"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-zinc-50 text-zinc-400"
              }`}
            >
              {node.status === "completed"
                ? "完了"
                : node.status === "in_progress"
                  ? "進行中"
                  : "未着手"}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-zinc-300 transition-all hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
              aria-label="閉じる"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-10 overflow-y-auto overscroll-contain p-8">
            <section className="space-y-4">
              <h2
                id="node-detail-title"
                className="text-2xl font-bold tracking-tight text-pretty text-zinc-900 leading-tight"
              >
                {node.label}
              </h2>
              {node.description ? (
                <p className="text-sm font-medium leading-relaxed text-zinc-500 whitespace-pre-wrap">
                  {node.description}
                </p>
              ) : (
                <p className="text-sm font-medium text-zinc-400">説明はまだありません。</p>
              )}
            </section>

            <section className="space-y-6">
              <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
                <BookOpen size={14} aria-hidden />
                推奨リソース
              </h3>
              <div className="space-y-3">
                {trustedSources.length > 0 ? (
                  trustedSources.map((resource) => (
                    <a
                      key={`${resource.title}-${resource.href}`}
                      href={resource.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-all hover:border-emerald-500/30 hover:bg-emerald-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm transition-colors group-hover:text-emerald-600">
                          <BookOpen size={14} aria-hidden />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block text-sm font-bold text-zinc-900">
                            {resource.title}
                          </span>
                          <span className="block text-[11px] font-medium text-zinc-500">
                            {resource.reason}
                          </span>
                        </span>
                      </span>
                      <ExternalLink
                        size={14}
                        className="shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-500"
                        aria-hidden
                      />
                    </a>
                  ))
                ) : (
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${node.label} 公式 ドキュメント`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex w-full items-center justify-between rounded-2xl border border-zinc-100 bg-zinc-50 p-4 transition-all hover:border-emerald-500/30 hover:bg-emerald-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 shadow-sm transition-colors group-hover:text-emerald-600">
                        <BookOpen size={14} aria-hidden />
                      </span>
                      <span className="min-w-0 text-left">
                        <span className="block text-sm font-bold text-zinc-900">
                          公式情報を検索
                        </span>
                        <span className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
                          Fallback
                        </span>
                      </span>
                    </span>
                    <ExternalLink
                      size={14}
                      className="shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-500"
                      aria-hidden
                    />
                  </a>
                )}
              </div>
            </section>

            {learningPoints.length > 0 ? (
              <section className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  <Info size={14} aria-hidden />
                  学習のポイント
                </h3>
                <ul className="space-y-3">
                  {learningPoints.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-3 text-sm font-medium text-zinc-600"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span className="min-w-0 text-pretty">{point}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <div className="shrink-0 border-t border-zinc-50 p-8">
            <div className="flex gap-1 rounded-2xl bg-zinc-100 p-1">
              {(
                [
                  {
                    id: "not_started" as const,
                    label: "未着手",
                    icon: <Circle size={14} aria-hidden />,
                    activeClass: "bg-white text-zinc-900 shadow-sm",
                  },
                  {
                    id: "in_progress" as const,
                    label: "進行中",
                    icon: (
                      <Loader2
                        size={14}
                        className={reduceMotion ? "" : "animate-spin"}
                        aria-hidden
                      />
                    ),
                    activeClass: "bg-amber-500 text-white shadow-sm",
                  },
                  {
                    id: "completed" as const,
                    label: "完了",
                    icon: <CheckCircle2 size={14} aria-hidden />,
                    activeClass: "bg-emerald-500 text-white shadow-sm",
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onUpdateStatus(node.id, item.id)}
                  className={`flex flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 ${
                    node.status === item.id ? item.activeClass : "text-zinc-400 hover:text-zinc-600"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </m.aside>
      </Fragment>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
