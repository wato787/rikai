import React, { useState } from "react";
import type { User } from "../types";
import {
  Check,
  LogOut,
  Shield,
  Bell,
  CreditCard,
  ChevronRight,
  User as UserIcon,
} from "lucide-react";

interface ProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatarId);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const avatars = ["1", "2", "3", "4", "5", "6", "7", "8"];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate({ ...user, name, bio, avatarId: selectedAvatar });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const menuItems = [
    { icon: <Shield size={20} />, label: "セキュリティ設定", sub: "パスワードと二段階認証" },
    { icon: <Bell size={20} />, label: "通知カスタマイズ", sub: "学習通知とメール配信" },
    { icon: <CreditCard size={20} />, label: "サブスクリプション", sub: "Rikai Premium 契約中" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">アカウント設定</h1>
          <p className="text-slate-500 mt-2 font-bold flex items-center gap-2">
            <UserIcon size={18} className="text-indigo-500" />
            あなたの学習体験をパーソナライズします。
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center justify-center gap-2 px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black hover:bg-rose-100 transition-all text-sm border border-rose-100 shadow-sm"
        >
          <LogOut size={18} />
          ログアウト
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-10">
        {/* Main Form */}
        <div className="bg-white rounded-[48px] border border-slate-100 p-8 md:p-12 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.03)] space-y-12">
          <form onSubmit={handleSave} className="space-y-12">
            {/* Avatar Selection */}
            <div className="space-y-8">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                Choose Avatar
              </label>
              <div className="flex flex-wrap gap-5">
                {avatars.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedAvatar(id)}
                    className={`relative w-20 h-20 rounded-[28px] overflow-hidden transition-all border-4 ${selectedAvatar === id ? "border-indigo-600 scale-110 shadow-xl shadow-indigo-100" : "border-slate-50 hover:border-indigo-200 hover:scale-105"}`}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`}
                      alt="Avatar"
                      className="w-full h-full object-cover bg-slate-50"
                    />
                    {selectedAvatar === id && (
                      <div className="absolute inset-0 bg-indigo-600/10 flex items-center justify-center">
                        <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg">
                          <Check size={16} />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 rounded-2xl"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-6 py-5 bg-slate-100 border-2 border-transparent rounded-2xl font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                Bio / Motivation
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="目標や意気込みを記入しましょう..."
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700 rounded-2xl min-h-[140px] resize-none"
              />
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={saveSuccess}
                className={`w-full py-6 rounded-[28px] font-black text-xl transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3 ${
                  saveSuccess
                    ? "bg-emerald-500 text-white shadow-emerald-100"
                    : "bg-indigo-600 text-white shadow-indigo-100 hover:bg-indigo-700"
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check size={24} /> 設定を更新しました
                  </>
                ) : (
                  "変更を保存する"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Menu */}
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] border border-slate-100 p-6 shadow-sm space-y-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-4 mb-4">
              Quick Settings
            </h3>
            {menuItems.map((item, i) => (
              <button
                key={i}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all">
                    {item.icon}
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-700">{item.label}</div>
                    <div className="text-[10px] font-bold text-slate-400">{item.sub}</div>
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all"
                />
              </button>
            ))}
          </div>

          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl shadow-slate-200">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-900/40">
                <Shield size={24} />
              </div>
              <h4 className="text-xl font-black mb-3 leading-tight">Rikai Premium</h4>
              <p className="text-slate-400 text-xs font-bold leading-relaxed mb-8">
                すべてのAI講義とパーソナルメンターが無制限で利用可能です。
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Active Membership
                </span>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-5">
              <Shield size={240} className="rotate-12" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
