import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Shield, Trash2 } from "lucide-react";

import { ApiRequestError, apiPost } from "@/lib/api-client";

import { subscriptionMeQueryOptions } from "./queries";

export function BillingSection() {
  const queryClient = useQueryClient();
  const { data, isPending } = useQuery(subscriptionMeQueryOptions());

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiPost<{ checkoutUrl: string }>("/subscriptions/checkout");
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
      await queryClient.invalidateQueries({ queryKey: subscriptionMeQueryOptions().queryKey });
    },
  });

  const sub = data?.subscription;
  const remainingCredits = sub?.remainingCredits ?? 0;
  const costPerGeneration = sub?.costPerRoadmapGeneration ?? 1;

  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-sm space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20 shrink-0">
            <Shield size={24} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-emerald-900">クレジット制</p>
            <p className="text-xs text-emerald-700/70 font-medium">
              {isPending
                ? "読み込み中…"
                : `ロードマップ生成1回あたり ${costPerGeneration} クレジットを消費します。`}
            </p>
            {!isPending ? (
              <p className="text-[11px] text-emerald-800/80 font-bold mt-2 tabular-nums">
                残りクレジット: {remainingCredits}
              </p>
            ) : null}
          </div>
        </div>
        <button
          type="button"
          disabled={checkoutMutation.isPending || isPending}
          onClick={() => checkoutMutation.mutate()}
          className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0 disabled:opacity-50 disabled:pointer-events-none"
        >
          {checkoutMutation.isPending ? "準備中…" : "クレジットを追加（準備中）"}
        </button>
      </div>

      <div className="space-y-4 pt-4">
        <button
          type="button"
          className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-3">
            <Trash2 size={18} className="text-zinc-400 group-hover:text-red-600" />
            <span className="text-sm font-bold text-zinc-600 group-hover:text-red-600">
              アカウントを削除
            </span>
          </div>
          <ChevronRight size={16} className="text-zinc-300" />
        </button>
      </div>
    </div>
  );
}
