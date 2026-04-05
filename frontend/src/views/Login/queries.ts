import { queryOptions } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

/** 他 View の `sessionQueryKey` と同一である必要がある（キャッシュ共有・無効化のため） */
export const sessionQueryKey = ["auth", "session"] as const;

export type SessionPayload = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>["data"]>;

export async function fetchSession(): Promise<SessionPayload | null> {
  const res = await authClient.getSession();
  if (res.error) {
    throw new Error(res.error.message ?? "セッションの取得に失敗しました。");
  }
  return res.data ?? null;
}

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: fetchSession,
});
