export interface SubjectAccuracy {
  subjectId: string;
  subjectName: string;
  accuracy: number;
}

export interface DashboardResponse {
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  streakDays: number;
  totalXp: number;
  currentLevel: number;
  weakestSubject: SubjectAccuracy | null;
  strongestSubject: SubjectAccuracy | null;
}

export interface XpTransaction {
  id: string;
  amount: number;
  reason: string;
  questionId: string | null;
  createdAt: string;
}

export interface XpSummaryResponse {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  recentTransactions: XpTransaction[];
}

export interface StreakResponse {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  isAtRisk: boolean;
}

export type { QuestionWithoutAnswersDto, PendingQuestionDto } from '../questions/question.models';

export interface PendingQuestionsResponse {
  data: import('../questions/question.models').PendingQuestionDto[];
}
