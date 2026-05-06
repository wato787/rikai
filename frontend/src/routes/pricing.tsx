import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Coins, CreditCard, Sparkles } from "lucide-react";

import { apiPost, ApiRequestError } from "@/lib/api-client";
import { sessionQueryOptions } from "@/lib/auth-session";
import { billingMeQueryOptions } from "@/views/Pricing/queries";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const queryClient = useQueryClient();
  const { data: session } = useQuery(sessionQueryOptions);
  const isLoggedIn = !!session;
  const { data: billingData, isPending: isBillingPending } = useQuery({
    ...billingMeQueryOptions(),
    enabled: isLoggedIn,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost<{ checkoutUrl: string }>("/billing/checkout");
      window.location.assign(res.checkoutUrl);
    },
    onError: (err) => {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : err instanceof Error
            ? err.message
            : "チェックアウトを開始できませんでした。";
      window.alert(msg);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingMeQueryOptions().queryKey });
    },
  });

  const remainingCredits = billingData?.billing.remainingCredits ?? 0;
  const costPerGeneration = billingData?.billing.costPerRoadmapGeneration ?? 1;

  return (
    <div className="min-h-screen bg-[#f6f4ef] px-4 py-10 text-zinc-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[2rem] border border-zinc-200/70 bg-white/90 p-8 shadow-sm shadow-zinc-900/5 sm:p-12">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              <Sparkles size={14} aria-hidden />
              Credit Based Billing
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
              学びたい時に、必要な分だけ。
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
              Rikai は月額サブスクリプションではなく、ロードマップ生成に使うクレジットを都度追加する方式です。
              最初は無料クレジットから始めて、必要になった時だけ購入できます。
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-sm font-semibold text-zinc-600">
              <span className="rounded-full bg-zinc-100 px-4 py-2">初期クレジットあり</span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">
                生成 1 回 = {costPerGeneration} クレジット
              </span>
              <span className="rounded-full bg-zinc-100 px-4 py-2">Stripe Checkout 対応</span>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-zinc-200/70 bg-white p-8 shadow-sm shadow-zinc-900/5">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                <Coins size={22} aria-hidden />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">クレジット制</h2>
                <p className="text-sm text-zinc-500">課金前に仕組みが分かる、シンプルな購入導線です。</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                "新規ユーザーには初期クレジットを付与",
                "ロードマップ生成時だけクレジットを消費",
                "残高不足時だけ追加購入すればよい",
                "継続課金や自動更新の心配がない",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-zinc-50 px-4 py-4">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    <Check size={14} aria-hidden />
                  </div>
                  <p className="text-sm font-medium leading-7 text-zinc-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60 p-8 shadow-sm shadow-emerald-900/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                  Purchase
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900">
                  クレジットを追加
                </h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <CreditCard size={22} aria-hidden />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/80 bg-white/80 p-5">
              <p className="text-sm font-medium text-zinc-500">現在の状態</p>
              {isLoggedIn ? (
                <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
                  {isBillingPending ? "..." : remainingCredits}
                  <span className="ml-2 text-sm font-semibold text-zinc-500">credits</span>
                </p>
              ) : (
                <p className="mt-3 text-lg font-semibold text-zinc-900">
                  ログイン後に残高と購入ボタンを表示
                </p>
              )}
              <p className="mt-3 text-sm leading-7 text-zinc-600">
                購入後は Stripe Checkout から戻り、クレジット残高に反映されます。
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {isLoggedIn ? (
                <button
                  type="button"
                  disabled={checkoutMutation.isPending || isBillingPending}
                  onClick={() => checkoutMutation.mutate()}
                  className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-60"
                >
                  {checkoutMutation.isPending ? "決済ページへ移動中…" : "Stripeで購入する"}
                </button>
              ) : (
                <>
                  <Link
                    to="/signup"
                    search={{ redirect: "/pricing" }}
                    className="flex w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-zinc-800"
                  >
                    無料で始める
                  </Link>
                  <Link
                    to="/login"
                    search={{ redirect: "/pricing" }}
                    className="flex w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-sm font-bold text-zinc-800 transition-all hover:bg-zinc-50"
                  >
                    ログインして購入する
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
