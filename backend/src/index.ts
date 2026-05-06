import { cors } from "hono/cors";
import { Hono } from "hono";

import { initAuth } from "./lib/auth";
import billing from "./routes/billing";
import roadmaps from "./routes/roadmaps";
import webhooks from "./routes/webhooks";
import type { AppEnv } from "./types/hono-env";

export const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const fe = (process.env.FRONTEND_URL ?? c.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  const nodeEnv = process.env.NODE_ENV ?? c.env.NODE_ENV;
  const allow = new Set<string>();
  if (nodeEnv !== "production") {
    allow.add("http://localhost:5173");
    allow.add("http://localhost:3000");
  }
  if (fe) allow.add(fe);

  return cors({
    origin: (origin) => {
      if (!origin) return fe || "http://localhost:5173";
      return allow.has(origin) ? origin : null;
    },
    credentials: true,
    allowHeaders: ["Content-Type", "Cookie", "Authorization"],
    exposeHeaders: ["Set-Cookie"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })(c, next);
});

app.get("/", (c) => {
  return c.text("Rikai API");
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    service: "rikai-api",
    timestamp: Date.now(),
  });
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = initAuth(c.env.rikai_db, c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/roadmaps", roadmaps);
app.route("/api/billing", billing);
app.route("/api/webhooks", webhooks);

export default {
  port: 8080,
  fetch: app.fetch,
};
