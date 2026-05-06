# API設計書

**プロダクト名：** Rikai（SaaS版）  
**ドキュメントバージョン：** 1.1  
**最終更新：** 2026年5月6日  
**バックエンド：** Cloudflare Workers + Hono  
**ベースURL：** `https://api.rikai.app`（仮）

---

## 設計方針

| 項目 | 内容 |
|------|------|
| スタイル | REST |
| 認証方式 | Better Auth のセッションCookie（`HttpOnly`） |
| レスポンス形式 | `Content-Type: application/json` |
| 課金モデル | Stripe を用いたクレジット購入制 |
| Webhook | `POST /api/webhooks/stripe` で署名検証必須 |
| CORS | 開発用 localhost と `FRONTEND_URL` のみ許可 |

---

## 共通仕様

### 認証

Better Auth が発行するセッションCookieをリクエストに含める。

```http
Cookie: better-auth.session=<token>
```

### エラーレスポンス

```json
{
  "error": {
    "code": "AI_GENERATION_LIMIT_EXCEEDED",
    "message": "クレジットが不足しています。クレジットを追加してください。"
  }
}
```

| HTTPステータス | code | 説明 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | リクエスト形式不正 |
| 401 | `UNAUTHORIZED` | 未認証・セッション切れ |
| 403 | `FORBIDDEN` | 権限不足 |
| 403 | `AI_GENERATION_LIMIT_EXCEEDED` | クレジット不足 |
| 404 | `NOT_FOUND` | リソース不在 |
| 429 | `RATE_LIMITED` | レート制限 |
| 500 | `INTERNAL_SERVER_ERROR` | サーバー内部エラー |
| 502 | `AI_GENERATION_FAILED` | AI 応答の解釈失敗 |
| 503 | `GEMINI_NOT_CONFIGURED` | Gemini 未設定 |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI 一時混雑 |

---

## エンドポイント一覧

| # | メソッド | パス | 認証 | 概要 |
|---|---|---|---|---|
| 1 | `POST/GET` | `/api/auth/**` | - | Better Auth ハンドラー |
| 2 | `GET` | `/api/roadmaps` | ✅ | ロードマップ一覧取得 |
| 3 | `POST` | `/api/roadmaps` | ✅ | ロードマップ生成・作成 |
| 4 | `GET` | `/api/roadmaps/:id` | ✅ | ロードマップ詳細取得 |
| 5 | `DELETE` | `/api/roadmaps/:id` | ✅ | ロードマップ削除 |
| 6 | `PATCH` | `/api/roadmaps/:id/nodes/:nodeId` | ✅ | ノード更新 |
| 7 | `GET` | `/api/billing/me` | ✅ | 自分の課金状態取得 |
| 8 | `POST` | `/api/billing/checkout` | ✅ | Stripe Checkout セッション作成 |
| 9 | `POST` | `/api/billing/credits/grant` | ✅ | 開発用クレジット付与 |
| 10 | `POST` | `/api/webhooks/stripe` | ❌ | Stripe Webhook 受信 |

---

## エンドポイント詳細

### 1. Better Auth ハンドラー

```http
POST /api/auth/**
GET  /api/auth/session
```

ユーザー登録完了後、`billing_accounts` に初期クレジット付きの行を自動作成する。

---

### 2. ロードマップ一覧取得

```http
GET /api/roadmaps
```

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

```http
POST /api/roadmaps
```

```json
{
  "topic": "機械学習を基礎から学びたい"
}
```

処理フロー:

```text
1. billing_accounts.credit_balance を確認
2. 1回分のクレジットがあれば Gemini API を呼ぶ
3. roadmaps / nodes / edges を保存
4. 消費分だけ credit_balance を減算
5. 201 を返す
```

```json
{
  "roadmapId": "01956a23-..."
}
```

| ステータス | code | 条件 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `topic` が不正 |
| 403 | `AI_GENERATION_LIMIT_EXCEEDED` | 残クレジット不足 |
| 503 | `GEMINI_NOT_CONFIGURED` | Gemini 未設定 |
| 503 | `AI_SERVICE_UNAVAILABLE` | AI 一時混雑 |
| 502 | `AI_GENERATION_FAILED` | AI 応答不正 |

---

### 4. ロードマップ詳細取得

```http
GET /api/roadmaps/:id
```

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
      "description": "詳細説明",
      "status": "completed",
      "orderIndex": 0,
      "positionX": 0,
      "positionY": 120
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

---

### 5. ロードマップ削除

```http
DELETE /api/roadmaps/:id
```

レスポンスは `204 No Content`。

---

### 6. ノード更新

```http
PATCH /api/roadmaps/:id/nodes/:nodeId
```

```json
{
  "status": "in_progress"
}
```

`status` / `label` / `description` のいずれかを更新できる。

---

### 7. 課金状態取得

```http
GET /api/billing/me
```

```json
{
  "billing": {
    "creditModel": "credits",
    "remainingCredits": 3,
    "costPerRoadmapGeneration": 1
  }
}
```

---

### 8. Stripe Checkout セッション作成

```http
POST /api/billing/checkout
```

処理フロー:

```text
1. billing_accounts.stripe_customer_id が無ければ Stripe Customer を作る
2. Stripe Checkout セッションを payment mode で発行
3. 購入クレジット数を metadata に埋める
4. checkoutUrl を返す
```

```json
{
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_..."
}
```

---

### 9. 開発用クレジット付与

```http
POST /api/billing/credits/grant
```

```json
{
  "amount": 10
}
```

本番では無効。開発環境だけで残高を増やす。

---

### 10. Stripe Webhook

```http
POST /api/webhooks/stripe
```

現行仕様で処理するイベント:

| イベント | 処理 |
|---|---|
| `checkout.session.completed` | `payment` かつ `paid` のとき、`metadata.creditsGrant` 分だけ `billing_accounts.credit_balance` を加算 |

Webhook は `processed_stripe_events` で冪等に扱う。

---

## フロー図

### ロードマップ生成

```text
クライアント
  │ POST /api/roadmaps
  ▼
Worker
  ├─ セッション検証
  ├─ クレジット残高確認
  ├─ Gemini API 呼び出し
  ├─ roadmaps/nodes/edges 保存
  └─ credit_balance を減算
  ▼
クライアント → /roadmap/:id
```

### クレジット購入

```text
クライアント
  │ POST /api/billing/checkout
  ▼
Worker → Stripe Checkout URL 発行
  ▼
クライアント → Stripe Checkout
  ▼
Stripe → POST /api/webhooks/stripe
  ▼
Worker → billing_accounts.credit_balance を加算
```
