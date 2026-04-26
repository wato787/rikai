import { describe, expect, test, beforeEach } from "bun:test";
import { Hono } from "hono";

import { ipRateLimit, resetRateLimitBucketsForTest } from "./rate-limit";

describe("ipRateLimit", () => {
  beforeEach(() => {
    resetRateLimitBucketsForTest();
  });

  test("同一IPの上限超過を429で拒否する", async () => {
    const app = new Hono();
    app.get(
      "/limited",
      ipRateLimit({
        routeKey: "test-route",
        windowMs: 60_000,
        maxRequests: 2,
      }),
      (c) => c.text("ok"),
    );

    const headers = { "cf-connecting-ip": "203.0.113.10" };
    const r1 = await app.request("/limited", { headers });
    const r2 = await app.request("/limited", { headers });
    const r3 = await app.request("/limited", { headers });

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);

    const body = await r3.json();
    expect(body).toEqual({
      error: {
        code: "RATE_LIMITED",
        message: "リクエストが集中しています。少し時間をおいて再試行してください。",
      },
    });
  });

  test("IPが異なれば別バケットとして処理する", async () => {
    const app = new Hono();
    app.get(
      "/limited",
      ipRateLimit({
        routeKey: "test-route",
        windowMs: 60_000,
        maxRequests: 1,
      }),
      (c) => c.text("ok"),
    );

    const a = await app.request("/limited", { headers: { "cf-connecting-ip": "198.51.100.1" } });
    const b = await app.request("/limited", { headers: { "cf-connecting-ip": "198.51.100.2" } });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
  });
});
