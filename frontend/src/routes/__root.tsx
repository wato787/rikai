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
import {
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { LazyMotion, domAnimation } from "motion/react";
import { SoftTooltip } from "@/components/SoftTooltip";
import { parseAuthPageSearch, sessionQueryOptions } from "@/lib/auth-session";
import "@/index.css";

const SIDEBAR_OPEN_KEY = "rikai.sidebarOpen";
/** 旧キー（移行用） */
const SIDEBAR_COLLAPSED_LEGACY_KEY = "rikai.sidebarCollapsed";

const planTooltipLabel = (
  <span className="block max-w-[14rem] text-pretty">
    <span className="block text-[11px] font-medium text-zinc-500">現在のプラン</span>
    <span className="mt-1 block text-sm font-semibold tracking-tight text-zinc-900">
      フリープラン
    </span>
  </span>
);

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
        className={`flex h-screen shrink-0 sticky top-0 z-50 flex-col border-r border-zinc-100/50 bg-white/60 backdrop-blur-md transition-[width] duration-300 ease-out motion-reduce:transition-none ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-24 shrink-0 items-center justify-between px-6">
          <SoftTooltip
            label="ホームへ"
            enabled={sidebarOpen}
            side="right"
            className="block min-w-0 flex-1 overflow-hidden transition-[opacity,width] duration-300 ease-out motion-reduce:transition-none"
          >
            <Link
              to="/"
              className={`flex min-w-0 cursor-default items-center gap-3 overflow-hidden rounded-lg outline-none transition-[opacity,width] duration-300 ease-out focus-visible:ring-2 focus-visible:ring-emerald-500/35 motion-reduce:transition-none ${
                sidebarOpen ? "w-auto opacity-100" : "pointer-events-none w-0 opacity-0"
              }`}
              aria-hidden={!sidebarOpen}
              tabIndex={sidebarOpen ? undefined : -1}
              aria-label="Rikai ホーム"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white shadow-sm shadow-emerald-600/20">
                R
              </div>
              <span className="whitespace-nowrap text-xl font-bold tracking-tight text-zinc-900">
                Rikai
              </span>
            </Link>
          </SoftTooltip>
          <SoftTooltip
            label={sidebarOpen ? "サイドバーを折りたたむ" : "サイドバーを展開"}
            side="right"
            className="inline-flex shrink-0"
          >
            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              aria-label={sidebarOpen ? "サイドバーを折りたたむ" : "サイドバーを展開"}
              className="rounded-xl p-2 text-zinc-400 transition-colors duration-200 hover:bg-zinc-100/60 hover:text-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              {sidebarOpen ? (
                <PanelLeftClose size={20} aria-hidden />
              ) : (
                <PanelLeftOpen size={20} aria-hidden />
              )}
            </button>
          </SoftTooltip>
        </div>

        <nav className="flex-1 space-y-2 px-4 py-4">
          <SoftTooltip
            label="ロードマップ一覧"
            enabled={!sidebarOpen}
            side="right"
            className="block w-full"
          >
            <Link
              to="/"
              aria-label={sidebarOpen ? undefined : "ロードマップ"}
              className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 ${
                isRoadmapsSection
                  ? "bg-emerald-50/90 text-emerald-800"
                  : "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800"
              }`}
            >
              <LayoutGrid size={18} className="shrink-0 opacity-90" aria-hidden />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out motion-reduce:transition-none ${
                  sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                ロードマップ
              </span>
            </Link>
          </SoftTooltip>
          <SoftTooltip
            label="アカウント設定"
            enabled={!sidebarOpen}
            side="right"
            className="block w-full"
          >
            <Link
              to="/settings"
              aria-label={sidebarOpen ? undefined : "アカウント設定"}
              className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 ${
                isSettings
                  ? "bg-emerald-50/90 text-emerald-800"
                  : "text-zinc-500 hover:bg-zinc-100/70 hover:text-zinc-800"
              }`}
            >
              <SettingsIcon size={18} className="shrink-0 opacity-90" aria-hidden />
              <span
                className={`overflow-hidden whitespace-nowrap transition-[opacity,width] duration-300 ease-out motion-reduce:transition-none ${
                  sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                }`}
              >
                アカウント
              </span>
            </Link>
          </SoftTooltip>
        </nav>

        <div
          className={`shrink-0 transition-[padding,opacity] duration-300 ease-out motion-reduce:transition-none ${
            sidebarOpen ? "p-6" : "flex justify-center px-2 pb-4 pt-2"
          }`}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200/70 bg-white/85 p-3.5 shadow-sm shadow-zinc-900/5 ring-1 ring-zinc-950/[0.04] backdrop-blur-sm">
              <SoftTooltip label={planTooltipLabel} side="top" className="inline-flex shrink-0">
                <button
                  type="button"
                  className="flex touch-manipulation rounded-lg p-2 text-emerald-600/90 transition-colors duration-200 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                  aria-label="現在のプラン: フリープラン"
                >
                  <Sparkles size={17} strokeWidth={1.75} aria-hidden />
                </button>
              </SoftTooltip>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-zinc-500">現在のプラン</p>
                <p className="text-sm font-semibold tracking-tight text-zinc-900">フリープラン</p>
              </div>
            </div>
          ) : (
            <SoftTooltip label={planTooltipLabel} side="right" className="inline-flex">
              <button
                type="button"
                className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl border border-zinc-200/70 bg-white/85 text-emerald-600/90 shadow-sm shadow-zinc-900/5 ring-1 ring-zinc-950/[0.04] transition-colors duration-200 hover:bg-emerald-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                aria-label="現在のプラン: フリープラン"
              >
                <Sparkles size={19} strokeWidth={1.75} aria-hidden />
              </button>
            </SoftTooltip>
          )}
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
