import { createFileRoute, Link, type ErrorComponentProps } from "@tanstack/react-router";

import { Settings } from "@/views/Settings/Settings";

function SettingsRouteError(_: ErrorComponentProps) {
  return (
    <div className="py-16 text-center space-y-4">
      <p className="text-zinc-500 font-medium">ページを読み込めませんでした。</p>
      <Link to="/" className="text-emerald-700 font-bold hover:underline">
        ホームへ戻る
      </Link>
    </div>
  );
}

export const Route = createFileRoute("/settings")({
  errorComponent: SettingsRouteError,
  component: SettingsPage,
});

function SettingsPage() {
  return <Settings />;
}
