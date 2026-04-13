# rikai

モノレポ構成のフルスタックアプリケーション

## 構成

- `backend/`: Hono + Bun バックエンド
- `frontend/`: React + Bun フロントエンド

## 初回セットアップ

### 依存関係のインストール

```bash
mise run install
```

### 開発サーバーの起動

```bash
# バックエンドとフロントエンドを並列起動
mise run dev
```

起動後、以下の URL でアクセスできます：

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 開発コマンド

```bash
# すべて起動（並列）
mise run dev

# バックエンドのみ起動
mise run dev:backend

# フロントエンドのみ起動
mise run dev:frontend

# lint / format
mise run lint
mise run lint:fix
mise run format
mise run format:check
mise run check

# ビルド
mise run build
mise run build:backend
mise run build:frontend

# クリーンアップ
mise run clean

# タスク一覧
mise tasks

# すべての型チェック
mise run typecheck

# フロントのみ
mise run typecheck:frontend

# バックエンドのみ
mise run typecheck:backend
```

## 環境変数

- **フロントエンド**: `frontend/.env`（Vite が自動読み込み）。テンプレートは `frontend/.env.example`。
- **バックエンド**: `backend/.env`（`bun` 実行時にカレントの `.env` を読み込み）。Drizzle Kit 用テンプレートは `backend/.env.example`。
- **Wrangler 開発**（`mise run dev:backend`）: シークレットは [Wrangler のドキュメント](https://developers.cloudflare.com/workers/configuration/secrets/) に従い `.dev.vars` などで管理。

以前 **dotenvx で暗号化した** `.env`（`encrypted:` や `DOTENV_PUBLIC_KEY` があるもの）を使っている場合は、**削除前に** `npx @dotenvx/dotenvx decrypt` でプレーンテキストに戻すか、`.env.example` をコピーして値を入れ直してください。
