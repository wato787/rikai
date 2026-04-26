import { createFileRoute, Link } from "@tanstack/react-router";

function TermsPage() {
  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl bg-[#fafaf9] px-6 py-12 text-zinc-800">
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">利用規約</h1>
      <p className="mb-4 text-sm text-zinc-500">最終更新日: 2026-04-26</p>
      <div className="space-y-5 text-sm leading-7">
        <p>
          本サービス（Rikai）は、学習ロードマップ作成を支援する個人開発サービスです。利用者は法令および公序良俗に反する目的で利用してはいけません。
        </p>
        <p>
          アカウント管理は利用者の責任で行ってください。認証情報の漏えいにより生じた損害について、開発者は故意または重大な過失がある場合を除き責任を負いません。
        </p>
        <p>
          本サービスはベータ提供を含み、機能停止・変更・終了する場合があります。重要データは利用者自身で保全してください。
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

export const Route = createFileRoute("/terms")({
  component: TermsPage,
});
