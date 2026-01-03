import { Hono } from "hono";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { getDb } from "./db";
import { users } from "./db/schema";

const app = new Hono<{ Bindings: { rikai_db: DrizzleD1Database } }>();

const welcomeStrings = [
  "Hello Hono!",
  "To learn more about Hono on Vercel, visit https://vercel.com/docs/frameworks/backend/hono",
];

app.get("/", (c) => {
  return c.text(welcomeStrings.join("\n\n"));
});

app.get('/users', async (c) => {
  const db = getDb(c.env.rikai_db);

  // SELECT * FROM users 実行
  const allUsers = await db.select().from(users).all();

  return c.json(allUsers);
});

export default {
  port: 8080,
  fetch: app.fetch,
};

