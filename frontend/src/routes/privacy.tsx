import { createFileRoute, Link } from "@tanstack/react-router";

function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-[#fafaf9] px-6 py-12 text-zinc-800">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">プライバシーポリシー</h1>
      <p className="mb-4 text-sm text-zinc-500">最終更新日: 2026-04-26</p>
      <div className="space-y-5 text-sm leading-7">
        <p>
          本サービスは、アカウント作成・学習ロードマップ提供・課金処理のために必要な範囲で情報を取得します。決済情報はStripeにより処理され、開発者がカード情報を保持することはありません。
        </p>
        <p>
          取得した情報はサービス提供、障害対応、セキュリティ維持の目的で利用します。法令に基づく場合を除き、本人同意なく第三者提供は行いません。
        </p>
        <p>
          利用者はアカウント削除やデータ削除を希望する場合、開発者へ連絡することで対応を依頼できます。
        </p>
      </div>
      <Link
        to="/signup"
        className="mt-10 inline-block text-sm font-semibold text-emerald-700 underline"
      >
        サインアップへ戻る
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});
