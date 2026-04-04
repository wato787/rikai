import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Rikai</h1>
        <p className="text-slate-600 text-sm">アプリは再構築予定です。</p>
      </div>
    </div>
  );
}
