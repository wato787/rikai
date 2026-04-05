import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { LayoutGrid, Settings as SettingsIcon } from "lucide-react";
import { CreateRoadmapModal, RoadmapMockProvider } from "@/views/Roadmap";
import "@/index.css";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <RoadmapMockProvider>
      <AppShell />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </RoadmapMockProvider>
  );
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isRoadmapsSection = pathname === "/" || pathname.startsWith("/roadmap/");
  const isSettings = pathname === "/settings";

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-zinc-800 selection:bg-emerald-100 selection:text-emerald-900 flex">
      <aside className="w-64 bg-white/50 backdrop-blur-md flex flex-col sticky top-0 h-screen shrink-0 z-50">
        <div className="h-24 flex items-center px-10">
          <Link to="/" className="flex items-center gap-3 cursor-default">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-emerald-600/20">
              R
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">Rikai</span>
          </Link>
        </div>

        <nav className="flex-1 px-6 py-4 space-y-2">
          <Link
            to="/"
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              isRoadmapsSection
                ? "text-emerald-700 bg-emerald-50"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            }`}
          >
            <LayoutGrid size={18} />
            <span>ロードマップ</span>
          </Link>
          <Link
            to="/settings"
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              isSettings
                ? "text-emerald-700 bg-emerald-50"
                : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50"
            }`}
          >
            <SettingsIcon size={18} />
            <span>設定</span>
          </Link>
        </nav>

        <div className="p-8">
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-1">
              現在のプラン
            </p>
            <p className="text-xs font-bold text-zinc-900">フリープラン</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto p-16 max-w-5xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <CreateRoadmapModal />
    </div>
  );
}
