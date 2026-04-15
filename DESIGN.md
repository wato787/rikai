# Rikai — DESIGN.md

AI エージェントおよび実装者向けの**見た目・UI ルール**の単一ソース（コード上のトークンは主に Tailwind ユーティリティ）。  
**画面フロー・項目定義**は `docs/rikai_screen_design.md`（画面設計書 v1.2）を正とする。

---

## 1. プロダクト概要

- **名前:** Rikai（SaaS）
- **スタック:** Vite + React（アプリ本体）。LP は別系統（Next.js）想定で本ファイルのスコープ外。
- **トーン:** 落ち着いたストーン系背景に **エメラルドのアクセント**。情報密度は中程度。角は大きめ（`rounded-xl`〜`rounded-[2.5rem]`）でソフトな印象。
- **言語:** UI 文言は日本語が前提（`index.html` の `lang` は実装と揃えるとよい）。

---

## 2. カラー（セマンティック）

実装では Tailwind の **zinc**（ニュートラル）と **emerald**（ブランド・アクション・成功系）を主に使用する。

| 役割 | 指針 | 実装の例（参考） |
|------|------|------------------|
| ページ背景 | わずかに温かいオフホワイト | `bg-[#fafaf9]` |
| 本文 | 読みやすいダークグレー | `text-zinc-800`、見出し `text-zinc-900` |
| 補助テキスト | muted | `text-zinc-400`〜`text-zinc-500` |
| ボーダー | ごく薄い区切り | `border-zinc-100` |
| サーフェス（カード等） | 白＋薄ボーダー | `bg-white border border-zinc-100` |
| ブランド / プライマリ CTA | エメラルド | `bg-emerald-600`、hover `bg-emerald-700` |
| ブランド薄色（ハイライト・プラン枠） | 淡いエメラルド | `bg-emerald-50`, `border-emerald-100/50` |
| ナビ・アクセント文 | エメラルド系テキスト | `text-emerald-700`, `text-emerald-800` |
| 選択テキスト | ブランドに合わせる | `selection:bg-emerald-100 selection:text-emerald-900` |
| 危険・削除 | 赤 | `text-red-600`, `hover:bg-red-50`、エラー `bg-red-50 border-red-100` |
| フォーカスリング | エメラルドの透明リング | `focus:ring-emerald-500/10 focus:border-emerald-500` |

**React Flow（ロードマップグラフ）:** ノードのステータス色は設計書どおり **未着手＝グレー / 学習中＝イエロー / 完了＝グリーン** を基本とする（実装のパレットと齟齬があれば設計書を優先して揃える）。

---

## 3. タイポグラフィ

- **フォント:** システム UI スタック（`index.css` の `body` と同等）。Tailwind では `font-sans`。
- **スムージング:** `antialiased` 相当をベースに維持。
- **見出し:** `font-bold`、`tracking-tight` を多用。ページタイトル級は `text-2xl` 前後。
- **ラベル（フォーム・セクション）:** 小さめ＋大文字トラッキングのパターンあり（例: `text-xs font-bold text-zinc-500 uppercase tracking-widest`）。
- **数字:** 必要に応じて `tabular-nums`（請求・件数など）。

---

## 4. スペーシングとレイアウト

- **アプリシェル:** 左固定サイドバー（幅 `w-64`）、メインは `flex-1`。サイドバーは `sticky top-0 h-screen`、`backdrop-blur` 付きの半透明（`bg-white/50 backdrop-blur-md`）。
- **メインコンテンツエリア:** `p-16`、`max-w-5xl`、`mx-auto`（`__root.tsx` の `AppShell`）。新規画面も原則この枠に収める。
- **サイドバー内:** ロゴ行 `h-24`、ナビは `px-4 py-3` の太めタップターゲット。
- **カード内パディング:** `p-8`〜`p-10` が多い。

---

## 5. 形状・深度

- **角丸:** ボタン・ナビ項目 `rounded-xl`、カード `rounded-2xl`、認証カードは `rounded-[2.5rem]` など大きめも可。
- **影:** 控えめ。`shadow-sm`、CTA に `shadow-md shadow-emerald-600/20` 程度。
- **アイコン付きロゴマーク:** `rounded-lg` または `rounded-xl` の正方形、`bg-emerald-600`、白文字（「R」など）。

---

## 6. コンポーネントパターン

### 6.1 サイドバーナビ

- 未選択: `text-zinc-400`、`hover:text-zinc-600 hover:bg-zinc-100/50`
- 選択中: `text-emerald-700 bg-emerald-50`
- アイコン＋ラベル横並び、`text-sm font-bold`

### 6.2 プラン表示（サイドバー下部）

- `bg-emerald-50/50`、`border-emerald-100/50`、`rounded-2xl`
- キャプションは極小＋`uppercase tracking-widest`

### 6.3 プライマリボタン

- `bg-emerald-600 text-white font-bold rounded-xl`
- hover で `bg-emerald-700`、`transition-all`
- 押下フィードバック: `active:scale-95`（過度に効かせない）
- 無効: `disabled:opacity-50 disabled:pointer-events-none`

### 6.4 テキストフィールド

- 背景 `bg-zinc-50`、`border-zinc-100`、`rounded-2xl`
- フォーカス時はリング＋ボーダーをエメラルド系に

### 6.5 エラー表示

- フォーム上部のインラインアラート: `text-red-600 bg-red-50 border-red-100 rounded-2xl`

### 6.6 モーダル・生成フロー

- ダッシュボードの新規作成は**モーダル**（専用 `/generate` ページは現状なし）。モーダルも同じトークン（白カード・角丸・エメラルド CTA）で統一する。

---

## 7. モーション

- `index.css` に `fade-in` / `slide-in-*` / `zoom-in` 系のユーティリティあり。**`prefers-reduced-motion` ではアニメーション無効**（必ず維持）。
- 過剰なバウンスや長いイージングは避け、200〜500ms 程度の実用的な遷移に留める。

---

## 8. アクセシビリティ

- インタラクティブ要素は**キーボード操作可能**に。`focus-visible` でフォーカスが見えること。
- アイコンのみのボタンは `aria-label` 等で名前を付与。
- エラーは**テキストで説明**（色のみに依存しない）。
- コントラスト: 本文 `zinc-800/900` on オフホワイト／白を基準に、muted は読みすぎない程度に。

---

## 9. Do / Don’t

**Do**

- プライマリアクションはエメラルド系に統一する。
- レイアウトは「サイドバー＋限幅メイン」に合わせる。
- 画面仕様の齟齬は `docs/rikai_screen_design.md` と突き合わせ、見た目の変更が必要なら本ファイルも更新する。

**Don’t**

- 別ブランド色（例: 青・紫）を CTA に混ぜない（例外が必要なら明示的にセクションで定義してから）。
- React Flow の attribution を表示しない方針なら、ライセンス遵守の範囲で `proOptions.hideAttribution` 等の**既存方針を壊さない**。
- 低コントラストの薄グレーだけで重要情報を伝えない。

---

## 10. 関連ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| `docs/rikai_screen_design.md` | 画面 ID、URL、フォーム、React Flow 仕様、実装差分メモ |
| `docs/rikai_requirements.md` | 要件 |
| `.cursor/skills/web-design-guidelines/SKILL.md` | 汎用 Web UI ガイドライン（必要時） |

---

**メンテ:** UI の「決め」を変えたら、本ファイルと実装の両方を更新し、画面フロー変更は `docs/rikai_screen_design.md` 側も追随させる。
