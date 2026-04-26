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
import { ArrowLeft, CheckCircle2, Circle, List, Loader2, Network } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Roadmap, RoadmapNode } from "@/types/roadmap";

import { NodeDetailPanel } from "./NodeDetailPanel";

const RoadmapSelectedNodeContext = createContext<string | null>(null);
const ROADMAP_DETAIL_VIEW_MODE_KEY = "rikai.roadmapDetailViewMode";

type DetailViewMode = "list" | "flow";

function getStatusLabel(status: RoadmapNode["status"]): string {
  if (status === "completed") return "完了";
  if (status === "in_progress") return "進行中";
  return "未着手";
}

function getStatusChipClass(status: RoadmapNode["status"]): string {
  if (status === "completed") return "bg-emerald-50 text-emerald-600";
  if (status === "in_progress") return "bg-amber-50 text-amber-600";
  return "bg-zinc-100 text-zinc-600";
}

function readInitialViewMode(): DetailViewMode {
  if (typeof window === "undefined") return "list";
  try {
    return localStorage.getItem(ROADMAP_DETAIL_VIEW_MODE_KEY) === "flow" ? "flow" : "list";
  } catch {
    return "list";
  }
}

function RoadmapNodeComponent({ data, id }: NodeProps) {
  const selectedNodeId = useContext(RoadmapSelectedNodeContext);
  const isSelected = selectedNodeId === id;

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
        className={`w-[min(100%,26rem)] max-w-[26rem] cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-[box-shadow,border-color] duration-300 hover:shadow-md hover:shadow-zinc-900/5 group-hover:border-zinc-200 ${
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
            className="nodrag mt-1 shrink-0 transition-transform active:scale-90"
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
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div
            className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase ${
              status === "completed"
                ? "bg-emerald-50 text-emerald-600"
                : status === "in_progress"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-zinc-100 text-zinc-500"
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

type DetailViewToggleProps = {
  viewMode: DetailViewMode;
  onChangeViewMode: (nextMode: DetailViewMode) => void;
};

function DetailViewToggle({ viewMode, onChangeViewMode }: DetailViewToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChangeViewMode("list")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          viewMode === "list"
            ? "bg-zinc-900 text-white"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
        aria-pressed={viewMode === "list"}
      >
        <List size={14} aria-hidden />
        リスト
      </button>
      <button
        type="button"
        onClick={() => onChangeViewMode("flow")}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
          viewMode === "flow"
            ? "bg-zinc-900 text-white"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        }`}
        aria-pressed={viewMode === "flow"}
      >
        <Network size={14} aria-hidden />
        フロー
      </button>
    </div>
  );
}

type FlowViewProps = {
  nodes: Node[];
  edges: Edge[];
  nodeTypes: { roadmapNode: typeof RoadmapNodeComponent };
  onNodeClick: (_event: MouseEvent, node: Node) => void;
  onPaneClick: () => void;
};

function FlowView({ nodes, edges, nodeTypes, onNodeClick, onPaneClick }: FlowViewProps) {
  return (
    <div className="group relative flex h-[min(75dvh,48rem)] min-h-[28rem] w-full min-w-0 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-white shadow-inner">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
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
          className="!overflow-hidden !rounded-md !border-zinc-100 !bg-white !shadow-xl"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}

type ListViewProps = {
  roadmap: Roadmap;
  selectedListNode: RoadmapNode | null;
  onSelectNode: (nodeId: string) => void;
  onUpdateNodeStatus: (nodeId: string, status: RoadmapNode["status"]) => void;
};

function ListView({ roadmap, selectedListNode, onSelectNode, onUpdateNodeStatus }: ListViewProps) {
  return (
    <div className="h-[min(75dvh,48rem)] min-h-[28rem] w-full overflow-hidden rounded-lg border border-zinc-200 bg-white">
      <div className="flex h-full min-h-0">
        <div className="h-full w-[min(38%,22rem)] min-w-[18rem] overflow-y-auto border-r border-zinc-200">
          {roadmap.nodes.map((node, index) => {
            const isActive = selectedListNode?.id === node.id;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => onSelectNode(node.id)}
                className={`w-full border-b border-zinc-100 px-4 py-3 text-left transition-colors ${
                  isActive ? "bg-zinc-100" : "hover:bg-zinc-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-xs font-semibold text-zinc-400">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{node.label}</p>
                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {node.description || "説明なし"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${getStatusChipClass(node.status)}`}
                  >
                    {getStatusLabel(node.status)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {selectedListNode ? (
            <div className="flex min-h-full flex-col">
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold tracking-wide uppercase ${getStatusChipClass(selectedListNode.status)}`}
                >
                  {getStatusLabel(selectedListNode.status)}
                </span>
                <div className="inline-flex rounded-md border border-zinc-200 bg-white p-1">
                  {(
                    [
                      {
                        id: "not_started",
                        label: "未着手",
                        icon: <Circle size={12} aria-hidden />,
                      },
                      {
                        id: "in_progress",
                        label: "進行中",
                        icon: <Loader2 size={12} className="animate-spin" aria-hidden />,
                      },
                      {
                        id: "completed",
                        label: "完了",
                        icon: <CheckCircle2 size={12} aria-hidden />,
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateNodeStatus(selectedListNode.id, item.id)}
                      className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition-colors ${
                        selectedListNode.status === item.id
                          ? item.id === "completed"
                            ? "bg-emerald-500 text-white"
                            : item.id === "in_progress"
                              ? "bg-amber-500 text-white"
                              : "bg-zinc-900 text-white"
                          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 px-6 py-5">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900">
                  {selectedListNode.label}
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600">
                  {selectedListNode.description || "説明はまだありません。"}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-400">
              ステップがありません
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type RoadmapDetailProps = {
  roadmap: Roadmap;
  /** TanStack Query の dataUpdatedAt。キャッシュがネットワークで更新されたときだけ進む（楽観更新では不変） */
  syncRevision: number;
  onUpdateNodeStatus: (nodeId: string, status: RoadmapNode["status"]) => void;
};

export function RoadmapDetail({ roadmap, syncRevision, onUpdateNodeStatus }: RoadmapDetailProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<DetailViewMode>(() => readInitialViewMode());

  const onUpdateNodeStatusRef = useRef(onUpdateNodeStatus);
  onUpdateNodeStatusRef.current = onUpdateNodeStatus;
  const selectedNode =
    selectedNodeId === null ? null : (roadmap.nodes.find((n) => n.id === selectedNodeId) ?? null);
  const selectedListNode = selectedNode ?? roadmap.nodes[0] ?? null;

  const nodeTypes = useMemo(() => ({ roadmapNode: RoadmapNodeComponent }), []);

  useEffect(() => {
    if (selectedNodeId !== null && !roadmap.nodes.some((n) => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [roadmap.nodes, selectedNodeId]);

  useEffect(() => {
    if (viewMode !== "list") return;
    if (roadmap.nodes.length === 0) return;
    if (selectedNodeId !== null) return;
    setSelectedNodeId(roadmap.nodes[0]?.id ?? null);
  }, [roadmap.nodes, selectedNodeId, viewMode]);

  const onNodeClick = useCallback((_event: MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const closeNodeDetail = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const handleChangeViewMode = useCallback((nextMode: DetailViewMode) => {
    setViewMode(nextMode);
    try {
      localStorage.setItem(ROADMAP_DETAIL_VIEW_MODE_KEY, nextMode);
    } catch {
      /* ignore */
    }
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
      },
      draggable: false,
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
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 leading-tight">
                {roadmap.title}
              </h1>
            </div>

            <div className="flex items-center">
              <DetailViewToggle viewMode={viewMode} onChangeViewMode={handleChangeViewMode} />
            </div>
          </div>
        </div>

        {viewMode === "flow" ? (
          <FlowView
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={closeNodeDetail}
          />
        ) : (
          <ListView
            roadmap={roadmap}
            selectedListNode={selectedListNode}
            onSelectNode={setSelectedNodeId}
            onUpdateNodeStatus={onUpdateNodeStatus}
          />
        )}

        {viewMode === "flow" ? (
          <NodeDetailPanel
            node={selectedNode}
            onClose={closeNodeDetail}
            onUpdateStatus={onUpdateNodeStatus}
          />
        ) : null}
      </div>
    </RoadmapSelectedNodeContext.Provider>
  );
}
