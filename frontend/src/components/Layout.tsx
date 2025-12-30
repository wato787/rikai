import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Plus, BookOpen, BrainCircuit } from "lucide-react";

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { icon: <Home size={22} />, label: "ホーム", path: "/" },
    { icon: <Plus size={22} />, label: "作成", path: "/create" },
    { icon: <BookOpen size={22} />, label: "ライブラリ", path: "/list" },
  ];

  return (
    <div className="flex h-screen w-full ">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300">
        <div className="p-6 flex items-center gap-3 text-indigo-600 font-bold text-xl">
          <BrainCircuit size={32} />
          <span className="hidden lg:block truncate">MindMap AI</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-center lg:justify-start gap-4 px-3 py-3 rounded-2xl transition-all duration-200 group ${
                location.pathname === item.path
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                  : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <div className="flex-shrink-0">{item.icon}</div>
              <span
                className={`hidden lg:block font-medium ${location.pathname === item.path ? "text-white" : ""}`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-y-auto bg-[#F8FAFC] no-scrollbar">
        <div className="max-w-5xl mx-auto px-6 py-8 md:py-12">{children}</div>
      </main>
    </div>
  );
};
