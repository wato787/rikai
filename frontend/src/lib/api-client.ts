import type { ApiErrorBody } from "./api-types";

/**
 * バックエンド REST のベースパス。
 * 開発時は Vite の `/api` プロキシ、本番では `VITE_API_BASE` で上書き可（例: https://api.example.com/api）。
 */
export function getApiBase(): string {
  const raw = import.meta.env.VITE_API_BASE as string | undefined;
  if (raw != null && raw !== "") {
    return raw.replace(/\/$/, "");
  }
  return "/api";
}

function joinApiPath(path: string): string {
  const base = getApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | undefined;

  constructor(status: number, code: string | undefined, message: string) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object";
}

async function parseErrorBody(res: Response): Promise<{ code?: string; message: string }> {
  const text = await res.text();
  if (!text) {
    return { message: res.statusText || "リクエストに失敗しました。" };
  }
  try {
    const json = JSON.parse(text) as unknown;
    if (isRecord(json) && isRecord(json.error)) {
      const e = json.error as ApiErrorBody["error"];
      const message = typeof e.message === "string" ? e.message : "リクエストに失敗しました。";
      const code = typeof e.code === "string" ? e.code : undefined;
      return { code, message };
    }
  } catch {
    /* 本文が JSON でない */
  }
  return { message: text.slice(0, 500) };
}

type RequestInitJson = Omit<RequestInit, "body"> & {
  body?: BodyInit | null;
};

async function apiRequest<T>(method: string, path: string, init?: RequestInitJson): Promise<T> {
  const url = joinApiPath(path);
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    const { code, message } = isJson
      ? await parseErrorBody(res)
      : { code: undefined, message: await res.text().then((t) => t || res.statusText) };
    throw new ApiRequestError(res.status, code, message);
  }

  if (!isJson) {
    const text = await res.text();
    return text as unknown as T;
  }

  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

export function apiGet<T>(
  path: string,
  init?: Omit<RequestInitJson, "method" | "body">,
): Promise<T> {
  return apiRequest<T>("GET", path, init);
}

export function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody,
  init?: Omit<RequestInitJson, "method" | "body">,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  let payload: string | undefined;
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }
  return apiRequest<TResponse>("POST", path, { ...init, headers, body: payload });
}

export function apiPatch<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
  init?: Omit<RequestInitJson, "method" | "body">,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  return apiRequest<TResponse>("PATCH", path, {
    ...init,
    headers,
    body: JSON.stringify(body),
  });
}

export function apiDelete(
  path: string,
  init?: Omit<RequestInitJson, "method" | "body">,
): Promise<void> {
  return apiRequest<void>("DELETE", path, init);
}
