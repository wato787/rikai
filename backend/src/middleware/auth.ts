import { createMiddleware } from "hono/factory";

import { jsonError } from "../lib/api-error";
import { initAuth } from "../lib/auth";
import type { AppEnv } from "../types/hono-env";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const auth = initAuth(c.env.rikai_db, c.env);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return jsonError(c, 401, "UNAUTHORIZED", "未認証です。");
  }
  c.set("user", { id: session.user.id });
  await next();
});
