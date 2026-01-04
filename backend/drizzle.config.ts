import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts", // スキーマファイルの場所
  out: "./drizzle", // SQLファイルの出力先
  dialect: "sqlite", // D1はSQLiteベースなのでsqliteを指定
  dbCredentials: {
    url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/4b0a8873fcb9b73b46869d12a4aa2caa5ce8fda261c88d436cfa5e0e5918c82f.sqlite",
  },
});
