import { describe, expect, test } from "bun:test";

import { resolveBetterAuthSecret } from "./auth";

describe("resolveBetterAuthSecret", () => {
  test("productionでsecret未設定なら例外を投げる", () => {
    const prevNodeEnv = process.env.NODE_ENV;
    const prev = process.env.BETTER_AUTH_SECRET;
    process.env.NODE_ENV = "production";
    delete process.env.BETTER_AUTH_SECRET;
    try {
      expect(() =>
        resolveBetterAuthSecret({
          NODE_ENV: "production",
          FRONTEND_URL: "http://localhost:5173",
          rikai_db: {} as never,
        }),
      ).toThrow("BETTER_AUTH_SECRET is required in production");
    } finally {
      if (prevNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = prevNodeEnv;
      }
      if (prev === undefined) {
        delete process.env.BETTER_AUTH_SECRET;
      } else {
        process.env.BETTER_AUTH_SECRET = prev;
      }
    }
  });

  test("developmentでsecret未設定でも許容する", () => {
    const secret = resolveBetterAuthSecret({
      NODE_ENV: "development",
      FRONTEND_URL: "http://localhost:5173",
      rikai_db: {} as never,
    });
    expect(secret).toBe("");
  });
});
