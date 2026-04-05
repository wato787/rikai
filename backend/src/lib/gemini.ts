/**
 * Gemini API（Google AI for Developers）の公式 REST 手順に沿う。
 * @see https://ai.google.dev/gemini-api/docs/text-generation （REST・x-goog-api-key）
 * @see https://ai.google.dev/gemini-api/docs/json-mode （responseMimeType + responseJsonSchema）
 *
 * モデル: 本番向けは安定版 ID を利用（gemini-2.0-flash は deprecate 済みのため避ける）。
 * @see https://ai.google.dev/gemini-api/docs/models
 */

export type GeminiRoadmapPayload = {
  title: string;
  nodes: { id: string; label: string; description: string; order: number }[];
  edges: { source: string; target: string }[];
};

/** 構造化出力用 JSON Schema（Gemini がサポートするサブセットに合わせる） */
const ROADMAP_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "ロードマップ全体の日本語タイトル。",
    },
    nodes: {
      type: "array",
      description:
        "学習ステップ。5〜12 件。各 id はノード内で一意の短い識別子（英数字）。label・description は日本語。",
      minItems: 5,
      maxItems: 12,
      items: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ノードの一意 ID（edges の source/target から参照される）。",
          },
          label: { type: "string", description: "ステップ名（日本語）。" },
          description: {
            type: "string",
            description: "そのステップの内容を 1〜3 文で日本語で説明する。",
          },
          order: {
            type: "integer",
            description: "0 始まりの学習推奨順。",
            minimum: 0,
          },
        },
        required: ["id", "label", "description", "order"],
      },
    },
    edges: {
      type: "array",
      description:
        "学習の依存関係。source のステップを終えてから target に進む有向辺。source/target は必ず nodes の id に存在すること。",
      items: {
        type: "object",
        properties: {
          source: { type: "string", description: "出発ノードの id。" },
          target: { type: "string", description: "到達ノードの id。" },
        },
        required: ["source", "target"],
      },
    },
  },
  required: ["title", "nodes", "edges"],
} as const;

const SYSTEM_INSTRUCTION = `あなたは学習ロードマップ設計の専門家です。
ユーザーが入力した「学習トピック」に対し、DAG（閉路のない有向グラフ）として学習ステップを設計してください。
出力はリクエストで指定された JSON スキーマに厳密に従うこと。スキーマ外のキーや説明文の前置きは付けないこと。
すべての説明文・タイトル・ラベルは自然な日本語で書くこと。`;

/** 安定版の推奨モデル（Structured Outputs 対応） */
export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export type GenerateRoadmapOptions = {
  /** 例: gemini-2.5-flash-lite（環境変数 GEMINI_MODEL で上書き可） */
  model?: string;
};

type GenerateContentResponseBody = {
  error?: { code?: number; message?: string; status?: string };
  promptFeedback?: { blockReason?: string };
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

function parseRoadmapPayload(text: string): GeminiRoadmapPayload | null {
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
    const orderRaw = row.order;
    const order =
      typeof orderRaw === "number" && Number.isFinite(orderRaw) ? Math.floor(orderRaw) : null;
    if (
      typeof row.id !== "string" ||
      typeof row.label !== "string" ||
      typeof row.description !== "string" ||
      order === null ||
      order < 0
    ) {
      return null;
    }
    nodes.push({
      id: row.id,
      label: row.label,
      description: row.description,
      order,
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

function extractTextFromGenerateContent(body: GenerateContentResponseBody): string | null {
  if (body.promptFeedback?.blockReason) {
    return null;
  }
  const candidates = body.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }
  const first = candidates[0];
  const reason = first.finishReason;
  if (reason && reason !== "STOP" && reason !== "MAX_TOKENS") {
    return null;
  }
  const parts = first.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const text = parts[0]?.text;
  return typeof text === "string" && text.length > 0 ? text : null;
}

/**
 * generateContent（Structured Outputs）。
 * 失敗時は null（呼び出し側で 502 等にマッピング）。
 */
export async function generateRoadmapWithGemini(
  apiKey: string,
  topic: string,
  options?: GenerateRoadmapOptions,
): Promise<GeminiRoadmapPayload | null> {
  const model =
    options?.model?.trim() ||
    (typeof process.env.GEMINI_MODEL === "string" && process.env.GEMINI_MODEL.trim()) ||
    DEFAULT_GEMINI_MODEL;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }],
      },
      contents: [
        {
          parts: [
            {
              text: `次の学習トピック用のロードマップを、指定スキーマの JSON のみで出力してください。\n\nトピック:\n${topic}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseJsonSchema: ROADMAP_RESPONSE_JSON_SCHEMA,
      },
    }),
  });

  const body = (await res.json()) as GenerateContentResponseBody;

  if (!res.ok || body.error) {
    console.error(
      "Gemini API error",
      res.status,
      body.error?.status ?? body.error?.code,
      body.error?.message,
    );
    return null;
  }

  const text = extractTextFromGenerateContent(body);
  if (!text) {
    console.error("Gemini: empty or blocked response", {
      blockReason: body.promptFeedback?.blockReason,
      candidates: body.candidates?.length ?? 0,
    });
    return null;
  }

  return parseRoadmapPayload(text);
}
