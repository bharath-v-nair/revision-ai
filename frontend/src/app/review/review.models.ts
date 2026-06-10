import { QuestionWithoutAnswersDto } from '../questions/question.models';

export interface DueQuestionDto {
  questionScheduleId: string;
  question: QuestionWithoutAnswersDto;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface SrStatsDto {
  totalScheduled: number;
  dueToday: number;
  averageEaseFactor: number;
  totalReviews: number;
}

export interface SrReviewResult {
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
  newEaseFactor: number;
  newInterval: number;
  nextReviewDate: string;
}
