import { queryOptions } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

export const sessionQueryKey = ["auth", "session"] as const;

/** Better Auth のセッションで参照する user の形 */
type AuthSessionUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type SessionPayload = {
  user: AuthSessionUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date | string;
    token: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
  };
};

async function fetchSession(): Promise<SessionPayload | null> {
  const res = await authClient.getSession();
  if (res.error) {
    throw new Error(res.error.message ?? "セッションの取得に失敗しました。");
  }
  return (res.data ?? null) as SessionPayload | null;
}

export const sessionQueryOptions = queryOptions({
  queryKey: sessionQueryKey,
  queryFn: fetchSession,
});

/** オープンリダイレクトを防ぎ、アプリ内パス（先頭 `/`）のみ許可 */
function parseInternalRedirect(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) {
    return undefined;
  }
  return raw;
}

/** `/login`・`/signup` のクエリ `redirect` を検証 */
export function parseAuthPageSearch(search: Record<string, unknown>): { redirect?: string } {
  const r = parseInternalRedirect(search.redirect);
  return r ? { redirect: r } : {};
}
