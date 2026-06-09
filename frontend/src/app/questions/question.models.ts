export interface QuestionWithoutAnswersDto {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  hasMedia: boolean;
  sourcePage: number;
  subjectName: string | null;
  chapterTitle: string | null;
}

export interface MediaDto {
  id: string;
  mediaType: string;
  description: string | null;
  blobUrl: string;
  pageNumber: number;
}

export interface QuestionDetailDto extends QuestionWithoutAnswersDto {
  correctOption: string;
  explanation: string;
  media: MediaDto[];
}

export interface PendingQuestionDto {
  pendingQuestionId: string;
  expiresAt: string;
  question: QuestionWithoutAnswersDto;
}

export interface AnswerResult {
  isCorrect: boolean;
  correctOption: string;
  explanation: string;
}

export interface HourlyHistoryDto {
  pendingQuestionId: string;
  expiresAt: string;
  isAnswered: boolean;
  answeredAt: string | null;
  userAnswer: string | null;
  question: QuestionWithoutAnswersDto;
}

export interface PaginatedMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
}

export interface SubjectDto {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  questionCount: number;
}

export interface ChapterDto {
  id: string;
  chapterNumber: number;
  title: string;
  startPage: number;
  endPage: number;
  questionCount: number;
}

export interface BookmarkCollection {
  id: string;
  name: string;
  itemCount: number;
}
