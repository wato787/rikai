import { useMemo } from "react";
import {
  Background,
  ConnectionLineType,
  Controls,
  Handle,
  MarkerType,
  type Edge,
  type Node,
  type NodeProps,
  Position,
  ReactFlow,
} from "reactflow";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";

function RoadmapNodeComponent({ data }: NodeProps) {
  const { label, description, status, onToggleStatus } = data as {
    label: string;
    description: string;
    status: RoadmapNode["status"];
    onToggleStatus: () => void;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return (
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
          </div>
        );
      case "in_progress":
        return (
          <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        );
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-zinc-200 bg-white group-hover:border-zinc-400 transition-colors" />
        );
    }
  };

  return (
    <div className="group relative">
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div className="w-72 bg-white border border-zinc-100 rounded-xl p-4 shadow-sm hover:shadow-xl hover:shadow-zinc-900/5 transition-all duration-300 group-hover:border-zinc-200">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
            className="mt-0.5 shrink-0 transition-transform active:scale-90"
            aria-label="ステータスを切り替え"
          >
            {getStatusIcon()}
          </button>

          <div className="flex-1 min-w-0">
            <h3
              className={`text-sm font-bold leading-tight mb-1 transition-colors ${status === "completed" ? "text-zinc-400 line-through" : "text-zinc-900"}`}
            >
              {label}
            </h3>
            {description ? (
              <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2 font-medium">
                {description}
              </p>
            ) : null}
          </div>

          <span className="shrink-0 p-1 text-zinc-300 opacity-0 group-hover:opacity-100 font-bold text-[10px]">
            編集
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div
            className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
              status === "completed"
                ? "bg-emerald-50 text-emerald-600"
                : status === "in_progress"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-zinc-50 text-zinc-400"
            }`}
          >
            {status === "completed" ? "Done" : status === "in_progress" ? "In Progress" : "Todo"}
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!opacity-0" />
    </div>
  );
}

export type RoadmapDetailProps = {
  roadmap: Roadmap;
  onUpdateNodeStatus: (nodeId: string, status: RoadmapNode["status"]) => void;
};

export function RoadmapDetailView({ roadmap, onUpdateNodeStatus }: RoadmapDetailProps) {
  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNodeComponent }), []);

  const calculateProgress = () => {
    if (roadmap.nodes.length === 0) return 0;
    const completed = roadmap.nodes.filter((n) => n.status === "completed").length;
    return Math.round((completed / roadmap.nodes.length) * 100);
  };

  const flowNodes: Node[] = useMemo(() => {
    return roadmap.nodes.map((node, index) => ({
      id: node.id,
      type: "roadmapNode",
      position: node.position ?? { x: 0, y: index * 180 },
      data: {
        ...node,
        onToggleStatus: () => {
          const nextStatus: RoadmapNode["status"] =
            node.status === "not_started"
              ? "in_progress"
              : node.status === "in_progress"
                ? "completed"
                : "not_started";
          onUpdateNodeStatus(node.id, nextStatus);
        },
      },
      draggable: true,
    }));
  }, [roadmap.nodes, onUpdateNodeStatus]);

  const flowEdges: Edge[] = useMemo(() => {
    if (roadmap.edges.length > 0) {
      return roadmap.edges.map((edge) => ({
        ...edge,
        type: ConnectionLineType.SmoothStep,
        animated: roadmap.nodes.find((n) => n.id === edge.source)?.status === "in_progress",
        style: {
          stroke:
            roadmap.nodes.find((n) => n.id === edge.source)?.status === "completed"
              ? "#10b981"
              : "#e4e4e7",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color:
            roadmap.nodes.find((n) => n.id === edge.source)?.status === "completed"
              ? "#10b981"
              : "#e4e4e7",
          width: 15,
          height: 15,
        },
      }));
    }

    const edges: Edge[] = [];
    for (let i = 0; i < roadmap.nodes.length - 1; i++) {
      const from = roadmap.nodes[i];
      const to = roadmap.nodes[i + 1];
      if (!from || !to) continue;
      edges.push({
        id: `e${i}-${i + 1}`,
        source: from.id,
        target: to.id,
        type: ConnectionLineType.SmoothStep,
        animated: from.status === "in_progress",
        style: {
          stroke: from.status === "completed" ? "#10b981" : "#e4e4e7",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: from.status === "completed" ? "#10b981" : "#e4e4e7",
          width: 15,
          height: 15,
        },
      });
    }
    return edges;
  }, [roadmap.nodes, roadmap.edges]);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6 px-4 gap-4">
        <Link
          to="/"
          className="text-sm font-bold text-zinc-500 hover:text-emerald-700 transition-colors shrink-0"
        >
          ← 一覧へ
        </Link>
        <div className="flex flex-col gap-4 flex-1 min-w-0">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{roadmap.title}</h1>
            <div className="flex items-center gap-2 px-2 py-1 bg-zinc-100 rounded-md">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">
                {calculateProgress()}% Complete
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-zinc-100 rounded-[2rem] overflow-hidden shadow-inner relative group min-h-[400px]">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#fafafa]"
        >
          <Background color="#e4e4e7" gap={24} size={1} />
          <Controls
            className="!bg-white !border-zinc-100 !shadow-xl !rounded-xl overflow-hidden"
            showInteractive={false}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
