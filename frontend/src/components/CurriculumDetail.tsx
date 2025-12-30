import React, { useState, useRef, useEffect } from "react";
import type { Curriculum, Task, ChatMessage, DetailedContent } from "../types";
import { TaskStatus } from "../types";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronLeft,
  Send,
  Bot,
  Sparkles,
  Clock,
  BookOpen,
  HelpCircle,
  CheckCircle,
  ChevronRight,
  MessageSquare,
  Layout,
  X,
} from "lucide-react";
import { getLearningSupport, generateTaskContent } from "../services/geminiService";
import { Link } from "react-router-dom";

interface DetailProps {
  curriculum: Curriculum;
  onUpdateTask: (curriculumId: string, taskId: string, status: TaskStatus) => void;
  onSetTaskContent: (curriculumId: string, taskId: string, content: DetailedContent) => void;
}

export const CurriculumDetail: React.FC<DetailProps> = ({
  curriculum,
  onUpdateTask,
  onSetTaskContent,
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(
    curriculum.modules[0]?.tasks[0] || null,
  );
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [showMentor, setShowMentor] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (selectedTask && !selectedTask.content) {
      loadTaskDetails(selectedTask);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTask?.id]);

  const loadTaskDetails = async (task: Task) => {
    setIsLoadingContent(true);
    try {
      const content = await generateTaskContent(curriculum.title, task.title);
      onSetTaskContent(curriculum.id, task.id, content);
    } catch (error) {
      console.error("Failed to load task details:", error);
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedTask) return;

    const userMsg: ChatMessage = { role: "user", text: inputMessage, timestamp: Date.now() };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const response = await getLearningSupport(
        curriculum,
        selectedTask.title,
        inputMessage,
        chatMessages,
      );
      const aiMsg: ChatMessage = { role: "model", text: response || "", timestamp: Date.now() };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const getStatusIcon = (status: TaskStatus, isSelected: boolean) => {
    if (isSelected) return <div className="w-2 h-2 bg-white rounded-full"></div>;
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle2 className="text-emerald-500" size={16} />;
      case TaskStatus.IN_PROGRESS:
        return <PlayCircle className="text-indigo-500" size={16} />;
      default:
        return <Circle className="text-slate-300" size={16} />;
    }
  };

  const formatText = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split("**").map((part, j) =>
          j % 2 === 1 ? (
            <strong key={j} className="text-slate-900 font-bold">
              {part}
            </strong>
          ) : (
            part
          ),
        )}
        <br />
      </span>
    ));
  };

  const calculateOverallProgress = () => {
    const all = curriculum.modules.flatMap((m) => m.tasks);
    const done = all.filter((t) => t.status === TaskStatus.COMPLETED).length;
    return Math.round((done / all.length) * 100);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col animate-in fade-in duration-500">
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-20">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 transition-all"
          >
            <ChevronLeft size={24} />
          </Link>
          <div className="h-6 w-px bg-slate-100 mx-2"></div>
          <div>
            <h1 className="text-sm font-black text-slate-900 truncate max-w-[200px] md:max-w-md">
              {curriculum.title}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full transition-all duration-1000"
                  style={{ width: `${calculateOverallProgress()}%` }}
                ></div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                {calculateOverallProgress()}% Complete
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMentor(!showMentor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${showMentor ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
          >
            <Bot size={16} />
            <span className="hidden md:inline">AIメンター</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Slim Sidebar */}
        <aside
          className={`${isSidebarOpen ? "w-80" : "w-0"} bg-slate-50 border-r border-slate-100 flex flex-col transition-all duration-300 overflow-hidden relative z-10`}
        >
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6">
            {curriculum.modules.map((module, mIdx) => (
              <div key={module.id} className="space-y-1">
                <div className="px-3 py-2 flex items-center justify-between">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Section {mIdx + 1}
                  </h2>
                </div>
                <div className="space-y-1">
                  {module.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => {
                        setSelectedTask(task);
                        setQuizAnswer(null);
                        if (selectedTask?.id !== task.id) setChatMessages([]);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group
                        ${
                          selectedTask?.id === task.id
                            ? "bg-white border-slate-200 shadow-sm text-indigo-600"
                            : "text-slate-500 hover:bg-white/50"
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selectedTask?.id === task.id ? "bg-indigo-600 text-white" : "bg-white border border-slate-100 group-hover:border-indigo-100"}`}
                      >
                        {getStatusIcon(task.status, selectedTask?.id === task.id)}
                      </div>
                      <span className="text-xs font-bold truncate flex-1">{task.title}</span>
                      {task.status === TaskStatus.COMPLETED && selectedTask?.id !== task.id && (
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-white border border-slate-100 border-l-0 rounded-r-lg shadow-sm flex items-center justify-center text-slate-300 hover:text-indigo-500 transition-colors"
          style={{ transform: `translateX(${isSidebarOpen ? "320px" : "0px"}) translateY(-50%)` }}
        >
          {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar bg-white relative">
          <div className="max-w-3xl mx-auto px-8 py-16">
            {selectedTask ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {isLoadingContent ? (
                  <div className="flex flex-col items-center justify-center py-32 text-center space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 border-4 border-slate-50 border-t-indigo-500 rounded-full animate-spin"></div>
                      <Sparkles
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-200"
                        size={24}
                      />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl font-black text-slate-900">AIが講義資料を編集中...</h3>
                      <p className="text-slate-400 text-sm font-medium">
                        トピックに最適化された解説とクイズを準備しています。
                      </p>
                    </div>
                  </div>
                ) : selectedTask.content ? (
                  <article className="space-y-16">
                    {/* Header */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-500">
                        <BookOpen size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Lesson Content
                        </span>
                      </div>
                      <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                        {selectedTask.title}
                      </h2>
                      <p className="text-slate-400 font-medium flex items-center gap-2">
                        <Clock size={16} />
                        推定学習時間: {selectedTask.estimatedHours}時間
                      </p>
                    </div>

                    {/* Body */}
                    <div className="prose prose-slate prose-lg max-w-none">
                      <div className="text-slate-700 leading-relaxed text-lg space-y-6 font-medium">
                        {formatText(selectedTask.content.explanation)}
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        Key Takeaways
                      </h4>
                      <div className="grid gap-4">
                        {selectedTask.content.keyPoints.map((point, idx) => (
                          <div
                            key={idx}
                            className="flex gap-4 items-start bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
                          >
                            <span className="flex-shrink-0 w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xs font-black">
                              {idx + 1}
                            </span>
                            <p className="text-slate-700 font-bold pt-1.5">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quiz Section */}
                    <section className="bg-slate-900 text-white rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 transition-transform group-hover:scale-110">
                        <HelpCircle size={160} />
                      </div>
                      <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                            <HelpCircle size={24} />
                          </div>
                          <h3 className="text-xl font-black tracking-tight">理解度チェック</h3>
                        </div>

                        <div className="space-y-8">
                          <p className="text-2xl font-bold leading-snug">
                            {selectedTask.content.quiz.question}
                          </p>
                          <div className="grid gap-3">
                            {selectedTask.content.quiz.options.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => setQuizAnswer(idx)}
                                className={`w-full p-6 rounded-[24px] text-left font-bold transition-all border-2 flex items-center gap-5
                                  ${
                                    quizAnswer === null
                                      ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                                      : idx === selectedTask.content?.quiz.correctAnswer
                                        ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                                        : quizAnswer === idx
                                          ? "bg-rose-500 border-rose-500 text-white"
                                          : "bg-white/5 border-transparent opacity-30 cursor-default"
                                  }`}
                              >
                                <span
                                  className={`w-10 h-10 rounded-xl border-2 border-current flex items-center justify-center text-sm transition-colors ${quizAnswer === idx ? "bg-white text-slate-900" : ""}`}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="text-lg">{option}</span>
                              </button>
                            ))}
                          </div>

                          {quizAnswer !== null && (
                            <div className="mt-10 animate-in zoom-in-95 duration-500 bg-white/10 p-8 rounded-[32px] border border-white/10 backdrop-blur-md">
                              <div className="flex items-center gap-4 mb-4">
                                <div
                                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${quizAnswer === selectedTask.content.quiz.correctAnswer ? "bg-emerald-500" : "bg-rose-500"}`}
                                >
                                  {quizAnswer === selectedTask.content.quiz.correctAnswer ? (
                                    <CheckCircle size={28} className="text-white" />
                                  ) : (
                                    <X size={28} className="text-white" />
                                  )}
                                </div>
                                <span
                                  className={`text-2xl font-black ${quizAnswer === selectedTask.content.quiz.correctAnswer ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  {quizAnswer === selectedTask.content.quiz.correctAnswer
                                    ? "正解です！"
                                    : "惜しい..."}
                                </span>
                              </div>
                              <p className="text-slate-300 leading-relaxed font-medium text-lg mb-8">
                                {selectedTask.content.quiz.explanation}
                              </p>

                              {quizAnswer === selectedTask.content.quiz.correctAnswer && (
                                <button
                                  onClick={() =>
                                    onUpdateTask(
                                      curriculum.id,
                                      selectedTask.id,
                                      TaskStatus.COMPLETED,
                                    )
                                  }
                                  className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-900/40 active:scale-95"
                                >
                                  学習を完了して次へ進む
                                  <ChevronRight size={20} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </section>
                  </article>
                ) : (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mb-6">
                      <X size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">
                      読み込みに失敗しました
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 mb-8">
                      ネットワーク環境を確認して再試行してください。
                    </p>
                    <button
                      onClick={() => loadTaskDetails(selectedTask)}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition-all"
                    >
                      再試行する
                    </button>
                  </div>
                )}
                <div className="h-32" /> {/* Bottom spacing */}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-center h-full">
                <div className="w-32 h-32 bg-slate-50 rounded-[48px] flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 mb-8">
                  <Layout size={64} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  学習を開始しましょう
                </h3>
                <p className="text-slate-400 text-md mt-4 max-w-xs leading-relaxed font-medium">
                  左のサイドバーからトピックを選択して、AIが生成した教材にアクセスしてください。
                </p>
              </div>
            )}
          </div>
        </main>

        {/* AI Mentor Drawer */}
        <div
          className={`fixed inset-y-0 right-0 w-[420px] bg-white border-l border-slate-100 shadow-2xl z-30 flex flex-col transition-transform duration-500 ${showMentor ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Bot size={24} />
              </div>
              <div>
                <h4 className="font-black text-sm">AIメンター</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Active Now
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMentor(false)}
              className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-slate-50/30">
            {chatMessages.length === 0 && (
              <div className="text-center py-16 opacity-40">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100 text-indigo-600">
                  <MessageSquare size={32} />
                </div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Mental Support & Q&A
                </p>
                <p className="text-xs font-bold text-slate-400 leading-relaxed px-10">
                  現在のトピックについて深掘りしたいことや、理解できないことがあればいつでも質問してください。
                </p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
              >
                <div
                  className={`max-w-[85%] px-6 py-4 rounded-[28px] text-sm shadow-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white text-slate-700 border border-slate-200 rounded-tl-none font-medium"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-[28px] rounded-tl-none shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSendMessage}
            className="p-6 bg-white border-t border-slate-100 flex gap-4"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="質問を入力..."
              className="flex-1 px-6 py-4 rounded-3xl bg-slate-50 border-transparent focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-sm font-bold placeholder:text-slate-300"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              className="p-4 bg-indigo-600 text-white rounded-[20px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90 flex-shrink-0 disabled:opacity-50"
            >
              <Send size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
