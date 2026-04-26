import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  ConnectionLineType,
  Controls,
  Handle,
  MarkerType,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
  Position,
  ReactFlow,
} from "reactflow";
import { ArrowLeft, CheckCircle2, Trash2 } from "lucide-react";
import { m } from "motion/react";
import { Link } from "@tanstack/react-router";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";

import { NodeDetailPanel } from "./NodeDetailPanel";
import { NodeEditModal } from "./NodeEditModal";

const RoadmapSelectedNodeContext = createContext<string | null>(null);

function RoadmapNodeComponent({ data, id }: NodeProps) {
  const selectedNodeId = useContext(RoadmapSelectedNodeContext);
  const isSelected = selectedNodeId === id;

  const { label, description, status, onToggleStatus, onOpenEdit } = data as {
    label: string;
    description: string;
    status: RoadmapNode["status"];
    onToggleStatus: () => void;
    onOpenEdit: () => void;
  };

  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return (
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <CheckCircle2 size={12} className="text-white" strokeWidth={3} />
          </div>
        );
      case "in_progress":
        return (
          <div className="h-5 w-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        );
      default:
        return (
          <div className="h-5 w-5 rounded-full border-2 border-zinc-200 bg-white transition-colors group-hover:border-zinc-400" />
        );
    }
  };

  return (
    <div className="group relative p-1.5">
      <Handle type="target" position={Position.Top} className="!opacity-0" />

      <div
        className={`nodrag nowheel w-[min(100%,26rem)] max-w-[26rem] cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-[box-shadow,border-color] duration-300 hover:shadow-xl hover:shadow-zinc-900/5 group-hover:border-zinc-200 ${
          isSelected
            ? "border-emerald-300 ring-2 ring-emerald-400/35 shadow-md shadow-emerald-900/10"
            : "border-zinc-100"
        }`}
      >
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus();
            }}
            className="mt-1 shrink-0 transition-transform active:scale-90"
            aria-label="ステータスを切り替え"
          >
            {getStatusIcon()}
          </button>

          <div className="min-w-0 flex-1">
            <h3
              className={`mb-2 text-base font-bold leading-snug transition-colors ${status === "completed" ? "text-zinc-400 line-through" : "text-zinc-900"}`}
            >
              {label}
            </h3>
            {description ? (
              <div className="max-h-52 overflow-y-auto overscroll-contain pr-1 text-sm font-medium leading-relaxed text-zinc-600 [scrollbar-gutter:stable] whitespace-pre-wrap">
                {description}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit();
            }}
            className="shrink-0 p-1 text-[10px] font-bold text-zinc-300 opacity-0 transition-colors hover:text-zinc-900 group-hover:opacity-100"
            aria-label="ステップを編集"
          >
            編集
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
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

type RoadmapDetailProps = {
  roadmap: Roadmap;
  /** TanStack Query の dataUpdatedAt。キャッシュがネットワークで更新されたときだけ進む（楽観更新では不変） */
  syncRevision: number;
  onUpdateNodeStatus: (nodeId: string, status: RoadmapNode["status"]) => void;
  onUpdateNodeContent: (nodeId: string, label: string, description: string) => Promise<void>;
  onUpdateNodePosition: (nodeId: string, x: number, y: number) => void;
  onDeleteRoadmap?: () => void;
  isDeletePending?: boolean;
};

export function RoadmapDetail({
  roadmap,
  syncRevision,
  onUpdateNodeStatus,
  onUpdateNodeContent,
  onUpdateNodePosition,
  onDeleteRoadmap,
  isDeletePending = false,
}: RoadmapDetailProps) {
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onUpdateNodeStatusRef = useRef(onUpdateNodeStatus);
  onUpdateNodeStatusRef.current = onUpdateNodeStatus;
  const setEditingNodeIdRef = useRef(setEditingNodeId);
  setEditingNodeIdRef.current = setEditingNodeId;

  const editingNode =
    editingNodeId === null ? null : (roadmap.nodes.find((n) => n.id === editingNodeId) ?? null);
  const selectedNode =
    selectedNodeId === null ? null : (roadmap.nodes.find((n) => n.id === selectedNodeId) ?? null);

  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNodeComponent }), []);

  useEffect(() => {
    if (selectedNodeId !== null && !roadmap.nodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [roadmap.nodes, selectedNodeId]);

  const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const closeNodeDetail = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const flowNodes: Node[] = useMemo(() => {
    return roadmap.nodes.map((node, index) => ({
      id: node.id,
      type: "roadmapNode",
      position: node.position ?? { x: 0, y: index * 280 },
      data: {
        ...node,
        onToggleStatus: () => {
          const nextStatus: RoadmapNode["status"] =
            node.status === "not_started"
              ? "in_progress"
              : node.status === "in_progress"
                ? "completed"
                : "not_started";
          onUpdateNodeStatusRef.current(node.id, nextStatus);
        },
        onOpenEdit: () => setEditingNodeIdRef.current(node.id),
      },
      draggable: true,
    }));
  }, [roadmap.nodes]);

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

  /** useNodesState は Provider 外だと環境によって壊れるため、素の state + apply* で制御する */
  const [nodes, setNodes] = useState<Node[]>(flowNodes);
  const [edges, setEdges] = useState<Edge[]>(flowEdges);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  /**
   * useOptimistic で nodes の参照だけが変わるレンダーが多い。flowNodes を deps に入れると
   * 毎回 setNodes して React Flow が壊れる。syncRevision（Query の dataUpdatedAt）は
   * キャッシュがネットで更新されたときだけ進む。
   */
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flowNodes/flowEdges を入れると毎レンダーで React Flow が壊れる
  }, [roadmap.id, syncRevision]);

  const progress =
    roadmap.nodes.length === 0
      ? 0
      : Math.round(
          (roadmap.nodes.filter((n) => n.status === "completed").length / roadmap.nodes.length) *
            100,
        );

  return (
    <RoadmapSelectedNodeContext.Provider value={selectedNodeId}>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-6 shrink-0 px-1">
          <Link
            to="/"
            className="mb-6 group flex items-center gap-2 text-zinc-400 transition-colors hover:text-zinc-900"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold tracking-widest uppercase">
              ロードマップ一覧に戻る
            </span>
          </Link>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-zinc-900 leading-none">
                {roadmap.title}
              </h1>
              {roadmap.topic ? (
                <p className="max-w-4xl text-sm leading-relaxed text-zinc-500">
                  トピック: <span className="font-medium text-zinc-700">{roadmap.topic}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <p className="text-sm font-medium text-zinc-400">
                  {roadmap.nodes.length} ステップの学習プラン
                </p>
                {onDeleteRoadmap ? (
                  <button
                    type="button"
                    onClick={onDeleteRoadmap}
                    disabled={isDeletePending}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 transition-colors hover:text-red-700 disabled:opacity-40"
                  >
                    <Trash2 size={16} strokeWidth={2} aria-hidden />
                    削除
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="mb-1 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  進捗率
                </p>
                <p className="text-xl font-bold leading-none text-zinc-900">{progress}%</p>
              </div>
              <div className="h-1.5 w-48 overflow-hidden rounded-full bg-zinc-100">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full rounded-full bg-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="group relative flex h-[min(75dvh,48rem)] min-h-[28rem] w-full min-w-0 shrink-0 overflow-hidden rounded-[2rem] border border-zinc-100 bg-white shadow-inner lg:rounded-[2.5rem]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onNodeDragStop={(_, node) => {
              const { x, y } = node.position;
              if (!Number.isFinite(x) || !Number.isFinite(y)) return;
              onUpdateNodePosition(node.id, x, y);
            }}
            onPaneClick={closeNodeDetail}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.35, maxZoom: 1.25 }}
            minZoom={0.35}
            maxZoom={2}
            className="h-full w-full bg-[#fafafa]"
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#e4e4e7" gap={24} size={1} />
            <Controls
              className="!overflow-hidden !rounded-xl !border-zinc-100 !bg-white !shadow-xl"
              showInteractive={false}
            />
          </ReactFlow>
        </div>

        <NodeDetailPanel
          node={selectedNode}
          onClose={closeNodeDetail}
          onUpdateStatus={onUpdateNodeStatus}
        />

        <NodeEditModal
          node={editingNode}
          onClose={() => setEditingNodeId(null)}
          onSave={onUpdateNodeContent}
        />
      </div>
    </RoadmapSelectedNodeContext.Provider>
  );
}
