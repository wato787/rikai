# DB設計書

**プロダクト名：** Rikai（SaaS版）
**ドキュメントバージョン：** 1.0
**作成日：** 2026年4月5日
**DB：** Cloudflare D1（SQLite）
**ORM：** Drizzle ORM

---

## 設計方針

| 項目 | 決定内容 |
|------|---------|
| ID形式 | UUIDv7（TEXT）。時系列ソート可能・分散環境に適切 |
| 日時形式 | Unix timestamp ミリ秒（INTEGER）|
| 外部キー制約 | 有効（接続時に `PRAGMA foreign_keys = ON` を実行） |
| 削除方式 | hard delete（物理削除）。soft deleteなし |
| ORM | Drizzle ORM（Better AuthのD1アダプターと共存） |
| nodes/edges挿入 | roadmap作成時にトランザクションで一括INSERT |
| nodes/edges更新 | 現状スコープ外（上書き不可・削除のみ） |
| Better Authスキーマ | デフォルトに完全準拠。カスタムカラム追加なし |
| subscriptions初期化 | Better AuthのafterSignUp hookでfree/inactiveレコードをINSERT |

---

## テーブル一覧

| # | テーブル名 | 管理主体 | 概要 |
|---|------------|---------|------|
| 1 | `user` | Better Auth | ユーザー情報 |
| 2 | `session` | Better Auth | セッション情報 |
| 3 | `account` | Better Auth | OAuthアカウント情報（将来拡張用） |
| 4 | `verification` | Better Auth | メール認証トークン等 |
| 5 | `roadmaps` | アプリ | ロードマップのメタ情報 |
| 6 | `nodes` | アプリ | 学習ステップ＋進捗ステータス |
| 7 | `edges` | アプリ | ノード間の依存関係・順序 |
| 8 | `subscriptions` | アプリ | Stripeサブスクリプション情報 |

> テーブル名について：Better Auth が生成する1〜4は単数形（`user`, `session`）。アプリ側の5〜8は複数形（`roadmaps`, `nodes`）で統一する。

---

## テーブル定義

---

### 1〜4. Better Auth 管理テーブル

Better Auth がマイグレーション時に自動生成する。アプリ側から直接書き込まない。参考としてスキーマを記載する。

```sql
-- Better Auth デフォルトスキーマ（参考・編集不可）
CREATE TABLE user (
  id             TEXT PRIMARY KEY,
  email          TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,  -- BOOLEAN (0/1)
  name           TEXT,
  image          TEXT,
  created_at     INTEGER NOT NULL,
  updated_at     INTEGER NOT NULL
);

CREATE TABLE session (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE account (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  account_id              TEXT NOT NULL,
  provider_id             TEXT NOT NULL,
  access_token            TEXT,
  refresh_token           TEXT,
  access_token_expires_at INTEGER,
  created_at              INTEGER NOT NULL,
  updated_at              INTEGER NOT NULL
);

CREATE TABLE verification (
  id         TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value      TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

### 5. `roadmaps`

ユーザーが作成したロードマップのメタ情報を管理する。

```sql
CREATE TABLE roadmaps (
  id         TEXT PRIMARY KEY,              -- UUIDv7
  user_id    TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,                -- AIが生成したロードマップ名
  topic      TEXT NOT NULL,                -- ユーザーが入力したトピック（例：「機械学習を基礎から」）
  created_at INTEGER NOT NULL,             -- Unix timestamp ミリ秒
  updated_at INTEGER NOT NULL              -- Unix timestamp ミリ秒
);

CREATE INDEX idx_roadmaps_user_id ON roadmaps(user_id);
```

**カラム補足：**

| カラム | 補足 |
|--------|------|
| `id` | UUIDv7。Workers側で生成してINSERT |
| `topic` | ユーザー入力をそのまま保存。再表示・デバッグ用 |
| `title` | Gemini APIが生成したロードマップタイトル |

**制約・ロジック：**
- 無料プランの作成数チェックは `SELECT COUNT(*) FROM roadmaps WHERE user_id = ?` で行い、3件以上なら409を返す
- ロードマップ削除時はCASCADEで `nodes` / `edges` も連鎖削除される

---

### 6. `nodes`

ロードマップを構成する個々の学習ステップ。進捗ステータスも本テーブルで管理する。

```sql
CREATE TABLE nodes (
  id          TEXT PRIMARY KEY,            -- UUIDv7
  roadmap_id  TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,              -- 学習項目名（例：「線形代数の基礎」）
  description TEXT NOT NULL DEFAULT '',   -- AIが生成した詳細説明
  status      TEXT NOT NULL DEFAULT 'not_started'
                CHECK(status IN ('not_started', 'in_progress', 'completed')),
  order_index INTEGER NOT NULL DEFAULT 0, -- AI生成時の学習順序（React Flowレイアウトのヒント）
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

CREATE INDEX idx_nodes_roadmap_id ON nodes(roadmap_id);
```

**カラム補足：**

| カラム | 補足 |
|--------|------|
| `status` | `not_started`（未着手）/ `in_progress`（学習中）/ `completed`（完了）|
| `order_index` | 0始まりの整数。Gemini APIのレスポンス順をそのまま使用 |
| `description` | ノードクリック時にサイドパネルで表示するAI生成テキスト |

**制約・ロジック：**
- ノード座標（x, y）は保存しない。React Flowの自動レイアウト（dagre等）で毎回計算する
- ステータス更新時は `roadmap_id` も条件に加えて他ユーザーの誤更新を防ぐ

---

### 7. `edges`

ノード間の依存関係・学習順序を表す有向エッジ。

```sql
CREATE TABLE edges (
  id         TEXT PRIMARY KEY,             -- UUIDv7
  roadmap_id TEXT NOT NULL REFERENCES roadmaps(id) ON DELETE CASCADE,
  source_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  target_id  TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,

  UNIQUE(source_id, target_id)             -- 同一エッジの重複防止
);

CREATE INDEX idx_edges_roadmap_id ON edges(roadmap_id);
```

**カラム補足：**

| カラム | 補足 |
|--------|------|
| `source_id → target_id` | sourceを学んでからtargetへ進む方向を表す |

**制約・ロジック：**
- nodes / edges はAI生成後に上書き不可（現状スコープ外）。変更する場合はロードマップごと削除して再生成
- ロードマップ削除時にCASCADEで連鎖削除される

---

### 8. `subscriptions`

Stripeのサブスクリプション情報を管理する。ユーザー登録時にBetter AuthのafterSignUp hookで自動的にfree/inactiveレコードを作成する。

```sql
CREATE TABLE subscriptions (
  id                     TEXT PRIMARY KEY,   -- UUIDv7
  user_id                TEXT NOT NULL UNIQUE REFERENCES user(id) ON DELETE CASCADE,
  stripe_customer_id     TEXT UNIQUE,        -- Stripe Checkout開始時に設定。初期はNULL
  stripe_subscription_id TEXT UNIQUE,        -- サブスク開始時に設定。解約後はNULL
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK(plan IN ('free', 'pro')),
  status                 TEXT NOT NULL DEFAULT 'inactive'
                           CHECK(status IN ('active', 'inactive', 'canceled', 'past_due')),
  current_period_end     INTEGER,            -- 次回更新日（Unix timestamp ミリ秒）。Proのみ設定
  created_at             INTEGER NOT NULL,
  updated_at             INTEGER NOT NULL
);
```

**カラム補足：**

| カラム | 補足 |
|--------|------|
| `stripe_customer_id` | Stripe Checkoutセッション作成時にUpsert |
| `stripe_subscription_id` | `checkout.session.completed` 受信時に設定 |
| `current_period_end` | 設定画面の「次回更新日」表示に使用 |

**初期レコード（afterSignUp hook）：**

```typescript
// Better Auth の afterSignUp hook
await db.insert(subscriptions).values({
  id: uuidv7(),
  userId: user.id,
  plan: 'free',
  status: 'inactive',
  createdAt: Date.now(),
  updatedAt: Date.now(),
});
```

**Webhook受信時のステータス遷移：**

| Webhookイベント | plan | status | stripe_subscription_id |
|----------------|------|--------|------------------------|
| `checkout.session.completed` | `pro` | `active` | 設定 |
| `customer.subscription.deleted` | `free` | `canceled` | NULL |
| `invoice.payment_failed` | `pro` | `past_due` | 維持 |

**プランチェックのロジック：**
- `plan = 'pro' AND status = 'active'` → Proユーザー（作成無制限）
- それ以外 → Freeユーザー（作成3件まで）

---

## ER図

```
user (Better Auth)
  │
  ├──< roadmaps (user_id)
  │       │
  │       ├──< nodes (roadmap_id)
  │       │
  │       └──< edges (roadmap_id)
  │               ├── source_id ──> nodes.id
  │               └── target_id ──> nodes.id
  │
  └──< subscriptions (user_id)
```

---

## 主要クエリ例（Drizzle ORM）

### ロードマップ一覧取得（ダッシュボード）

```typescript
const result = await db
  .select({
    id: roadmaps.id,
    title: roadmaps.title,
    createdAt: roadmaps.createdAt,
    totalNodes: count(nodes.id),
    completedNodes: count(
      sql`CASE WHEN ${nodes.status} = 'completed' THEN 1 END`
    ),
  })
  .from(roadmaps)
  .leftJoin(nodes, eq(nodes.roadmapId, roadmaps.id))
  .where(eq(roadmaps.userId, userId))
  .groupBy(roadmaps.id)
  .orderBy(desc(roadmaps.createdAt));
```

### ロードマップ詳細取得（ビュー画面）

```typescript
// ノード一覧
const nodeList = await db
  .select()
  .from(nodes)
  .where(eq(nodes.roadmapId, roadmapId))
  .orderBy(asc(nodes.orderIndex));

// エッジ一覧
const edgeList = await db
  .select()
  .from(edges)
  .where(eq(edges.roadmapId, roadmapId));
```

### ロードマップ作成（トランザクション）

```typescript
await db.transaction(async (tx) => {
  await tx.insert(roadmaps).values({
    id: uuidv7(), userId, title, topic,
    createdAt: Date.now(), updatedAt: Date.now(),
  });
  await tx.insert(nodes).values(nodeRows);   // 数十件を一括INSERT
  await tx.insert(edges).values(edgeRows);
});
```

### ノードステータス更新

```typescript
await db
  .update(nodes)
  .set({ status: newStatus, updatedAt: Date.now() })
  .where(
    and(
      eq(nodes.id, nodeId),
      eq(nodes.roadmapId, roadmapId)  // 他ユーザーの誤更新を防ぐ
    )
  );
```

### 無料プラン作成数チェック

```typescript
const [{ roadmapCount }] = await db
  .select({ roadmapCount: count() })
  .from(roadmaps)
  .where(eq(roadmaps.userId, userId));

if (roadmapCount >= FREE_PLAN_LIMIT) {  // FREE_PLAN_LIMIT = 3
  throw new HttpError(409, 'ROADMAP_LIMIT_EXCEEDED');
}
```

---

*本ドキュメントは開発進行に伴い随時更新される。変更履歴はGitで管理する。*
