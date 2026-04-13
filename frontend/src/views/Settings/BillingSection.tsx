import { ChevronRight, Shield, Trash2 } from "lucide-react";

export function BillingSection() {
  return (
    <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between p-6 bg-emerald-50/50 rounded-[2rem] border border-emerald-100/50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
            <Shield size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-900">フリープラン</p>
            <p className="text-xs text-emerald-700/70 font-medium">
              現在、無料版をご利用いただいています。
            </p>
          </div>
        </div>
        <button
          type="button"
          className="px-6 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
        >
          アップグレード
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
