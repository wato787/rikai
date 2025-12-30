## 情報設計・データモデル案

このドキュメントは、rikaiが扱う主要データ（カリキュラム、学習ログ、理解度など）を、実装に落とし込める粒度で整理します。
DBの選定（PostgreSQL等）は別途ですが、ここでは**論理モデル**として記載します。

---

## 1. エンティティ一覧（概要）

- `User`: 利用者
- `Goal`: 学習目標（ユーザーに紐づく）
- `Curriculum`: 目標に対するカリキュラム（版を持つ）
- `CurriculumItem`: フェーズ/モジュール/レッスン/タスクの階層ノード
- `Resource`: 教材/リンク/書籍など
- `CurriculumResource`: どのアイテムにどの教材を紐づけるか
- `StudyLog`: 学習の実績ログ（タスク完了、学習時間、メモ）
- `Check`: 小テスト（問題セット）
- `CheckAttempt`: 小テストの受験結果
- `Mastery`: 習熟度（モジュール単位など）
- `Conversation`: チャットスレッド（質問・解説）
- `Message`: チャットメッセージ（ユーザー/AI）

---

## 2. 詳細（フィールド案）

### 2-1. User

- `id` (uuid)
- `createdAt`
- `updatedAt`
- `displayName`（任意）
- `locale`（既定: `ja-JP`）

### 2-2. Goal（オンボーディング結果）

- `id` (uuid)
- `userId` (fk)
- `title`（例: "TOEIC 700"）
- `description`（自由記述）
- `domain`（例: `programming`, `language`, `certification`, `math`）
- `targetDate`（任意）
- `durationWeeks`（任意）
- `weeklyTimeBudgetMinutes`（任意）
- `dailyTimeBudgetMinutes`（任意）
- `constraints`（json: 予算/デバイス/苦手 等）
- `currentLevel`（json: 自己申告や診断結果）
- `status`（`draft` | `active` | `archived`）
- `createdAt`
- `updatedAt`

### 2-3. Curriculum（版管理）

ユーザーの進捗や理解度で更新されるため、**版（version）**を持つ。

- `id` (uuid)
- `goalId` (fk)
- `version`（整数、1から）
- `status`（`active` | `superseded`）
- `generatedBy`（`ai` | `user` | `system`）
- `generationContext`（json: 生成時の入力/制約の要約、モデル/プロンプト版など）
- `createdAt`

### 2-4. CurriculumItem（階層ノード）

フェーズ/モジュール/レッスン/タスクを同一テーブルで表現し、ツリー構造を作る。

- `id` (uuid)
- `curriculumId` (fk)
- `type`（`phase` | `module` | `lesson` | `task`）
- `parentId`（自己参照、ルートはnull）
- `order`（同一親内の並び）
- `title`
- `description`（任意）
- `estimatedMinutes`（任意）
- `startAt`（任意、日次計画に割り当てる場合）
- `dueAt`（任意）
- `completionCriteria`（json: チェックリスト）
- `tags`（json: 例 "grammar", "react", "array"）
- `status`（`planned` | `in_progress` | `done` | `skipped`）
- `createdAt`
- `updatedAt`

### 2-5. Resource（教材）

- `id` (uuid)
- `type`（`url` | `book` | `video` | `course` | `exercise`）
- `title`
- `url`（`type=url`の場合）
- `author`（任意）
- `provider`（任意）
- `language`（例: `ja`, `en`）
- `cost`（`free` | `paid` | `unknown`）
- `difficulty`（1〜5など）
- `estimatedMinutes`
- `licenseNote`（任意: 注意事項）
- `createdAt`

### 2-6. CurriculumResource（紐付け）

- `id` (uuid)
- `curriculumItemId` (fk)
- `resourceId` (fk)
- `reason`（なぜ推奨するか）
- `priority`（推奨順）

### 2-7. StudyLog（実績）

- `id` (uuid)
- `userId` (fk)
- `goalId` (fk)
- `curriculumItemId`（主に`task`を想定、任意）
- `date`（ローカル日付）
- `durationMinutes`
- `status`（`done` | `partial` | `skipped`）
- `note`（任意）
- `selfRating`（1〜5、任意）
- `createdAt`

### 2-8. Check / CheckAttempt（小テスト）

#### Check

- `id` (uuid)
- `curriculumItemId`（`lesson`に紐づく等）
- `format`（`mcq` | `short_answer` | `mixed`）
- `items`（json: 問題配列、選択肢、期待解答、採点方針）
- `createdAt`

#### CheckAttempt

- `id` (uuid)
- `checkId` (fk)
- `userId` (fk)
- `answers`（json）
- `score`（0〜100等）
- `feedback`（json: どこが弱いか、復習提案）
- `createdAt`

### 2-9. Mastery（習熟度）

- `id` (uuid)
- `userId` (fk)
- `goalId` (fk)
- `scopeType`（`module` | `tag` | `skill`）
- `scopeKey`（例: moduleId / tag名）
- `level`（0.0〜1.0 等）
- `evidence`（json: ログ/テストの根拠）
- `updatedAt`

### 2-10. Conversation / Message（学習支援チャット）

#### Conversation

- `id` (uuid)
- `userId` (fk)
- `goalId` (fk)
- `curriculumItemId`（任意: 文脈付け）
- `title`（任意）
- `createdAt`

#### Message

- `id` (uuid)
- `conversationId` (fk)
- `role`（`user` | `assistant` | `system`）
- `content`
- `metadata`（json: 引用/参照/安全フィルタ情報など）
- `createdAt`

---

## 3. 重要な設計ポイント

### 3-1. カリキュラムの版管理

- `Curriculum.version`で履歴を残す
- ある時点の計画と、実績ログの関係を追跡できる
- 再計画時は「新versionを作る」方針がシンプル

### 3-2. 日次計画の表現

- `CurriculumItem.startAt`/`dueAt`を使う（もしくは別テーブル `Schedule` を作る）
- MVPは`task`に日付を直接付けてもよい

### 3-3. AIの生成物の透明性

- `Curriculum.generationContext`や`CurriculumResource.reason`に、
  「なぜこの順序/教材なのか」を保存して、UIで説明可能にする
