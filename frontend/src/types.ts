export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export interface DetailedContent {
  explanation: string;
  keyPoints: string[];
  quiz: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  };
}

export interface Task {
  id: string;
  title: string;
  description: string;
  estimatedHours: number;
  status: TaskStatus;
  content?: DetailedContent; // オンデマンドで生成される詳細データ
}

export interface Module {
  id: string;
  title: string;
  tasks: Task[];
}

export interface Curriculum {
  id: string;
  title: string;
  goal: string;
  description: string;
  level: string;
  totalEstimatedHours: number;
  modules: Module[];
  createdAt: number;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  timestamp: number;
}
