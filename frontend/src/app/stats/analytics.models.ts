export interface BatchAnalysisResponse {
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  accuracyPercentage: number;
  averageTimeMs: number;
}

export interface SubjectSummary {
  subjectId: string;
  subjectName: string;
  accuracy: number;
}

export interface AnalyticsDashboardResponse {
  totalQuestionsAnswered: number;
  totalCorrect: number;
  totalIncorrect: number;
  overallAccuracy: number;
  streakDays: number;
  totalXp: number;
  currentLevel: number;
  weakestSubject: SubjectSummary | null;
  strongestSubject: SubjectSummary | null;
}

export interface QuestionAttemptDto {
  sessionType: string;
  selectedOption: string;
  isCorrect: boolean;
  timeTakenMs: number;
  createdAt: string;
}

export interface QuestionHistoryResponse {
  questionText: string;
  currentEaseFactor: number;
  currentInterval: number;
  attempts: QuestionAttemptDto[];
}
