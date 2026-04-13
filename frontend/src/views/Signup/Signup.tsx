import { useReducer, type FormEvent } from "react";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Lock, Mail } from "lucide-react";
import { m } from "motion/react";

import { useSignup } from "./useSignup";

const signupRouteApi = getRouteApi("/signup");

type SignupFormState = {
  email: string;
  password: string;
  agreed: boolean;
  agreementError: string | null;
};

type SignupFormAction =
  | { type: "setEmail"; value: string }
  | { type: "setPassword"; value: string }
  | { type: "setAgreed"; value: boolean }
  | { type: "clearAgreementError" }
  | { type: "setAgreementError"; message: string };

const initialSignupForm: SignupFormState = {
  email: "",
  password: "",
  agreed: false,
  agreementError: null,
};

function signupFormReducer(state: SignupFormState, action: SignupFormAction): SignupFormState {
  switch (action.type) {
    case "setEmail":
      return { ...state, email: action.value };
    case "setPassword":
      return { ...state, password: action.value };
    case "setAgreed":
      return { ...state, agreed: action.value };
    case "clearAgreementError":
      return { ...state, agreementError: null };
    case "setAgreementError":
      return { ...state, agreementError: action.message };
    default:
      return state;
  }
}

export const Signup = () => {
  const search = signupRouteApi.useSearch();
  const { signup, isPending, error } = useSignup();
  const [form, dispatch] = useReducer(signupFormReducer, initialSignupForm);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: "clearAgreementError" });
    if (!form.agreed) {
      dispatch({ type: "setAgreementError", message: "利用規約への同意が必要です。" });
      return;
    }
    signup({ email: form.email, password: form.password });
  };

  const message = form.agreementError ?? (error instanceof Error ? error.message : null);

  return (
    <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-4">
      <m.div
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
                  value={form.email}
                  onChange={(ev) => dispatch({ type: "setEmail", value: ev.target.value })}
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
                  value={form.password}
                  onChange={(ev) => dispatch({ type: "setPassword", value: ev.target.value })}
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
                  checked={form.agreed}
                  onChange={(ev) => dispatch({ type: "setAgreed", value: ev.target.checked })}
                  className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                />
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" aria-hidden />
                <span>利用規約に同意します</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-zinc-900 text-white text-sm font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2 group disabled:opacity-60 disabled:pointer-events-none"
            >
              {isPending ? "登録中…" : "登録して始める"}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-50 text-center">
            <p className="text-sm text-zinc-400 font-medium">
              すでにアカウントをお持ちですか？{" "}
              <Link
                to="/login"
                search={search.redirect ? { redirect: search.redirect } : {}}
                className="text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </m.div>
    </div>
  );
};
