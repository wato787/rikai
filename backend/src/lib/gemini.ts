export type GeminiRoadmapPayload = {
  title: string;
  nodes: { id: string; label: string; description: string; order: number }[];
  edges: { source: string; target: string }[];
};

function parseGeminiJson(text: string): GeminiRoadmapPayload | null {
  const trimmed = text.trim();
  let data: unknown;
  try {
    data = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  if (typeof o.title !== "string" || !Array.isArray(o.nodes) || !Array.isArray(o.edges)) {
    return null;
  }
  const nodes: GeminiRoadmapPayload["nodes"] = [];
  for (const n of o.nodes) {
    if (!n || typeof n !== "object") return null;
    const row = n as Record<string, unknown>;
    if (
      typeof row.id !== "string" ||
      typeof row.label !== "string" ||
      typeof row.description !== "string" ||
      typeof row.order !== "number" ||
      !Number.isFinite(row.order)
    ) {
      return null;
    }
    nodes.push({
      id: row.id,
      label: row.label,
      description: row.description,
      order: row.order,
    });
  }
  const edges: GeminiRoadmapPayload["edges"] = [];
  for (const e of o.edges) {
    if (!e || typeof e !== "object") return null;
    const row = e as Record<string, unknown>;
    if (typeof row.source !== "string" || typeof row.target !== "string") return null;
    edges.push({ source: row.source, target: row.target });
  }
  return { title: o.title, nodes, edges };
}

/**
 * Gemini generateContent（JSON）。失敗時は null。
 */
export async function generateRoadmapWithGemini(
  apiKey: string,
  topic: string,
): Promise<GeminiRoadmapPayload | null> {
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = `あなたは学習ロードマップ設計者です。ユーザーのトピックに対し、依存関係のある学習ステップをノードとエッジで表現してください。
出力は次のJSONオブジェクトのみ（前後に説明文を付けないこと）:
{
  "title": "ロードマップ全体の日本語タイトル",
  "nodes": [
    { "id": "n1", "label": "ステップ名（日本語）", "description": "1〜3文の日本語説明", "order": 0 }
  ],
  "edges": [
    { "source": "n1", "target": "n2" }
  ]
}
ルール:
- nodes は5〜12件、id はノード内で一意の短い文字列（英数字）
- edges の source/target は必ず nodes に存在する id
- order は 0 からの整数、学習の推奨順
- すべて日本語で記述

ユーザートピック: ${topic}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    return null;
  }

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== "string") {
    return null;
  }

  return parseGeminiJson(text);
}
