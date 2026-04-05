import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, Mail, User } from "lucide-react";
import { motion } from "motion/react";

import { authClient } from "@/lib/auth-client";

import { sessionQueryKey } from "./queries";

export function Signup() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError("利用規約への同意が必要です。");
      return;
    }
    setSubmitting(true);
    try {
      const { error: signErr } = await authClient.signUp.email({
        name,
        email,
        password,
      });
      if (signErr) {
        setError(signErr.message ?? "登録に失敗しました。");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
      await navigate({ to: "/" });
    } finally {
      setSubmitting(false);
    }
  }

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
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">アカウント作成</h1>
            <p className="text-sm text-zinc-400 font-medium">
              Rikaiで効率的な学習ロードマップを作成しましょう。
            </p>
          </header>

          {error ? (
            <p
              className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-4 py-3"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <form className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
            <div className="space-y-2">
              <label
                htmlFor="signup-name"
                className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
              >
                お名前
              </label>
              <div className="relative group">
                <User
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                  size={18}
                  aria-hidden
                />
                <input
                  id="signup-name"
                  type="text"
                  autoComplete="name"
                  placeholder="山田 太郎"
                  value={name}
                  onChange={(ev) => setName(ev.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-email"
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
                  id="signup-email"
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
              <label
                htmlFor="signup-password"
                className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1"
              >
                パスワード
              </label>
              <p className="text-[10px] text-zinc-400 ml-1">8文字以上を推奨します。</p>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-emerald-500 transition-colors pointer-events-none"
                  size={18}
                  aria-hidden
                />
                <input
                  id="signup-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="py-2">
              <label className="flex items-center gap-2 cursor-pointer text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(ev) => setAgreed(ev.target.checked)}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" aria-hidden />
                <span>利用規約に同意します</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {submitting ? "登録中…" : "登録して始める"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <p className="text-sm text-zinc-400 font-medium">
              すでにアカウントをお持ちですか？{" "}
              <Link
                to="/login"
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
