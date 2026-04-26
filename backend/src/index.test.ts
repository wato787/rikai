import { describe, expect, test } from "bun:test";

import { app } from "./index";

const baseEnv = {
  NODE_ENV: "development",
  FRONTEND_URL: "http://localhost:5173",
  BETTER_AUTH_URL: "http://localhost:8080",
  STRIPE_SECRET_KEY: "sk_test_dummy",
  STRIPE_WEBHOOK_SECRET: "whsec_dummy",
  rikai_db: {} as never,
};

describe("app endpoints", () => {
  test("GET /health returns ok payload", async () => {
    const res = await app.request("/health", {}, baseEnv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      status: string;
      service: string;
    };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("rikai-api");
  });

  test("POST /api/webhooks/stripe without signature returns 400", async () => {
    const req = new Request("https://api.rikai.app/api/webhooks/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const res = await app.request(req, {}, baseEnv);

    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      error: { code: string; message: string };
    };
    expect(body).toEqual({
      error: { code: "VALIDATION_ERROR", message: "stripe-signature がありません。" },
    });
  });
});
