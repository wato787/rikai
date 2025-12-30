import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, useParams, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { Library } from "./components/Library";
import { CurriculumCreator } from "./components/CurriculumCreator";
import { CurriculumDetail } from "./components/CurriculumDetail";
import { Auth } from "./components/Auth";
import { Profile } from "./components/Profile";
import type { Curriculum, DetailedContent, User } from "./types";
import { TaskStatus } from "./types";
import "./index.css";

const DEFAULT_GUEST_USER: User = {
  id: "guest",
  name: "ゲストユーザー",
  email: "guest@rikai.ai",
  avatarId: "1",
  bio: "まずは触ってみて、Rikaiの可能性を体感してください。",
};

const MOCK_CURRICULUM: Curriculum = {
  id: "mock-1",
  title: "Rikaiへようこそ",
  goal: "Rikaiの使い方をマスターして効率的に学習する",
  description: "このアプリの主要な機能を一通り試すためのチュートリアルプランです。",
  level: "ビギナー",
  totalEstimatedHours: 1,
  createdAt: Date.now(),
  modules: [
    {
      id: "mod-1",
      title: "はじめてのRikai",
      tasks: [
        {
          id: "task-1-1",
          title: "カリキュラムを作成してみよう",
          description: "「作成」メニューから、あなたの興味のあることを入力してみてください。",
          estimatedHours: 0.5,
          status: TaskStatus.IN_PROGRESS,
          content: {
            explanation:
              "Rikai（リカイ）は、AIを活用してあなたのあらゆる学習をサポートするプラットフォームです。\n\n**主なステップ：**\n1. **目標の入力**: 何を学びたいかAIに伝えます。\n2. **ロードマップの生成**: AIが最適な学習ステップを構築します。\n3. **深い理解**: 各ステップごとに、AIが解説資料とクイズを即座に作成します。\n4. **メンター相談**: わからないことはいつでもAIメンターに質問できます。",
            keyPoints: [
              "目標は具体的であればあるほど良い結果になります",
              "AIメンターは文脈を理解して回答します",
              "クイズで知識の定着を確認しましょう",
            ],
            quiz: {
              question: "Rikaiがカリキュラムを生成する際、最も重要な情報は何ですか？",
              options: ["学習者の氏名", "達成したい具体的な目標", "現在の日時", "OSのバージョン"],
              correctAnswer: 1,
              explanation:
                "RikaiのAIは、あなたが入力した「目標」に基づいて、最適な学習パスを計算します。",
            },
          },
        },
      ],
    },
  ],
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCurriculums = localStorage.getItem("rikai_curriculums");
    const savedUser = localStorage.getItem("rikai_user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // 認証チェックを外すため、未ログイン時はゲストユーザーをセット
      setUser(DEFAULT_GUEST_USER);
    }

    if (savedCurriculums) {
      try {
        setCurriculums(JSON.parse(savedCurriculums));
      } catch (e) {
        setCurriculums([MOCK_CURRICULUM]);
      }
    } else {
      setCurriculums([MOCK_CURRICULUM]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("rikai_curriculums", JSON.stringify(curriculums));
      if (user) {
        localStorage.setItem("rikai_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("rikai_user");
      }
    }
  }, [curriculums, user, isLoading]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(DEFAULT_GUEST_USER);
    // リフレッシュ感を持たせるため
    window.location.hash = "/";
  };

  const handleUpdateProfile = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleCreateCurriculum = (newCurriculum: Curriculum) => {
    setCurriculums([newCurriculum, ...curriculums]);
  };

  const handleUpdateTask = (curriculumId: string, taskId: string, status: TaskStatus) => {
    setCurriculums((prev) =>
      prev.map((curr) => {
        if (curr.id !== curriculumId) return curr;
        return {
          ...curr,
          modules: curr.modules.map((mod) => ({
            ...mod,
            tasks: mod.tasks.map((task) => {
              if (task.id !== taskId) return task;
              return { ...task, status };
            }),
          })),
        };
      }),
    );
  };

  const handleSetTaskContent = (curriculumId: string, taskId: string, content: DetailedContent) => {
    setCurriculums((prev) =>
      prev.map((curr) => {
        if (curr.id !== curriculumId) return curr;
        return {
          ...curr,
          modules: curr.modules.map((mod) => ({
            ...mod,
            tasks: mod.tasks.map((task) => {
              if (task.id !== taskId) return task;
              return { ...task, content };
            }),
          })),
        };
      }),
    );
  };

  const CurriculumViewWrapper = () => {
    const { id } = useParams();
    const curriculum = curriculums.find((c) => c.id === id);
    if (!curriculum)
      return (
        <div className="p-8 text-center text-slate-500 font-bold">
          カリキュラムが見つかりませんでした。
        </div>
      );
    return (
      <CurriculumDetail
        curriculum={curriculum}
        onUpdateTask={handleUpdateTask}
        onSetTaskContent={handleSetTaskContent}
      />
    );
  };

  if (isLoading) return null;

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/auth" element={<Auth onLogin={handleLogin} />} />

          <Route path="/" element={<Dashboard curriculums={curriculums} />} />
          <Route
            path="/create"
            element={<CurriculumCreator onCreated={handleCreateCurriculum} />}
          />
          <Route path="/curriculum/:id" element={<CurriculumViewWrapper />} />
          <Route path="/list" element={<Library curriculums={curriculums} />} />
          <Route
            path="/profile"
            element={
              <Profile user={user!} onUpdate={handleUpdateProfile} onLogout={handleLogout} />
            }
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
