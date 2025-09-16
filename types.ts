// FIX: Moved all type definitions to this file to serve as a single source of truth for application types.
export type StudyMode = 'flashcards' | 'quiz' | 'learn' | 'memory_palace';

export type LearningStyle = 'memorization' | 'understanding' | 'mastery';

export interface Flashcard {
  front: string;
  back: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  hint?: string;
}

export interface LearningStep {
    concept: string;
    sanskritExample: string;
    englishExplanation: string;
    mnemonic: string;
}

export type LearningModule = LearningStep[];

// NEW: Added types for the "Memory Palace" feature.
// This structures the AI's output for step-by-step memorization of tables.
export interface MemoryPalaceStep {
  stepType: 'introduction' | 'pattern' | 'chunk' | 'recall' | 'review';
  title: string;
  explanation: string;
  tableChunk?: { headers: string[]; rows: string[][] };
  recallQuestion?: QuizQuestion;
}

export type MemoryPalaceModule = MemoryPalaceStep[];

export type GeneratedItems = Flashcard[] | QuizQuestion[] | LearningModule | MemoryPalaceModule;

export interface StudyFile {
  id: string;
  name:string;
  type: string; // MIME type
  content: string; // Base64 data URL for images, text for others
}

// FIX: Changed SectionId to `string` to support dynamic section IDs from syllabus analysis.
// This resolves the type errors in App.tsx related to setting the active section and clearing the study files state.
export type SectionId = string;

// FIX: Changed Topic to be a structured object to support hierarchical syllabus structures (e.g., main topics with sub-topics).
export interface Topic {
  name: string;
  subTopics?: string[];
}

export interface Section {
  id: SectionId;
  title: string;
  sanskritTitle: string;
  description: string;
  topics: Topic[];
}

export interface User {
  username: string;
}

export interface TopicPerformance {
  correct: number;
  total: number;
}

export interface UserStats {
  totalSessions: number;
  quizzesTaken: number;
  totalCorrect: number;
  totalQuestions: number;
  streak: number;
  lastSessionDate: string | null; // YYYY-MM-DD
  topicPerformance: Record<string, TopicPerformance>;
}

export interface UserProgress {
  completedTopics: string[];
}

export interface OptimizedScheduleItem {
    date: string;       // e.g., "2024-07-28"
    startTime: string;  // e.g., "09:00"
    endTime: string;    // e.g., "10:30"
    activity: string;   // e.g., "Study: सन्धिः (Sandhi)" or "Lunch Break"
}

export interface OptimizedSchedule {
    schedule: OptimizedScheduleItem[];
    reasoning: string;
}

export type AICommand =
  | { name: 'navigate'; sectionId: SectionId }
  | { name: 'generate'; studyMode: StudyMode; topic: string }
  | { name: 'open_modal'; modal: 'stats' | 'syllabus' }
  | { name: 'answer_only' };

export interface AIResponse {
  responseText: string;
  command: AICommand;
}
