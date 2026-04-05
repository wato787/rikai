import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { D1Database } from "@cloudflare/workers-types";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import * as schema from "../db/schema";
import { subscriptions } from "../db/schemas/subscription";
import type { CloudflareBindings } from "../types/hono-env";

function trustedOriginsFromEnv(frontendUrl: string | undefined): string[] {
  const origins = new Set<string>(["http://localhost:5173", "http://localhost:3000"]);
  if (frontendUrl) origins.add(frontendUrl.replace(/\/$/, ""));
  return [...origins];
}

export const initAuth = (d1: D1Database, env: CloudflareBindings) => {
  const db = getDb(d1);
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: process.env.BETTER_AUTH_SECRET ?? "",
    baseURL: process.env.BETTER_AUTH_URL ?? env.BETTER_AUTH_URL ?? "http://localhost:8080",
    trustedOrigins: trustedOriginsFromEnv(process.env.FRONTEND_URL ?? env.FRONTEND_URL),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const now = Date.now();
            await db.insert(subscriptions).values({
              id: uuidv7(),
              userId: user.id,
              plan: "free",
              status: "inactive",
              createdAt: now,
              updatedAt: now,
            });
          },
        },
      },
    },
  });
};
