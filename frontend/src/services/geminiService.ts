
import { GoogleGenAI, Type } from "@google/genai";
import type { Curriculum, DetailedContent } from "@/types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

/**
 * カリキュラムの全体構造（ロードマップ）を生成
 */
export const generateCurriculum = async (goal: string, experience: string): Promise<Curriculum> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `目標: 「${goal}」、経験: 「${experience}」。
    この目標を達成するための体系的な学習ロードマップをJSONで作成してください。
    各タスクはタイトルと概要のみでOKです。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          level: { type: Type.STRING },
          totalEstimatedHours: { type: Type.NUMBER },
          modules: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                tasks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      estimatedHours: { type: Type.NUMBER }
                    },
                    required: ["title", "description", "estimatedHours"]
                  }
                }
              },
              required: ["title", "tasks"]
            }
          }
        },
        required: ["title", "description", "level", "totalEstimatedHours", "modules"]
      }
    }
  });

  const rawData = JSON.parse(response.text || '{}');

  return {
    ...rawData,
    id: Math.random().toString(36).substring(7),
    goal,
    createdAt: Date.now(),
    modules: (rawData.modules || []).map((m: any, mIdx: number) => ({
      ...m,
      id: `module-${mIdx}`,
      tasks: (m.tasks || []).map((t: any, tIdx: number) => ({
        ...t,
        id: `task-${mIdx}-${tIdx}`,
        status: 'pending'
      }))
    }))
  };
};

/**
 * 特定のタスクの「詳細解説」と「クイズ」を生成
 */
export const generateTaskContent = async (curriculumTitle: string, taskTitle: string): Promise<DetailedContent> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `カリキュラム「${curriculumTitle}」のトピック「${taskTitle}」について、
    初心者にも分かりやすい解説と理解度チェッククイズを作成してください。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          explanation: { type: Type.STRING, description: "300文字程度の分かりやすい解説。Markdown形式（太字など）を使用可。" },
          keyPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "覚えておくべき重要ポイント3つ"
          },
          quiz: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4択の選択肢" },
              correctAnswer: { type: Type.INTEGER, description: "0-3のインデックス" },
              explanation: { type: Type.STRING, description: "クイズの正解・不正解に関する解説" }
            },
            required: ["question", "options", "correctAnswer", "explanation"]
          }
        },
        required: ["explanation", "keyPoints", "quiz"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const getLearningSupport = async (curriculum: Curriculum, currentTask: string, userMessage: string, _history: any[]) => {
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `あなたは「MindMap AI」の専属メンターです。
      「${curriculum.title}」の「${currentTask}」を学習中のユーザーをサポートします。
      親しみやすく、専門的な内容も噛み砕いて教えてください。`,
    }
  });

  const result = await chat.sendMessage({ message: userMessage });
  return result.text;
};
