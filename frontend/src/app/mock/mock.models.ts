export interface MockQuestionDto {
  displayOrder: number;
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  hasMedia: boolean;
}

export interface MockGenerateResponse {
  mockSessionId: string;
  totalQuestions: number;
  timeLimitMinutes: number | null;
  questions: MockQuestionDto[];
}

export interface MockSessionDetail {
  mockSessionId: string;
  config: string;
  totalQuestions: number;
  timeLimitMinutes: number | null;
  startedAt: string;
  isCompleted: boolean;
  score: number | null;
  questions: MockQuestionDto[];
}

export interface MockAnswerDto {
  questionId: string;
  displayOrder: number;
  selectedOption: string;
  timeTakenMs: number;
}

export interface MockAnswerResultItem {
  questionId: string;
  displayOrder: number;
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
}

export interface MockAnswersResponse {
  results: MockAnswerResultItem[];
}

export interface MockCompleteResponse {
  mockSessionId: string;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  skippedCount: number;
  score: number;
  timeTakenSeconds: number | null;
}

export interface MockResultQuestionDto {
  displayOrder: number;
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  correctOption: string;
  explanation: string;
  timeTakenMs: number | null;
  hasMedia: boolean;
}

export interface MockResultsResponse {
  mockSessionId: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  score: number;
  timeTakenSeconds: number | null;
  questions: MockResultQuestionDto[];
}

export interface MockHistoryDto {
  mockSessionId: string;
  startedAt: string;
  completedAt: string | null;
  questionCount: number;
  score: number | null;
  timeTakenSeconds: number | null;
}

export interface MockHistoryResponse {
  data: MockHistoryDto[];
  meta: {
    page: number;
    pageSize: number;
    totalCount: number;
    hasNext: boolean;
  };
}
