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
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { motion } from "motion/react";
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

          <button
            type="button"
            className="shrink-0 p-1 text-zinc-300 hover:text-zinc-900 transition-colors opacity-0 group-hover:opacity-100 font-bold text-[10px]"
          >
            編集
          </button>
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
  onDeleteRoadmap?: () => void;
  isDeletePending?: boolean;
};

export function RoadmapDetail({
  roadmap,
  onUpdateNodeStatus,
  onDeleteRoadmap,
  isDeletePending = false,
}: RoadmapDetailProps) {
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
      const nodeById = new Map(roadmap.nodes.map((n) => [n.id, n]));
      return roadmap.edges.map((edge) => {
        const sourceStatus = nodeById.get(edge.source)?.status;
        return {
          ...edge,
          type: ConnectionLineType.SmoothStep,
          animated: sourceStatus === "in_progress",
          style: {
            stroke: sourceStatus === "completed" ? "#10b981" : "#e4e4e7",
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: sourceStatus === "completed" ? "#10b981" : "#e4e4e7",
            width: 15,
            height: 15,
          },
        };
      });
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

  const progress = calculateProgress();

  return (
    <div className="h-full flex flex-col">
      <div className="mb-10 px-4">
        <Link
          to="/"
          className="text-zinc-400 hover:text-zinc-900 transition-colors mb-6 group flex items-center gap-2"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-widest">
            ロードマップ一覧に戻る
          </span>
        </Link>

        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-zinc-900 tracking-tight leading-none">
              {roadmap.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-zinc-400 text-sm font-medium">
                {roadmap.nodes.length} ステップの学習プラン
              </p>
              {onDeleteRoadmap ? (
                <button
                  type="button"
                  onClick={onDeleteRoadmap}
                  disabled={isDeletePending}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-40 transition-colors"
                >
                  <Trash2 size={16} strokeWidth={2} aria-hidden />
                  削除
                </button>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                進捗率
              </p>
              <p className="text-xl font-bold text-zinc-900 leading-none">{progress}%</p>
            </div>
            <div className="w-48 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[600px] bg-white border border-zinc-100 rounded-[2.5rem] overflow-hidden shadow-inner relative group">
        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          minZoom={0.5}
          maxZoom={1.5}
          className="bg-[#fafafa]"
          proOptions={{ hideAttribution: true }}
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
