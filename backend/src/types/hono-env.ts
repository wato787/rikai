import type { D1Database } from "@cloudflare/workers-types";

/** Wrangler [vars] + secrets（型は実行時に存在するもののみ） */
export type CloudflareBindings = {
  rikai_db: D1Database;
  NODE_ENV: string;
  FRONTEND_URL: string;
  GEMINI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
};

export type AppEnv = {
  Bindings: CloudflareBindings;
  Variables: {
    user: { id: string };
  };
};
