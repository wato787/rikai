import { GoogleGenAI } from "@google/genai";

/**
 * ロードマップ生成は公式 SDK `@google/genai` を使用。
 *
 * @see https://ai.google.dev/gemini-api/docs/libraries
 * @see https://ai.google.dev/gemini-api/docs/structured-output
 */

type GeminiRoadmapPayload = {
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
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

/** SDK の HTTP タイムアウト（ms）。長めの生成に備える。 */
const GENERATE_CONTENT_TIMEOUT_MS = 120_000;

type GenerateRoadmapOptions = {
  /** 例: gemini-2.5-flash-lite（環境変数 GEMINI_MODEL で上書き可） */
  model?: string;
};

export type GeminiGenerateFailureKind =
  | "transient_unavailable"
  | "blocked"
  | "invalid_response"
  | "other";

export type GenerateRoadmapResult = {
  payload: GeminiRoadmapPayload | null;
  failureKind?: GeminiGenerateFailureKind;
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

function logGeminiFailure(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`Gemini: ${context}`, msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetryableGeminiError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  // Gemini の混雑時は 503/429 系の文字列がメッセージに含まれる。
  return /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand/i.test(msg);
}

const MAX_GENERATE_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_200;

/**
 * generateContent（Structured Outputs / `@google/genai`）。
 * 失敗時は null（呼び出し側で 502 `AI_GENERATION_FAILED` にマッピング）。
 */
export async function generateRoadmapWithGemini(
  apiKey: string,
  topic: string,
  options?: GenerateRoadmapOptions,
): Promise<GenerateRoadmapResult> {
  const model =
    options?.model?.trim() ||
    (typeof process.env.GEMINI_MODEL === "string" && process.env.GEMINI_MODEL.trim()) ||
    DEFAULT_GEMINI_MODEL;

  const userPrompt = `次の学習トピック用のロードマップを、指定スキーマの JSON のみで出力してください。\n\nトピック:\n${topic}`;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: GENERATE_CONTENT_TIMEOUT_MS },
  });

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: userPrompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.4,
          responseMimeType: "application/json",
          responseJsonSchema: JSON.parse(JSON.stringify(ROADMAP_RESPONSE_JSON_SCHEMA)),
        },
      });

      if (response.promptFeedback?.blockReason) {
        console.error("Gemini: prompt blocked", response.promptFeedback.blockReason);
        return { payload: null, failureKind: "blocked" };
      }

      const text = response.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        console.error("Gemini: empty text in response", {
          candidates: response.candidates?.length ?? 0,
        });
        return { payload: null, failureKind: "invalid_response" };
      }

      const parsed = parseRoadmapPayload(text);
      if (!parsed) {
        return { payload: null, failureKind: "invalid_response" };
      }
      return { payload: parsed };
    } catch (err) {
      const retryable = isRetryableGeminiError(err);
      logGeminiFailure(`generateContent failed (attempt ${attempt}/${MAX_GENERATE_ATTEMPTS})`, err);

      if (!retryable) {
        return { payload: null, failureKind: "other" };
      }
      if (attempt >= MAX_GENERATE_ATTEMPTS) {
        return { payload: null, failureKind: "transient_unavailable" };
      }
      await sleep(RETRY_BASE_DELAY_MS * attempt);
    }
  }
  return { payload: null, failureKind: "transient_unavailable" };
}
