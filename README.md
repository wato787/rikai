# rikai

## GitHub Actions: PR 自動アサイン

PR 作成時（`opened` / `ready_for_review`）に、PR 作成者を自動で Assignee に設定します。

- ワークフロー: `.github/workflows/pr_auto_assign.yaml`

### リポジトリ設定（初回のみ）

GitHub の `Settings -> Actions -> General -> Workflow permissions` で **Read and write permissions** を選択してください。
