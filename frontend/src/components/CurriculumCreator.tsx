
import React, { useState } from 'react';
import { generateCurriculum } from '@/services/geminiService';
import type { Curriculum } from '../types';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreatorProps {
  onCreated: (curriculum: Curriculum) => void;
}

export const CurriculumCreator: React.FC<CreatorProps> = ({ onCreated }) => {
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('全くの初心者');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal) return;

    setLoading(true);
    try {
      const curriculum = await generateCurriculum(goal, experience);
      onCreated(curriculum);
      navigate(`/curriculum/${curriculum.id}`);
    } catch (error) {
      console.error(error);
      alert('カリキュラムの生成に失敗しました。目標をもっと具体的に入力してみてください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12">
      <div className="text-center mb-10">
        <div className="inline-flex p-3 bg-indigo-100 text-indigo-600 rounded-2xl mb-4">
          <Sparkles size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">何を学びたいですか？</h1>
        <p className="text-slate-500 mt-2">抽象的な目標から具体的なスキルまで、AIがステップバイステップの道筋を描きます。</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 space-y-6">
        <div>
          <label htmlFor="goal" className="block text-sm font-semibold text-slate-700 mb-2">達成したい目標や興味のあること</label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="例:
・趣味で油絵を始めたい
・3ヶ月で日常会話ができる程度のフランス語を身につけたい
・UXデザインの基礎を体系的に理解したい
・美味しいコーヒーの淹れ方を極めたい"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[160px] transition-all resize-none"
            required
          />
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-semibold text-slate-700 mb-2">現在の知識・スキルレベル</label>
          <select
            id="experience"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all appearance-none bg-white"
          >
            <option>全くの初心者（ゼロから学びたい）</option>
            <option>基礎は知っている（学び直したい）</option>
            <option>中級者（さらに専門性を高めたい）</option>
            <option>上級者（特定の難所を克服したい）</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !goal}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              AIが最適なパスを計算中...
            </>
          ) : (
            <>
              <Wand2 size={24} />
              学習プランを作成
            </>
          )}
        </button>
      </form>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-1">多ジャンル対応</h4>
          <p className="text-slate-500 text-xs leading-relaxed">語学、芸術、実務スキル、学問など、どんな分野の目標でも構造化します。</p>
        </div>
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h4 className="font-bold text-slate-800 text-sm mb-1">チャットサポート</h4>
          <p className="text-slate-500 text-xs leading-relaxed">作成後のカリキュラム各ステップで、AIが専門的な疑問に答えます。</p>
        </div>
      </div>
    </div>
  );
};
