import type { QueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  createRootRouteWithContext,
  Link,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { LayoutGrid, PanelLeftClose, PanelLeftOpen, Settings as SettingsIcon } from "lucide-react";
import { LazyMotion, domAnimation } from "motion/react";
import { parseAuthPageSearch, sessionQueryOptions } from "@/lib/auth-session";
import "@/index.css";

const SIDEBAR_OPEN_KEY = "rikai.sidebarOpen";
/** 旧キー（移行用） */
const SIDEBAR_COLLAPSED_LEGACY_KEY = "rikai.sidebarCollapsed";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(sessionQueryOptions);
    const path = location.pathname;
    const isAuthPage = path === "/login" || path === "/signup";

    if (!session && !isAuthPage) {
      const returnTo = path === "/" ? undefined : `${path}${location.search}`;
      const search = returnTo ? parseAuthPageSearch({ redirect: returnTo }) : {};
      throw redirect({ to: "/login", search });
    }

    if (session && isAuthPage) {
      throw redirect({ to: "/" });
    }

    return { session };
  },
  component: RootComponent,
});

function RootComponent() {
  return (
    <LazyMotion features={domAnimation} strict>
      <AppShell />
      {import.meta.env.DEV ? <TanStackRouterDevtools position="bottom-right" /> : null}
    </LazyMotion>
  );
}

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isRoadmapsSection = pathname === "/" || pathname.startsWith("/roadmap/");
  const isSettings = pathname === "/settings";

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_OPEN_KEY);
      if (raw === "0") {
        setSidebarOpen(false);
      } else if (raw === "1") {
        setSidebarOpen(true);
      } else {
        const legacy = localStorage.getItem(SIDEBAR_COLLAPSED_LEGACY_KEY);
        if (legacy === "1" || legacy === "true") {
          setSidebarOpen(false);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  if (isAuthPage) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] font-sans text-zinc-800 selection:bg-emerald-100 selection:text-emerald-900 flex">
      <aside
        id="app-sidebar"
        className={`bg-white/50 backdrop-blur-md flex flex-col sticky top-0 h-screen shrink-0 z-50 border-r border-zinc-100/50 transition-all duration-300 motion-reduce:transition-none ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-24 shrink-0 items-center justify-between px-6">
          <Link
            to="/"
            className={`flex min-w-0 cursor-default items-center gap-3 overflow-hidden rounded-lg outline-none transition-all duration-300 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
              sidebarOpen ? "w-auto opacity-100" : "pointer-events-none w-0 opacity-0"
            }`}
            aria-hidden={!sidebarOpen}
            tabIndex={sidebarOpen ? undefined : -1}
            aria-label="Rikai ホーム"
            title="ホーム"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-600/20">
              R
            </div>
            <span className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-900">
              Rikai
            </span>
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            aria-label={sidebarOpen ? "サイドバーを折りたたむ" : "サイドバーを展開"}
            className="shrink-0 rounded-xl p-2 text-zinc-400 transition-all hover:bg-zinc-100/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
          >
            {sidebarOpen ? (
              <PanelLeftClose size={20} aria-hidden />
            ) : (
              <PanelLeftOpen size={20} aria-hidden />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          <Link
            to="/"
            title={sidebarOpen ? undefined : "ロードマップ"}
            aria-label={sidebarOpen ? undefined : "ロードマップ"}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
              isRoadmapsSection
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600"
            }`}
          >
            <LayoutGrid size={18} className="shrink-0" aria-hidden />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 motion-reduce:transition-none ${
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              ロードマップ
            </span>
          </Link>
          <Link
            to="/settings"
            title={sidebarOpen ? undefined : "アカウント設定"}
            aria-label={sidebarOpen ? undefined : "アカウント設定"}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
              isSettings
                ? "bg-emerald-50 text-emerald-700"
                : "text-zinc-400 hover:bg-zinc-100/50 hover:text-zinc-600"
            }`}
          >
            <SettingsIcon size={18} className="shrink-0" aria-hidden />
            <span
              className={`overflow-hidden whitespace-nowrap transition-all duration-300 motion-reduce:transition-none ${
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              }`}
            >
              アカウント
            </span>
          </Link>
        </nav>

        <div
          className={`shrink-0 transition-all duration-300 motion-reduce:transition-none ${
            sidebarOpen ? "p-6 opacity-100" : "h-0 overflow-hidden p-0 opacity-0"
          }`}
        >
          <div className="rounded-2xl border border-emerald-100/50 bg-emerald-50/50 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
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
    </div>
  );
}
