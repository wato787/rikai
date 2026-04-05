# API設計書

**プロダクト名：** Rikai（SaaS版）
**ドキュメントバージョン：** 1.0
**作成日：** 2026年4月5日
**バックエンド：** Cloudflare Workers + Hono
**ベースURL：** `https://api.rikai.app`（仮）

---

## 設計方針

| 項目 | 内容 |
|------|------|
| スタイル | REST |
| 認証方式 | Better Auth のセッションCookie（`HttpOnly`）。全認証必要エンドポイントで検証 |
| レスポンス形式 | `Content-Type: application/json` |
| エラーレスポンス | 共通フォーマット（後述） |
| Webhook（Stripe） | 署名検証必須（`stripe-signature` ヘッダー） |
| CORS | Vite開発サーバー・本番ドメインのみ許可 |

---

## 共通仕様

### 認証

Better Auth が発行するセッションCookieをリクエストに含める。Workers側でセッション検証を行い、`userId` を取得する。

```
Cookie: better-auth.session=<token>
```

### エラーレスポンス共通フォーマット

```json
{
  "error": {
    "code": "ROADMAP_LIMIT_EXCEEDED",
    "message": "無料プランの作成上限（3件）に達しています。"
  }
}
```

**主要エラーコード一覧：**

| HTTPステータス | code | 説明 |
|--------------|------|------|
| 400 | `VALIDATION_ERROR` | リクエストボディの形式不正 |
| 401 | `UNAUTHORIZED` | 未認証・セッション切れ |
| 403 | `FORBIDDEN` | 他ユーザーのリソースへのアクセス |
| 404 | `NOT_FOUND` | リソースが存在しない |
| 409 | `ROADMAP_LIMIT_EXCEEDED` | 無料プランの作成上限超過 |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |
| 502 | `AI_GENERATION_FAILED` | Gemini API の呼び出し失敗 |

---

## エンドポイント一覧

| # | メソッド | パス | 認証 | 概要 |
|---|---------|------|------|------|
| 1 | POST | `/api/auth/**` | - | Better Auth ハンドラー（認証全般） |
| 2 | GET | `/api/roadmaps` | ✅ | ロードマップ一覧取得 |
| 3 | POST | `/api/roadmaps` | ✅ | ロードマップ生成・作成 |
| 4 | GET | `/api/roadmaps/:id` | ✅ | ロードマップ詳細取得 |
| 5 | DELETE | `/api/roadmaps/:id` | ✅ | ロードマップ削除 |
| 6 | PATCH | `/api/roadmaps/:id/nodes/:nodeId` | ✅ | ノードステータス更新 |
| 7 | GET | `/api/subscriptions/me` | ✅ | 自分のサブスク情報取得 |
| 8 | POST | `/api/subscriptions/checkout` | ✅ | Stripe Checkoutセッション作成 |
| 9 | POST | `/api/subscriptions/cancel` | ✅ | サブスクリプションキャンセル |
| 10 | POST | `/api/webhooks/stripe` | ❌（署名検証） | Stripe Webhookイベント受信 |

---

## エンドポイント詳細

---

### 1. Better Auth ハンドラー

```
POST /api/auth/**
```

Better Auth が提供するハンドラーをそのままマウントする。以下のエンドポイントが自動生成される。

| パス | 概要 |
|------|------|
| `POST /api/auth/sign-up/email` | メール/PWで新規登録 |
| `POST /api/auth/sign-in/email` | メール/PWでログイン |
| `POST /api/auth/sign-out` | ログアウト |
| `GET /api/auth/session` | 現在のセッション情報取得 |

**afterSignUp hook（サーバー側）：**
ユーザー登録完了後、`subscriptions` テーブルに `plan: free / status: inactive` のレコードを自動INSERT する。

---

### 2. ロードマップ一覧取得

```
GET /api/roadmaps
```

ログインユーザーの全ロードマップを進捗サマリー付きで返す。

**レスポンス `200`：**

```json
{
  "roadmaps": [
    {
      "id": "01956a23-...",
      "title": "機械学習入門ロードマップ",
      "topic": "機械学習を基礎から学びたい",
      "totalNodes": 10,
      "completedNodes": 3,
      "createdAt": 1743811200000
    }
  ]
}
```

---

### 3. ロードマップ生成・作成

```
POST /api/roadmaps
```

**処理フロー：**

```
1. 無料枠チェック（roadmaps件数 >= 3 かつ plan != 'pro' → 409）
2. Gemini API 呼び出し（topic を元にノード・エッジを生成）
3. D1 にトランザクションで roadmaps / nodes / edges を一括 INSERT
4. 201 JSON を返却
```

**リクエストボディ：**

```json
{
  "topic": "機械学習を基礎から学びたい"
}
```

**バリデーション：**

| フィールド | 制約 |
|------------|------|
| `topic` | 必須・文字列・1〜200文字 |

**Gemini へのプロンプト仕様（概要）：**
- 日本語で出力するよう指示
- 以下のJSONスキーマで返すよう指示（Function CallingまたはJSON mode）

```json
{
  "title": "string",
  "nodes": [
    { "id": "string", "label": "string", "description": "string", "order": "number" }
  ],
  "edges": [
    { "source": "string", "target": "string" }
  ]
}
```

**レスポンス `201`：**

```json
{
  "roadmapId": "01956a23-..."
}
```

**エラー：**

| ステータス | code | 条件 |
|-----------|------|------|
| 400 | `VALIDATION_ERROR` | topicが空・200文字超 |
| 409 | `ROADMAP_LIMIT_EXCEEDED` | 無料プランで3件以上 |
| 502 | `AI_GENERATION_FAILED` | Gemini APIエラー・不正なレスポンス |

**注意：** ページ離脱してもWorker側の処理は継続する。クライアントがレスポンスを受け取れなかった場合、生成されたロードマップはダッシュボード（一覧）から確認できる。

---

### 4. ロードマップ詳細取得

```
GET /api/roadmaps/:id
```

ノード一覧・エッジ一覧を含む詳細を返す。React Flowに渡すデータをそのまま返す形式を意識する。

**レスポンス `200`：**

```json
{
  "roadmap": {
    "id": "01956a23-...",
    "title": "機械学習入門ロードマップ",
    "topic": "機械学習を基礎から学びたい",
    "createdAt": 1743811200000
  },
  "nodes": [
    {
      "id": "01956a24-...",
      "label": "線形代数の基礎",
      "description": "ベクトル・行列・固有値など機械学習に必要な線形代数を学ぶ。",
      "status": "completed",
      "orderIndex": 0
    }
  ],
  "edges": [
    {
      "id": "01956a25-...",
      "sourceId": "01956a24-...",
      "targetId": "01956a26-..."
    }
  ]
}
```

**エラー：**

| ステータス | code | 条件 |
|-----------|------|------|
| 403 | `FORBIDDEN` | 他ユーザーのロードマップ |
| 404 | `NOT_FOUND` | 存在しないID |

---

### 5. ロードマップ削除

```
DELETE /api/roadmaps/:id
```

ロードマップを物理削除する。CASCADEで `nodes` / `edges` も連鎖削除される。

**レスポンス `204`：** ボディなし

**エラー：**

| ステータス | code | 条件 |
|-----------|------|------|
| 403 | `FORBIDDEN` | 他ユーザーのロードマップ |
| 404 | `NOT_FOUND` | 存在しないID |

---

### 6. ノードステータス更新

```
PATCH /api/roadmaps/:id/nodes/:nodeId
```

ノード1件のステータスを更新する。自動保存で呼び出される。

**リクエストボディ：**

```json
{
  "status": "in_progress"
}
```

**バリデーション：**

| フィールド | 制約 |
|------------|------|
| `status` | 必須・`not_started` / `in_progress` / `completed` のいずれか |

**レスポンス `200`：**

```json
{
  "node": {
    "id": "01956a24-...",
    "status": "in_progress",
    "updatedAt": 1743811200000
  }
}
```

**エラー：**

| ステータス | code | 条件 |
|-----------|------|------|
| 400 | `VALIDATION_ERROR` | status が不正な値 |
| 403 | `FORBIDDEN` | 他ユーザーのノード |
| 404 | `NOT_FOUND` | 存在しないノード or ロードマップ |

---

### 7. サブスクリプション情報取得

```
GET /api/subscriptions/me
```

ログインユーザーの現在のプラン・ステータスを返す。設定画面・ダッシュボードの制限チェックに使用する。

**レスポンス `200`：**

```json
{
  "subscription": {
    "plan": "free",
    "status": "inactive",
    "currentPeriodEnd": null
  }
}
```

---

### 8. Stripe Checkoutセッション作成

```
POST /api/subscriptions/checkout
```

Stripe Checkout セッションを作成し、リダイレクトURLを返す。

**処理フロー：**

```
1. subscriptions.stripe_customer_id が未設定なら Stripe でカスタマー作成・保存
2. Stripe Checkout セッション作成（mode: subscription）
3. セッションURLを返却
4. クライアントが Stripe Checkout ページへリダイレクト
```

**レスポンス `200`：**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_..."
}
```

---

### 9. サブスクリプションキャンセル

```
POST /api/subscriptions/cancel
```

Stripe のサブスクリプションを期末キャンセル（`cancel_at_period_end: true`）に設定する。即時解約ではなく、`current_period_end` まで有効。

**レスポンス `200`：**

```json
{
  "subscription": {
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": 1746403200000
  }
}
```

**エラー：**

| ステータス | code | 条件 |
|-----------|------|------|
| 400 | `VALIDATION_ERROR` | すでにキャンセル済み・Freeプラン |

---

### 10. Stripe Webhook受信

```
POST /api/webhooks/stripe
```

Stripe からのイベントを受信し、`subscriptions` テーブルを更新する。

**必須処理：**
- `stripe-signature` ヘッダーで署名検証（検証失敗は `400` を返す）
- 冪等性を考慮すること（同一イベントの二重処理を防ぐ）

**処理するイベントとDB更新内容：**

| イベント | 処理内容 |
|---------|---------|
| `checkout.session.completed` | `plan → pro` / `status → active` / `stripe_subscription_id` を設定 / `current_period_end` を設定 |
| `customer.subscription.deleted` | `plan → free` / `status → canceled` / `stripe_subscription_id → NULL` / `current_period_end → NULL` |
| `invoice.payment_failed` | `status → past_due` |

**レスポンス `200`：** ボディなし（Stripeが再送しないよう即座に200を返す）

---

## API呼び出しフロー図

### ロードマップ生成

```
クライアント
  │ POST /api/roadmaps { topic }
  ▼
Worker
  ├─ セッション検証
  ├─ 無料枠チェック
  ├─ Gemini API呼び出し
  ├─ D1トランザクション（roadmaps + nodes + edges INSERT）
  └─ 201 { roadmapId }
  ▼
クライアント → /roadmap/:id へ遷移
```

### Stripe決済フロー

```
クライアント
  │ POST /api/subscriptions/checkout
  ▼
Worker → Stripe API（Checkoutセッション作成）
  └─ 200 { checkoutUrl }
  ▼
クライアント → Stripe Checkout ページへリダイレクト
  ▼
決済完了 → Stripe → POST /api/webhooks/stripe
  ▼
Worker → subscriptions テーブル更新（pro / active）
  ▼
クライアント → /settings または /dashboard へリダイレクト（Stripeのsuccess_url）
```

---

*本ドキュメントは開発進行に伴い随時更新される。変更履歴はGitで管理する。*
