import { Hono } from "hono";
import { DrizzleD1Database } from "drizzle-orm/d1";

import { initAuth } from "./lib/auth";

const app = new Hono<{ Bindings: { rikai_db: DrizzleD1Database } }>();

const welcomeStrings = [
  "Hello Hono!",
  "To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

app.on(["POST", "GET"], "/api/auth/*", (c) => {
    const auth = initAuth(c.env.rikai_db);
    return auth.handler(c.req.raw);
});

export default {
  port: 8080,
  fetch: app.fetch,
};

