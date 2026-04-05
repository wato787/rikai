import { createAuthClient } from "better-auth/react";

/**
 * 開発時は Vite が /api を backend にプロキシするため、同一オリジンで Cookie が扱いやすい。
 */
const baseURL = typeof window !== "undefined" ? `${window.location.origin}/api/auth` : "/api/auth";

export const authClient = createAuthClient({
  baseURL,
});
