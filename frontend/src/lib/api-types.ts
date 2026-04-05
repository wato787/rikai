/** docs/api.md の error.code に沿った代表値 */
export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "ROADMAP_LIMIT_EXCEEDED"
  | "INTERNAL_SERVER_ERROR"
  | "AI_GENERATION_FAILED";

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode | string;
    message: string;
  };
};
