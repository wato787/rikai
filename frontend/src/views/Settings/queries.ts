/**
 * 設定ルートの loader とページコンポーネントで共有するクエリ。
 * 実体は `@/lib/auth-session`（ロードマップ一覧の `List/queries` と同じ役割）。
 */
export {
  type AuthSessionUser,
  sessionQueryKey,
  sessionQueryOptions,
  type SessionPayload,
} from "@/lib/auth-session";
