import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { D1Database } from "@cloudflare/workers-types";
import { v7 as uuidv7 } from "uuid";

import { getDb } from "../db";
import * as schema from "../db/schema";
import { billingAccounts } from "../db/schemas/billing-account";
import { INITIAL_FREE_CREDITS } from "./plan-limits";
import type { CloudflareBindings } from "../types/hono-env";

function trustedOriginsFromEnv(
  frontendUrl: string | undefined,
  nodeEnv: string | undefined,
): string[] {
  const isProd = nodeEnv === "production";
  const origins = new Set<string>();
  if (!isProd) {
    origins.add("http://localhost:5173");
    origins.add("http://localhost:3000");
  }
  if (frontendUrl) origins.add(frontendUrl.replace(/\/$/, ""));
  return [...origins];
}

export function resolveBetterAuthSecret(env: CloudflareBindings): string {
  const secret = (process.env.BETTER_AUTH_SECRET ?? env.BETTER_AUTH_SECRET ?? "").trim();
  const nodeEnv = process.env.NODE_ENV ?? env.NODE_ENV;
  if (!secret && nodeEnv === "production") {
    throw new Error("BETTER_AUTH_SECRET is required in production");
  }
  return secret;
}

export const initAuth = (d1: D1Database, env: CloudflareBindings) => {
  const db = getDb(d1);
  const nodeEnv = process.env.NODE_ENV ?? env.NODE_ENV;
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: resolveBetterAuthSecret(env),
    baseURL: process.env.BETTER_AUTH_URL ?? env.BETTER_AUTH_URL ?? "http://localhost:8080",
    trustedOrigins: trustedOriginsFromEnv(process.env.FRONTEND_URL ?? env.FRONTEND_URL, nodeEnv),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const now = Date.now();
            await db.insert(billingAccounts).values({
              id: uuidv7(),
              userId: user.id,
              creditBalance: INITIAL_FREE_CREDITS,
              createdAt: now,
              updatedAt: now,
            });
          },
        },
      },
    },
  });
};
