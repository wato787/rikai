import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ROADMAP_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | "GEMINI_NOT_CONFIGURED"
  | "AI_GENERATION_FAILED";

export function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  code: ApiErrorCode,
  message: string,
): Response {
  return c.json({ error: { code, message } }, status);
}
