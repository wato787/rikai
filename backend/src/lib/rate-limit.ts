import { createMiddleware } from "hono/factory";

import { jsonError } from "./api-error";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  routeKey: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function extractClientIp(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const [first] = xForwardedFor.split(",");
    if (first) return first.trim();
  }

  const trueClientIp = headers.get("true-client-ip");
  if (trueClientIp) return trueClientIp.trim();

  return "unknown";
}

function setRateLimitHeaders(
  headers: Headers,
  maxRequests: number,
  remaining: number,
  resetAtMs: number,
): void {
  headers.set("X-RateLimit-Limit", String(maxRequests));
  headers.set("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  headers.set("X-RateLimit-Reset", String(Math.floor(resetAtMs / 1000)));
}

export function ipRateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, routeKey } = options;

  return createMiddleware(async (c, next) => {
    const now = Date.now();
    const ip = extractClientIp(c.req.raw.headers);
    const key = `${routeKey}:${ip}`;
    const current = buckets.get(key);
    const resetAt = current && current.resetAt > now ? current.resetAt : now + windowMs;
    const count = current && current.resetAt > now ? current.count : 0;

    if (count >= maxRequests) {
      setRateLimitHeaders(c.res.headers, maxRequests, 0, resetAt);
      return jsonError(
        c,
        429,
        "RATE_LIMITED",
        "リクエストが集中しています。少し時間をおいて再試行してください。",
      );
    }

    const nextCount = count + 1;
    buckets.set(key, { count: nextCount, resetAt });
    setRateLimitHeaders(c.res.headers, maxRequests, maxRequests - nextCount, resetAt);

    await next();
  });
}

export function resetRateLimitBucketsForTest() {
  buckets.clear();
}
