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

export interface QuestionWithoutAnswersDto {
  id: string;
  questionText: string;
  options: { key: string; text: string }[];
  subject: string;
  topic: string;
}

export interface PendingQuestionDto {
  pendingQuestionId: string;
  expiresAt: string;
  question: QuestionWithoutAnswersDto;
}

export interface PendingQuestionsResponse {
  data: PendingQuestionDto[];
}
