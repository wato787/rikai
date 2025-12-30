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
cd backend
bun dotenvx encrypt

# フロントエンドの環境変数を暗号化
cd frontend
bun dotenvx encrypt
```

### 2. 環境変数を取得

```bash
# 現在の環境変数を表示
bun dotenvx get

# 特定の変数を取得
bun dotenvx get API_KEY
```

### 3. ヘルプを表示

```bash
# コマンド一覧を表示
bun dotenvx help

# 特定のコマンドのヘルプ
bun dotenvx help encrypt
```

## セキュリティに関する注意事項

- `.env.keys` ファイルには秘密鍵が含まれており、絶対にコミットしないでください
- `.env.keys` は `.gitignore` に含まれていることを確認してください
- 暗号化された `.env` ファイルと公開鍵は安全にコミットできます
- チームメンバーには `.env.keys` を安全な方法（パスワードマネージャーなど）で共有してください
