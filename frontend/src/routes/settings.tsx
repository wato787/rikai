import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";

import { Settings } from "@/views/Settings/Settings";
import { sessionQueryOptions } from "@/views/Settings/queries";

const SettingsPending = () => (
  <div className="py-16 text-center text-zinc-500 font-medium">読み込み中…</div>
);

function SettingsRouteError(_: ErrorComponentProps) {
  return (
    <div className="py-16 text-center space-y-4">
      <p className="text-zinc-500 font-medium">設定を読み込めませんでした。</p>
      <Link to="/" className="text-emerald-700 font-bold hover:underline">
        ホームへ戻る
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sessionQueryOptions),
  pendingComponent: SettingsPending,
  errorComponent: SettingsRouteError,
  component: SettingsPage,
});

function SettingsPage() {
  const { data: session } = useSuspenseQuery(sessionQueryOptions);
  return <Settings session={session} />;
}
