# backend

Hono + Cloudflare Workers + Bun で動く API サーバーです。

## 前提

- `bun`（ルートの `mise.toml` でバージョン固定）
- Cloudflare Workers（`wrangler`）

## セットアップ

```bash
# リポジトリルートで
bun install
```

## ローカル開発

```bash
# backend 配下で API サーバー起動（http://localhost:8080）
bun run dev
```

リポジトリルートから起動する場合:

```bash
# backend / frontend / stripe listen を並列起動
mise run dev
```

## 主要コマンド（backend）

```bash
bun run dev          # wrangler dev --port 8080
bun run build        # build
bun run start        # dist 実行
bun run test         # bun test
bun run lint         # oxlint
bun run format:check # oxfmt check
```

## DB 操作（D1 local）

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run db:reset
```

## ヘルスチェック

- `GET /health` で稼働確認できます。
