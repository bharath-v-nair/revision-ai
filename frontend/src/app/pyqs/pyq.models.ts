import { QuestionDetailDto } from '../questions/question.models';

export interface PyqSubjectDto {
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  totalPapers: number;
  totalQuestions: number;
}

export interface PyqPaperDto {
  examName: string;
  examType: string;
  examYear: number;
  questionCount: number;
  chapterNumber: number;
}

export interface PyqPaperQuestionsDto {
  examName: string;
  data: QuestionDetailDto[];
}
