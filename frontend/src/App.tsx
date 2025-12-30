import { useState } from "react";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./components/Dashboard";
import { CurriculumCreator } from "./components/CurriculumCreator";
import { CurriculumDetail } from "./components/CurriculumDetail";
import { Library } from "./components/Library";
import type { Curriculum, TaskStatus, DetailedContent } from "./types";
import "./index.css";

function App() {
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);

  const handleCreated = (curriculum: Curriculum) => {
    setCurriculums((prev) => [curriculum, ...prev]);
  };

  const handleUpdateTask = (
    curriculumId: string,
    taskId: string,
    status: TaskStatus
  ) => {
    setCurriculums((prev) =>
      prev.map((c) => {
        if (c.id !== curriculumId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId ? { ...t, status } : t
            ),
          })),
        };
      })
    );
  };

  const handleSetTaskContent = (
    curriculumId: string,
    taskId: string,
    content: DetailedContent
  ) => {
    setCurriculums((prev) =>
      prev.map((c) => {
        if (c.id !== curriculumId) return c;
        return {
          ...c,
          modules: c.modules.map((m) => ({
            ...m,
            tasks: m.tasks.map((t) =>
              t.id === taskId ? { ...t, content } : t
            ),
          })),
        };
      })
    );
  };

  const CurriculumDetailWrapper = () => {
    const { id } = useParams<{ id: string }>();
    const curriculum = curriculums.find((c) => c.id === id);

    if (!curriculum) {
      return (
        <div className="flex items-center justify-center h-screen">
          <p className="text-slate-500">カリキュラムが見つかりません</p>
        </div>
      );
    }

    return (
      <CurriculumDetail
        curriculum={curriculum}
        onUpdateTask={handleUpdateTask}
        onSetTaskContent={handleSetTaskContent}
      />
    );
  };

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard curriculums={curriculums} />} />
          <Route
            path="/create"
            element={<CurriculumCreator onCreated={handleCreated} />}
          />
          <Route path="/list" element={<Library curriculums={curriculums} />} />
          <Route
            path="/curriculum/:id"
            element={<CurriculumDetailWrapper />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
