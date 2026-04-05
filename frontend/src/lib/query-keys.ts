/**
 * TanStack Query の queryKey を一元管理する（ロードマップ API 接続時に利用）。
 */
export const queryKeys = {
  roadmaps: {
    all: ["roadmaps"] as const,
    list: () => [...queryKeys.roadmaps.all, "list"] as const,
    detail: (id: string) => [...queryKeys.roadmaps.all, "detail", id] as const,
  },
  subscription: {
    me: ["subscription", "me"] as const,
  },
} as const;
