import type { Roadmap } from "@/types/roadmap";

/** メモリのみ。リロードでリセット。 */
export const INITIAL_MOCK_ROADMAPS: Roadmap[] = [
  {
    id: "1",
    title: "現代のWebフロントエンド開発",
    nodes: [
      {
        id: "n1",
        label: "HTML/CSS",
        description: "Webの基本となる構造とスタイリングを学びます。",
        level: 1,
        status: "completed",
      },
      {
        id: "n2",
        label: "JavaScript",
        description: "動的なWebサイトを構築するためのプログラミング言語を習得します。",
        level: 1,
        status: "completed",
      },
      {
        id: "n3",
        label: "React",
        description: "コンポーネントベースのUIライブラリを学び、モダンな開発手法を身につけます。",
        level: 2,
        status: "in_progress",
      },
      {
        id: "n4",
        label: "Next.js",
        description: "SSR/SSGをサポートするReactフレームワークで、実用的なアプリを構築します。",
        level: 3,
        status: "not_started",
      },
    ],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
