## API設計案（v1）

このドキュメントは、`backend`が提供することを想定したAPI案です。
MVPを優先し、最低限のエンドポイントから段階的に拡張します。

> 注: 現状の実装（`backend/src/index.ts`）はサンプル段階です。本書は仕様の叩き台です。

---

## 共通

### ベースURL

- ローカル例: `http://localhost:8080`

### 認証（MVP案）

- MVPは「匿名ユーザー」または「簡易セッション」でも可
- 本格運用では `Authorization: Bearer <token>` を想定

### エラーレスポンス（例）

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "targetDate is required",
    "details": { "field": "targetDate" }
  }
}
```

---

## 1. Goals（目標）

### POST /v1/goals

オンボーディング入力から目標を作成する。

#### Request（例）

```json
{
  "title": "3ヶ月でWebアプリを作れるように",
  "domain": "programming",
  "targetDate": "2026-03-31",
  "weeklyTimeBudgetMinutes": 450,
  "constraints": {
    "device": ["pc"],
    "budget": "free",
    "language": "ja"
  },
  "currentLevel": {
    "selfRating": 2,
    "notes": "HTML/CSSは少し触った"
  }
}
```

#### Response（例）

```json
{
  "goal": {
    "id": "uuid",
    "title": "3ヶ月でWebアプリを作れるように",
    "status": "active",
    "createdAt": "2025-12-29T00:00:00.000Z"
  }
}
```

### GET /v1/goals

ユーザーの目標一覧。

### GET /v1/goals/:goalId

目標の詳細。

### PATCH /v1/goals/:goalId

期日・学習時間・制約の更新（再計画のトリガーになる）。

### POST /v1/goals/:goalId/archive

目標をアーカイブ。

---

## 2. Curriculums（カリキュラム）

### POST /v1/goals/:goalId/curriculums:generate

目標に対するカリキュラムをAIで生成する（新version作成）。

#### Request（例）

```json
{
  "mode": "mvp",
  "preferences": {
    "style": ["hands_on", "text"],
    "pace": "balanced"
  }
}
```

#### Response（例）

```json
{
  "curriculum": {
    "id": "uuid",
    "goalId": "uuid",
    "version": 1,
    "status": "active",
    "createdAt": "2025-12-29T00:00:00.000Z"
  }
}
```

### GET /v1/goals/:goalId/curriculums/active

現在アクティブなカリキュラム（version）を取得。

### GET /v1/curriculums/:curriculumId/tree

カリキュラムをツリー構造で取得（フェーズ→モジュール→レッスン→タスク）。

#### Response（例・簡略）

```json
{
  "rootItems": [
    {
      "id": "uuid",
      "type": "phase",
      "title": "基礎",
      "children": [
        {
          "id": "uuid",
          "type": "module",
          "title": "HTML/CSS",
          "children": []
        }
      ]
    }
  ]
}
```

### PATCH /v1/curriculum-items/:itemId

アイテムの手動編集（title/description/dueAt/statusなど）。

### POST /v1/goals/:goalId/curriculums:replan

ログ・理解度・制約変更を踏まえて再計画し、新versionを作成する。

#### Request（例）

```json
{
  "reason": "behind_schedule",
  "constraintsDelta": { "weeklyTimeBudgetMinutes": 300 }
}
```

---

## 3. Today（今日のタスク）

### GET /v1/goals/:goalId/today?date=YYYY-MM-DD

指定日の「今日のタスク」を取得。

#### Response（例）

```json
{
  "date": "2025-12-29",
  "tasks": [
    {
      "id": "uuid",
      "title": "配列とループの練習問題10問",
      "estimatedMinutes": 30,
      "completionCriteria": ["10問解く", "間違いをメモする"]
    }
  ]
}
```

---

## 4. Study Logs（学習ログ）

### POST /v1/study-logs

学習実績を記録する。

#### Request（例）

```json
{
  "goalId": "uuid",
  "curriculumItemId": "uuid",
  "date": "2025-12-29",
  "durationMinutes": 35,
  "status": "done",
  "note": "for文の境界条件でミスしがち",
  "selfRating": 3
}
```

### GET /v1/goals/:goalId/study-logs?from=YYYY-MM-DD&to=YYYY-MM-DD

期間で取得（週次振り返り用）。

---

## 5. Checks（小テスト）

### GET /v1/curriculum-items/:itemId/check

レッスンに紐づくチェックを取得（無ければ生成提案）。

### POST /v1/checks/:checkId/attempts

回答を送信し、採点/フィードバックを返す。

---

## 6. Chat（学習支援）

### POST /v1/conversations

スレッド作成（文脈としてgoalId/itemIdを持てる）。

### POST /v1/conversations/:conversationId/messages

質問を送信し、AIの回答を受け取る。

#### Request（例）

```json
{
  "content": "配列とリストの違いが分かりません。例で教えてください。"
}
```

---

## 7. Webhook/非同期（将来）

- 生成をジョブ化し、`POST /v1/jobs` → `GET /v1/jobs/:id` で進捗取得
- ストリーミング（SSE/WebSocket）で長文生成を段階表示
