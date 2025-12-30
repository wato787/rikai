import React, { useState } from "react";
import type { Curriculum } from "../types";
import { TaskStatus } from "../types";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

interface LibraryProps {
  curriculums: Curriculum[];
}

export const Library: React.FC<LibraryProps> = ({ curriculums }) => {
  const [search, setSearch] = useState("");

  const filtered = curriculums.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.goal.toLowerCase().includes(search.toLowerCase()),
  );

  const getProgress = (c: Curriculum) => {
    const all = c.modules.flatMap((m) => m.tasks);
    const done = all.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((done / all.length) * 100);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">マイ・ライブラリ</h1>
        <p className="text-slate-500 mt-1 font-medium">
          これまでに作成したすべての学習パスを管理します。
        </p>
      </header>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="カリキュラムを検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[20px] focus:ring-4 focus:ring-indigo-50 focus:border-indigo-200 transition-all font-medium text-slate-700"
          />
        </div>
        <button className="px-6 py-4 bg-white border border-slate-100 rounded-[20px] text-slate-500 font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
          <Filter size={20} />
          <span>フィルター</span>
        </button>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((curr) => (
            <Link
              key={curr.id}
              to={`/curriculum/${curr.id}`}
              className="group bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <BookOpen size={24} />
                </div>
                <button className="text-slate-300 hover:text-slate-600 p-1">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="flex-1">
                <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                  {curr.level}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {curr.title}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mb-6">
                  {curr.goal}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-50 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} /> {curr.totalEstimatedHours}h
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> {getProgress(curr)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-700 ease-out"
                    style={{ width: `${getProgress(curr)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-end text-indigo-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  詳細を見る <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200">
          <p className="text-slate-400 font-bold">該当するカリキュラムが見つかりませんでした。</p>
        </div>
      )}
    </div>
  );
};
