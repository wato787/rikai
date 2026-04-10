/**
 * ローカル D1 に開発用ユーザーとサンプルロードマップを投入します。
 *
 * 事前: `bun run db:migrate`（または `mise run db:migrate`）でマイグレーション済みであること。
 *
 * ログイン（/login）:
 *   メール: test@test.com
 *   パスワード: wwww1111
 */
import { spawnSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";

const D1_NAME = "rikai-db";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ACCOUNT_ID = "22222222-2222-4222-8222-222222222222";
const SUBSCRIPTION_ID = "33333333-3333-4333-8333-333333333333";
const ROADMAP_ID = "44444444-4444-4444-8444-444444444444";
const NODE_IDS = [
  "55555555-5555-5555-8555-555555555551",
  "55555555-5555-5555-8555-555555555552",
  "55555555-5555-5555-8555-555555555553",
] as const;
const EDGE_IDS = [
  "66666666-6666-6666-8666-666666666661",
  "66666666-6666-6666-8666-666666666662",
] as const;

const EMAIL = "test@test.com";
const DISPLAY_NAME = "開発ユーザー";
const PASSWORD_PLAIN = "wwww1111";

async function main() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const backendRoot = join(scriptDir, "..");
  const tmpSql = join(tmpdir(), `rikai-seed-${process.pid}.sql`);

  const passwordHash = await hashPassword(PASSWORD_PLAIN);
  const now = Date.now();

  const sql = `
PRAGMA foreign_keys = ON;

DELETE FROM user WHERE id = '${USER_ID}';

INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at) VALUES
  ('${USER_ID}', '${DISPLAY_NAME}', '${EMAIL}', 1, NULL, ${now}, ${now});

INSERT INTO account (id, account_id, provider_id, user_id, password, created_at, updated_at) VALUES
  ('${ACCOUNT_ID}', '${EMAIL}', 'credential', '${USER_ID}', '${passwordHash}', ${now}, ${now});

INSERT INTO subscriptions (id, user_id, stripe_customer_id, stripe_subscription_id, plan, status, current_period_end, created_at, updated_at) VALUES
  ('${SUBSCRIPTION_ID}', '${USER_ID}', NULL, NULL, 'free', 'inactive', NULL, ${now}, ${now});

INSERT INTO roadmaps (id, user_id, title, topic, created_at, updated_at) VALUES
  ('${ROADMAP_ID}', '${USER_ID}', 'サンプル: はじめてのロードマップ', 'ローカル開発用のダミーデータです。', ${now}, ${now});

INSERT INTO nodes (id, roadmap_id, label, description, status, order_index, created_at, updated_at) VALUES
  ('${NODE_IDS[0]}', '${ROADMAP_ID}', 'ステップ 1', '最初の一歩', 'completed', 0, ${now}, ${now}),
  ('${NODE_IDS[1]}', '${ROADMAP_ID}', 'ステップ 2', '続きの学習', 'in_progress', 1, ${now}, ${now}),
  ('${NODE_IDS[2]}', '${ROADMAP_ID}', 'ステップ 3', '仕上げ', 'not_started', 2, ${now}, ${now});

INSERT INTO edges (id, roadmap_id, source_id, target_id, created_at) VALUES
  ('${EDGE_IDS[0]}', '${ROADMAP_ID}', '${NODE_IDS[0]}', '${NODE_IDS[1]}', ${now}),
  ('${EDGE_IDS[1]}', '${ROADMAP_ID}', '${NODE_IDS[1]}', '${NODE_IDS[2]}', ${now});
`;

  writeFileSync(tmpSql, sql.trim(), "utf8");

  const r = spawnSync(
    "bunx",
    ["wrangler", "d1", "execute", D1_NAME, "--local", "--file", tmpSql],
    {
      cwd: backendRoot,
      stdio: "inherit",
      encoding: "utf8",
    },
  );

  try {
    unlinkSync(tmpSql);
  } catch {
    /* ignore */
  }

  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }

  console.log("ローカル D1 にシードを投入しました。");
  console.log(`  メール: ${EMAIL}`);
  console.log(`  パスワード: ${PASSWORD_PLAIN}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
