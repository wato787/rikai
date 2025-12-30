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

## 環境変数管理 (dotenvx)

```bash
# バックエンドの環境変数を取得
mise dotenvx:get:backend

# フロントエンドの環境変数を取得
mise dotenvx:get:frontend

# バックエンドの環境変数を暗号化
mise dotenvx:encrypt:backend

# フロントエンドの環境変数を暗号化
mise dotenvx:encrypt:frontend
```
