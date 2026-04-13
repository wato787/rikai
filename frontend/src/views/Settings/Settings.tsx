import { CreditCard } from "lucide-react";

import { BillingSection } from "./BillingSection";

export function Settings() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">アカウント</h1>
        <p className="text-sm text-zinc-400 font-medium">
          プラン・請求に関する操作です。ログイン情報の管理はサインイン時に行います。
        </p>
      </header>
      <section>
        <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <CreditCard size={14} />
          プランと請求
        </h2>
        <BillingSection />
      </section>
    </div>
  );
}
