# dotenvx 使用ガイド

## dotenvx とは

dotenvx は、環境変数を安全に管理するためのツールです。従来の dotenv を拡張し、以下の機能を提供します：

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

```bash
# 現在の環境変数を表示
bun dotenvx get

# 特定の変数を取得
bun dotenvx get API_KEY
```

```bash
# コマンド一覧を表示
bun dotenvx help

# 特定のコマンドのヘルプ
bun dotenvx help encrypt
```
