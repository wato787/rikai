import { cors } from "hono/cors";
import { Hono } from "hono";

import { initAuth } from "./lib/auth";
import roadmaps from "./routes/roadmaps";
import subscriptions from "./routes/subscriptions";
import webhooks from "./routes/webhooks";
import type { AppEnv } from "./types/hono-env";

const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  const fe = (process.env.FRONTEND_URL ?? c.env.FRONTEND_URL ?? "").replace(/\/$/, "");
  const allow = new Set<string>(["http://localhost:5173"]);
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

app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const auth = initAuth(c.env.rikai_db, c.env);
  return auth.handler(c.req.raw);
});

app.route("/api/roadmaps", roadmaps);
app.route("/api/subscriptions", subscriptions);
app.route("/api/webhooks", webhooks);

export default {
  port: 8080,
  fetch: app.fetch,
};
