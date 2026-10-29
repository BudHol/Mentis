export type TutorMode = 'socratic' | 'assistant';

export interface LectureDeck {
  id: string;
  course: string;
  title: string;
  filename: string;
  pages: number;
  chunkCount: number;
  uploadedAt: string;
  summary: string;
  topics: string[];
}

export interface RagChunk {
  id: string;
  deckId: string;
  lectureTitle: string;
  slideNumber: number;
  snippet: string;
  similarityScore: number;
  keywords: string[];
}

export type VisualComponentType = 
  | 'mcq'
  | 'flashcard'
  | 'hint-ladder'
  | 'loss-diagram'
  | 'slide-citation'
  | 'code-block'
  | 'concept-diagram'
  | 'neural-flow'
  | 'math-card';

export interface McqOption {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface McqData {
  question: string;
  options: McqOption[];
  socraticFollowUp?: string;
}

export interface FlashcardData {
  front: string;
  back: string;
  context: string;
  slideRef?: string;
}

export interface HintItem {
  level: number;
  label: string;
  content: string;
}

export interface HintLadderData {
  title: string;
  coreQuestion: string;
  hints: HintItem[];
  finalInsight: string;
}

export interface SlideCitationData {
  deckTitle: string;
  slideNumber: number;
  excerpt: string;
  similarity: number;
  topic: string;
}

export interface CodeBlockData {
  language: string;
  code: string;
  filename?: string;
  notes?: string;
  runnable?: boolean;
}

export interface MessageVisualPayload {
  type: VisualComponentType;
  mcq?: McqData;
  flashcard?: FlashcardData;
  hintLadder?: HintLadderData;
  slideCitation?: SlideCitationData;
  codeBlock?: CodeBlockData;
  conceptDiagram?: {
    title: string;
    summary: string;
    nodes: Array<{ id: string; label: string; detail: string }>;
    connections: Array<{ from: string; to: string; label?: string }>;
  };
  neuralFlow?: Record<string, never>;
  lossDiagram?: {
    defaultLearningRate: number;
    initialSteps: number;
  };
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  timestamp: string;
  mode: TutorMode;
  text: string;
  visuals?: MessageVisualPayload[];
  ragSources?: RagChunk[];
  socraticRatio?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  instructor: string;
  decksCount: number;
}
