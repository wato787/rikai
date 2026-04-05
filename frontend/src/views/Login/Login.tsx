import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { motion } from "motion/react";

import { useLogin } from "./useLogin";

export const Login = () => {
  const { login, isPending, error } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const message = error instanceof Error ? error.message : null;

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-12 justify-center">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-600/20">
            R
          </div>
          <span className="font-bold text-2xl tracking-tight text-zinc-900">Rikai</span>
        </div>

        <div className="bg-white border border-zinc-100 rounded-[2.5rem] p-10 shadow-sm">
          <header className="mb-8">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">おかえりなさい</h1>
            <p className="text-sm text-zinc-400 font-medium">
              アカウントにログインして学習を再開しましょう。
            </p>
          </header>

          {message ? (
            <p
              className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
              role="alert"
            >
              {message}
            </p>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
              >
                メールアドレス
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                  size={18}
                  aria-hidden
                />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(ev) => setEmail(ev.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label
                  htmlFor="login-password"
                  className="text-xs font-bold text-zinc-500 uppercase tracking-widest"
                >
                  パスワード
                </label>
                <button
                  type="button"
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest"
                >
                  忘れた場合
                </button>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                  size={18}
                  aria-hidden
                />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {isPending ? "ログイン中…" : "ログイン"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <p className="text-sm text-zinc-400 font-medium">
              アカウントをお持ちでないですか？{" "}
              <Link
                to="/signup"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                無料で登録
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
