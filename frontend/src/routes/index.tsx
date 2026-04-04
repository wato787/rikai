import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoadmapsList } from "@/features/roadmap/roadmaps-list";
import { useRoadmapMock } from "@/features/roadmap/roadmap-mock-context";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const { roadmaps, openCreateModal, deleteRoadmap } = useRoadmapMock();

  return (
    <RoadmapsList
      roadmaps={roadmaps}
      onSelect={(r) => {
        void navigate({ to: "/roadmap/$roadmapId", params: { roadmapId: r.id } });
      }}
      onDelete={deleteRoadmap}
      onCreateClick={openCreateModal}
    />
  );
}
