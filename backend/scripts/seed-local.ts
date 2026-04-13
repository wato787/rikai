/**
 * ローカル D1（wrangler dev）の SQLite を空にし、開発用アカウントを1件投入する。
 *
 * 前提: `bun run db:migrate` でマイグレーション済みであること。
 *
 * 既定アカウント:
 * - email: test@test.com
 * - password: wwww1111
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import { hashPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { v7 as uuidv7 } from "uuid";

import * as schema from "../src/db/schema";
import { account, session, user, verification } from "../src/db/schemas/auth";
import { edges, nodes, roadmaps } from "../src/db/schemas/roadmap";
import { processedStripeEvents } from "../src/db/schemas/stripe-events";
import { subscriptions } from "../src/db/schemas/subscription";

const SEED_EMAIL = "test@test.com";
const SEED_PASSWORD = "wwww1111";
const SEED_NAME = "開発ユーザー";

function resolveSqlitePath(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && raw !== ":memory:") {
    const path = raw.replace(/^file:/, "");
    if (existsSync(path)) return path;
  }

  const miniflareDir = join(
    import.meta.dirname,
    "../.wrangler/state/v3/d1/miniflare-D1DatabaseObject",
  );
  if (!existsSync(miniflareDir)) {
    throw new Error(
      `ローカル D1 の SQLite が見つかりません: ${miniflareDir}\n` +
        "先に `bunx wrangler d1 migrations apply rikai_db --local` を実行するか、一度 `wrangler dev` を起動してください。",
    );
  }

  const candidates = readdirSync(miniflareDir)
    .filter((f) => f.endsWith(".sqlite"))
    .map((f) => join(miniflareDir, f));
  if (candidates.length === 0) {
    throw new Error(`${miniflareDir} 内に .sqlite がありません。`);
  }

  candidates.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return candidates[0]!;
}

function clearAppData(db: ReturnType<typeof drizzle>) {
  db.delete(edges).run();
  db.delete(nodes).run();
  db.delete(roadmaps).run();
  db.delete(processedStripeEvents).run();
  db.delete(session).run();
  db.delete(account).run();
  db.delete(subscriptions).run();
  db.delete(verification).run();
  db.delete(user).run();
}

async function main() {
  const sqlitePath = resolveSqlitePath();
  console.info(`SQLite: ${sqlitePath}`);

  const sqlite = new Database(sqlitePath);
  sqlite.exec("PRAGMA foreign_keys = OFF;");
  const db = drizzle(sqlite, { schema });

  clearAppData(db);

  const userId = uuidv7();
  const now = new Date();
  const passwordHash = await hashPassword(SEED_PASSWORD);

  db.insert(user)
    .values({
      id: userId,
      name: SEED_NAME,
      email: SEED_EMAIL.toLowerCase(),
      emailVerified: true,
      image: null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(account)
    .values({
      id: uuidv7(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  db.insert(subscriptions)
    .values({
      id: uuidv7(),
      userId,
      plan: "free",
      status: "inactive",
      currentPeriodEnd: null,
      createdAt: now.getTime(),
      updatedAt: now.getTime(),
    })
    .run();

  sqlite.exec("PRAGMA foreign_keys = ON;");

  const row = db.select({ email: user.email }).from(user).where(eq(user.id, userId)).get();
  console.info("シード完了:", row?.email ?? userId, `(${SEED_NAME})`);
  console.info("ログイン: ", SEED_EMAIL, "/", SEED_PASSWORD);

  sqlite.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
