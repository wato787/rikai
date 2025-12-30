import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, BookOpen, LogIn } from "lucide-react";
import type { User } from "../types";

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
}

export const Layout: React.FC<LayoutProps> = ({ children, user }) => {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={22} />, label: "ホーム", path: "/" },
    { icon: <Plus size={22} />, label: "作成", path: "/create" },
    { icon: <BookOpen size={22} />, label: "ライブラリ", path: "/list" },
  ];

  const isAuthPage = location.pathname === "/auth";
  if (isAuthPage) return <>{children}</>;

  const isGuest = user?.id === "guest";

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3 text-indigo-600 mb-6">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/assets/logo.png" alt="Rikai" className="w-full h-full object-contain" />
          </div>
          <span className="hidden lg:block font-black text-2xl tracking-tighter text-slate-900">
            Rikai
          </span>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center lg:justify-start gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </div>
              <span
                className={`hidden lg:block font-bold tracking-tight text-sm ${location.pathname === item.path ? "text-white" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        {/* User Info / Profile Section */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          {isGuest ? (
            <Link
              to="/auth"
              className="flex items-center justify-center lg:justify-start gap-4 p-4 rounded-[24px] bg-slate-900 text-white transition-all hover:bg-slate-800 shadow-xl shadow-slate-200 group"
            >
              <div className="flex-shrink-0 transition-transform group-hover:scale-110">
                <LogIn size={20} />
              </div>
              <span className="hidden lg:block font-black text-sm">ログイン / 登録</span>
            </Link>
          ) : (
            <Link
              to="/profile"
              className={`flex items-center justify-center lg:justify-start gap-4 p-3 rounded-[24px] transition-all group ${
                location.pathname === "/profile"
                  ? "bg-slate-900 text-white shadow-xl"
                  : "bg-slate-50/50 hover:bg-slate-100"
              }`}
            >
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-white flex-shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-105">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.avatarId || "1"}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden lg:block flex-1 min-w-0">
                <div
                  className={`text-xs font-black truncate leading-none mb-1 ${location.pathname === "/profile" ? "text-white" : "text-slate-900"}`}
                >
                  {user?.name}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">
                  Active Account
                </div>
              </div>
            </Link>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto no-scrollbar relative">
        <div
          className={`${location.pathname.includes("/curriculum/") ? "p-0" : "max-w-7xl mx-auto px-6 py-8 md:py-12"}`}
        >
          {children}
        </div>
      </main>
    </div>
  );
};
