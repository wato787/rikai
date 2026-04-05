import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";

import { INITIAL_MOCK_ROADMAPS } from "./mock-data";

export type RoadmapMockContextValue = {
  roadmaps: Roadmap[];
  isCreateModalOpen: boolean;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  addRoadmap: (r: Roadmap) => void;
  deleteRoadmap: (id: string) => void;
  updateNodeStatus: (roadmapId: string, nodeId: string, status: RoadmapNode["status"]) => void;
};

const RoadmapMockContext = createContext<RoadmapMockContextValue | null>(null);

export function useRoadmapMock(): RoadmapMockContextValue {
  const ctx = useContext(RoadmapMockContext);
  if (!ctx) {
    throw new Error("useRoadmapMock must be used within RoadmapMockProvider");
  }
  return ctx;
}

export function RoadmapMockProvider({ children }: { children: ReactNode }) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>(INITIAL_MOCK_ROADMAPS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const openCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setIsCreateModalOpen(false);
  }, []);

  const addRoadmap = useCallback((r: Roadmap) => {
    setRoadmaps((prev) => [r, ...prev]);
  }, []);

  const deleteRoadmap = useCallback((id: string) => {
    if (confirm("このロードマップを削除しますか？")) {
      setRoadmaps((prev) => prev.filter((x) => x.id !== id));
    }
  }, []);

  const updateNodeStatus = useCallback(
    (roadmapId: string, nodeId: string, status: RoadmapNode["status"]) => {
      setRoadmaps((prev) =>
        prev.map((r) => {
          if (r.id !== roadmapId) return r;
          return {
            ...r,
            nodes: r.nodes.map((n) => (n.id === nodeId ? { ...n, status } : n)),
            updatedAt: new Date().toISOString(),
          };
        }),
      );
    },
    [],
  );

  const value = useMemo<RoadmapMockContextValue>(
    () => ({
      roadmaps,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
      addRoadmap,
      deleteRoadmap,
      updateNodeStatus,
    }),
    [
      roadmaps,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
      addRoadmap,
      deleteRoadmap,
      updateNodeStatus,
    ],
  );

  return <RoadmapMockContext.Provider value={value}>{children}</RoadmapMockContext.Provider>;
}
