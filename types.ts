
export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_path', title: 'Pathfinder', description: 'Created your first learning path', icon: '🗺️' },
  { id: 'mastery', title: 'Mastery', description: 'Got 100% on a quiz', icon: '🎯' },
  { id: 'streaker', title: 'Streaker', description: 'Maintained a 3-day streak', icon: '🔥' },
  { id: 'level_5', title: 'Rising Star', description: 'Reached Level 5', icon: '⭐' }
];

export interface User {
  id: string;
  username: string;
  email: string;
  hasOnboarded: boolean;
  preferredLanguage: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate?: string;
  achievements: Achievement[];
}

export interface Topic {
  title: string;
  explanation: string;
  keyConcepts: string[];
  examples: string[];
  practiceFocus: string;
}

export interface DayPlan {
  day: number;
  objective: string;
  topics: Topic[];
}

export interface LearningPath {
  id: string;
  goal: string;
  difficulty: Difficulty;
  days: DayPlan[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  type: 'MCQ' | 'TF' | 'SHORT';
  question: string;
  options?: string[]; // For MCQ
  correctAnswer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  day: number;
  questions: QuizQuestion[];
}

export interface PerformanceRecord {
  quizId: string;
  score: number;
  totalQuestions: number;
  timestamp: string;
  accuracy: number;
  xpEarned?: number;
}

export interface StudyGroup {
  id: string;
  name: string;
  subject: string;
  members: string[];
  roomCode: string;
}

export interface GroupMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isAI: boolean;
}
