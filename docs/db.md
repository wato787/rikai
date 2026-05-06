# DB設計書

**プロダクト名：** Rikai（SaaS版）  
**ドキュメントバージョン：** 1.1  
**最終更新：** 2026年5月6日  
**DB：** Cloudflare D1（SQLite）  
**ORM：** Drizzle ORM

---

## 設計方針

| 項目 | 決定内容 |
|------|---------|
| ID形式 | UUIDv7（TEXT） |
| 日時形式 | Unix timestamp ミリ秒（INTEGER） |
| 削除方式 | hard delete |
| ORM | Drizzle ORM |
| 認証 | Better Auth の既定スキーマを利用 |
| 課金モデル | Stripe + クレジット購入制 |
| 初期課金行 | ユーザー登録時に `billing_accounts` を自動作成 |

---

## テーブル一覧

| # | テーブル名 | 概要 |
|---|---|---|
| 1 | `user` | Better Auth ユーザー |
| 2 | `session` | Better Auth セッション |
| 3 | `account` | Better Auth アカウント |
| 4 | `verification` | Better Auth 検証情報 |
| 5 | `roadmaps` | ロードマップ本体 |
| 6 | `nodes` | 学習ステップ |
| 7 | `edges` | ノード間依存 |
| 8 | `billing_accounts` | 課金顧客とクレジット残高 |
| 9 | `processed_stripe_events` | Webhook 冪等処理用 |

---

## テーブル定義

### `roadmaps`

```sql
CREATE TABLE roadmaps (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  topic      TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### `nodes`

```sql
CREATE TABLE nodes (
  id          TEXT PRIMARY KEY,
  roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK(status IN ('not_started', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL DEFAULT 0,
  position_x  REAL,
  position_y  REAL,
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);
```

### `edges`

```sql
CREATE TABLE edges (
  id         TEXT PRIMARY KEY,
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  source_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  UNIQUE(source_id, target_id)
);
```

### `billing_accounts`

```sql
CREATE TABLE billing_accounts (
  id                 TEXT PRIMARY KEY,
  user_id            TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  credit_balance     INTEGER NOT NULL DEFAULT 0,
  created_at         INTEGER NOT NULL,
  updated_at         INTEGER NOT NULL
);
```

カラム補足:

| カラム | 役割 |
|---|---|
| `stripe_customer_id` | Stripe Checkout 発行時に作成または再利用する Customer ID |
| `credit_balance` | 現在残っているクレジット数 |

### `processed_stripe_events`

```sql
CREATE TABLE processed_stripe_events (
  event_id    TEXT PRIMARY KEY NOT NULL,
  created_at  INTEGER NOT NULL
);
```

---

## ロジック補足

### 初期クレジット

ユーザー登録後に `billing_accounts` を 1 行作成し、初期クレジットを付与する。

```ts
await db.insert(billingAccounts).values({
  id: uuidv7(),
  userId: user.id,
  creditBalance: INITIAL_FREE_CREDITS,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

### ロードマップ生成時の消費

- `credit_balance >= ROADMAP_GENERATION_CREDIT_COST` のときだけ生成可能
- 生成成功後に消費分を減算

### Stripe Webhook

- `checkout.session.completed` の `payment` 完了時だけ加算
- `processed_stripe_events` で同一イベントの二重反映を防止

---

## ER図

```text
user
  ├──< roadmaps
  │      ├──< nodes
  │      └──< edges
  └──< billing_accounts

processed_stripe_events
```
