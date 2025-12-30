
import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || 'Rikai ユーザー',
      email: email || 'user@rikai.ai',
      avatarId: '1',
      bio: 'Rikaiで学びを深めています。'
    };
    onLogin(mockUser);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-50 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">

        {/* Left Side: Brand & Visual */}
        <div className="hidden lg:flex flex-col justify-between p-16 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#4f46e5_0%,transparent_70%)]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 flex items-center justify-center bg-transparent">
                <img src="/assets/logo.png" alt="Rikai" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tighter">Rikai</span>
            </div>

            <div className="space-y-6 max-w-sm">
              <h2 className="text-5xl font-black leading-tight tracking-tight">
                「わかる」を、<br />
                もっと加速させる。
              </h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed">
                AIがあなたの学習スタイルを理解し、最短ルートで目標達成へと導きます。
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
              <CheckCircle2 size={18} className="text-indigo-400" />
              <span>AIによるパーソナライズ・カリキュラム</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
              <CheckCircle2 size={18} className="text-indigo-400" />
              <span>24時間体制のインテリジェント・メンター</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
              <CheckCircle2 size={18} className="text-indigo-400" />
              <span>直感的な進捗トラッキング機能</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10 lg:hidden text-center">
             <div className="inline-flex w-16 h-16 items-center justify-center mb-4 bg-transparent">
                <img src="/assets/logo.png" alt="Rikai" className="w-full h-full object-contain" />
             </div>
             <h1 className="text-3xl font-black text-slate-900">Rikai</h1>
          </div>

          <div className="mb-8">
            <h3 className="text-3xl font-black text-slate-900 mb-2">{isLogin ? 'おかえりなさい' : 'アカウント作成'}</h3>
            <p className="text-slate-400 font-bold">Rikai の世界へようこそ。</p>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              ログイン
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${!isLogin ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              新規登録
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Display Name</label>
                <div className="relative group">
                  <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="名前を入力"
                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-2xl transition-all font-bold text-slate-700"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
              <div className="relative group">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-2xl transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50/50 rounded-2xl transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-3 group mt-4"
            >
              {isLogin ? 'Rikai を開始' : 'アカウント作成'}
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
