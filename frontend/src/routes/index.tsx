import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { RoadmapList, useRoadmapMock } from "@/views/Roadmap";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

function IndexPage() {
  const navigate = useNavigate();
  const { roadmaps, openCreateModal, deleteRoadmap } = useRoadmapMock();

  return (
    <RoadmapList
      roadmaps={roadmaps}
      onSelect={(r) => {
        void navigate({ to: "/roadmap/$roadmapId", params: { roadmapId: r.id } });
      }}
      onDelete={deleteRoadmap}
      onCreateClick={openCreateModal}
    />
  );
}
