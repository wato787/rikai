import { createFileRoute } from "@tanstack/react-router";

import { useToggle } from "@/hooks/useToggle";
import { CreateRoadmapModal, RoadmapList } from "@/views/Roadmap";
import { roadmapsListQueryOptions } from "../views/Roadmap/List/queries";

const IndexPending = () => (
  <div className="py-16 text-center text-zinc-500 font-medium">読み込み中…</div>
);

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(roadmapsListQueryOptions),
  pendingComponent: IndexPending,
  component: IndexPage,
});

function IndexPage() {
  const toggle = useToggle(false);

  return (
    <>
      <RoadmapList onOpenCreate={toggle.handleOpen} />
      <CreateRoadmapModal toggle={toggle} />
    </>
  );
}
