import type { ReactNode } from "react";

type SoftTooltipProps = {
  label: ReactNode;
  children: ReactNode;
  enabled?: boolean;
  side?: "right" | "top";
  className?: string;
};

/**
 * サイドバー向けツールチップ（ホバー時のみ表示）
 * 位置は常に固定し、不透明度のみ変化させる（transform の補間によるガクつき防止）
 */
export function SoftTooltip({
  label,
  children,
  enabled = true,
  side = "right",
  className = "inline-flex max-w-full",
}: SoftTooltipProps) {
  if (!enabled) {
    return <>{children}</>;
  }

  const bubbleClasses =
    side === "right"
      ? "left-full top-1/2 z-[200] ml-2.5 -translate-y-1/2"
      : "bottom-full left-1/2 z-[200] mb-2 -translate-x-1/2";

  return (
    <span className={`group/tooltip relative touch-manipulation ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute w-max max-w-[min(17rem,calc(100vw-4.5rem))] rounded-lg bg-white px-3 py-2 text-left text-xs font-medium leading-snug text-zinc-600 opacity-0 shadow-lg shadow-zinc-900/8 ring-1 ring-zinc-950/[0.06] transition-opacity duration-150 ease-out motion-reduce:transition-none group-hover/tooltip:opacity-100 ${bubbleClasses}`}
      >
        {label}
      </span>
    </span>
  );
}
