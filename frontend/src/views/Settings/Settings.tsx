import { useState } from "react";
import { CreditCard, ChevronRight, Shield, Trash2, User } from "lucide-react";

export function Settings() {
  const [name, setName] = useState("表示名（モック）");
  const [email, setEmail] = useState("user@example.com");

  return (
    <div className="max-w-4xl mx-auto px-4">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight mb-2">設定</h1>
        <p className="text-sm text-zinc-400 font-medium">
          アカウントとアプリケーションの環境設定を管理します。
        </p>
      </header>

      <div className="space-y-12">
        <section>
          <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <User size={14} />
            プロフィール
          </h2>
          <div className="bg-white border border-zinc-100 rounded-2xl p-8 shadow-sm space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 text-2xl font-bold border-4 border-white shadow-sm">
                RK
              </div>
              <div>
                <button
                  type="button"
                  className="px-4 py-2 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-all mb-2"
                >
                  写真を変更
                </button>
                <p className="text-[10px] text-zinc-400 font-medium">JPG, GIF, PNG. 最大 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="settings-display-name" className="text-xs font-bold text-zinc-500">
                  表示名
                </label>
                <input
                  id="settings-display-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="settings-email" className="text-xs font-bold text-zinc-500">
                  メールアドレス
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
            <CreditCard size={14} />
            アカウントと請求
          </h2>
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
        </section>
      </div>
    </div>
  );
}
