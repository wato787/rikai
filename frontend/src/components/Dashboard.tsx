import React from "react";
import type { Curriculum } from "../types";
import { TaskStatus } from "../types";
import { Clock, ArrowRight, Star, Plus, BrainCircuit, Flame, Trophy, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardProps {
  curriculums: Curriculum[];
}

export const Dashboard: React.FC<DashboardProps> = ({ curriculums }) => {
  const latest = curriculums[0];

  const getStats = () => {
    const allTasks = curriculums.flatMap((c) => c.modules.flatMap((m) => m.tasks));
    const completed = allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
    const totalHours = curriculums.reduce((acc, curr) => acc + curr.totalEstimatedHours, 0);
    return { completed, total: allTasks.length, totalHours };
  };

  const getProgress = (c: Curriculum) => {
    const all = c.modules.flatMap((m) => m.tasks);
    if (all.length === 0) return 0;
    const done = all.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((done / all.length) * 100);
  };

  const stats = getStats();

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">おかえりなさい</h1>
          <p className="text-slate-500 mt-1 font-medium flex items-center gap-2">
            <Calendar size={16} className="text-indigo-500" />
            今日は新しい知識を1つ吸収しましょう。
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-[24px] font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          <Plus size={22} />
          <span>新しい学びを開始</span>
        </Link>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
            <Flame size={28} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Completed Tasks
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.completed}{" "}
              <span className="text-sm font-bold text-slate-400">/ {stats.total}</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
            <Clock size={28} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Learning Hours
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.totalHours} <span className="text-sm font-bold text-slate-400">h</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500">
            <Trophy size={28} />
          </div>
          <div>
            <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Active Paths
            </div>
            <div className="text-2xl font-black text-slate-900">
              {curriculums.length} <span className="text-sm font-bold text-slate-400">Paths</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured / Active Card */}
      {latest ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Star size={20} className="text-amber-400 fill-amber-400" />
              現在のフォーカス
            </h2>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[40px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
            <div className="relative bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                <BrainCircuit size={200} />
              </div>

              <div className="grid lg:grid-cols-[1fr,320px] gap-12 items-center">
                <div className="space-y-6">
                  <div>
                    <span className="inline-block px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                      {latest.level}
                    </span>
                    <h3 className="text-4xl font-black text-slate-900 leading-tight">
                      {latest.title}
                    </h3>
                    <p className="text-slate-500 mt-4 text-lg leading-relaxed max-w-xl">
                      {latest.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                      <span className="text-sm font-bold text-slate-700">進行中</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                      作成日: {new Date(latest.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 flex flex-col items-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center mb-6">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-slate-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="58"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={364}
                        strokeDashoffset={364 - (364 * getProgress(latest)) / 100}
                        className="text-indigo-600 transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-slate-900">
                        {getProgress(latest)}%
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        Done
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/curriculum/${latest.id}`}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 group/btn"
                  >
                    学習を再開する
                    <ArrowRight
                      size={18}
                      className="group-hover/btn:translate-x-1 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-200 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <BrainCircuit size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-400">まだ学習プランがありません</h2>
          <p className="text-slate-400 mt-2 mb-10 max-w-xs mx-auto">
            AIにあなたの目標を伝えて、自分だけの学習ロードマップを作成しましょう。
          </p>
          <Link
            to="/create"
            className="bg-indigo-600 text-white px-10 py-5 rounded-[24px] font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            最初のプランを作成
          </Link>
        </div>
      )}
    </div>
  );
};
