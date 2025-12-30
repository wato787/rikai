# dotenvx 使用ガイド

## dotenvx とは

dotenvx は、環境変数を安全に管理するためのツールです。従来の dotenv を拡張し、以下の機能を提供します：

- 環境変数の公開鍵暗号化
- 複数環境（開発・本番など）のサポート
- 暗号化された値の安全なリポジトリへのコミット
- 秘密鍵(.env.keys)の自動管理

## 基本的な使い方

### 1. 環境変数を暗号化

```bash
# バックエンドの環境変数を暗号化
mise dotenvx:encrypt:backend

# フロントエンドの環境変数を暗号化
mise dotenvx:encrypt:frontend
```

### 2. 環境変数を取得

```bash
# バックエンドの環境変数を表示
mise dotenvx:get:backend

# フロントエンドの環境変数を表示
mise dotenvx:get:frontend

# 特定の変数を取得（bunコマンドを直接使用）
cd backend
bun dotenvx get API_KEY
```

### 3. ヘルプを表示

```bash
# コマンド一覧を表示
mise dotenvx:help

# 特定のコマンドのヘルプ（bunコマンドを使用）
bun dotenvx help encrypt
```

## セキュリティに関する注意事項

- `.env.keys` ファイルには秘密鍵が含まれており、絶対にコミットしないでください
- `.env.keys` は `.gitignore` に含まれていることを確認してください
- 暗号化された `.env` ファイルと公開鍵は安全にコミットできます
- チームメンバーには `.env.keys` を安全な方法（パスワードマネージャーなど）で共有してください
