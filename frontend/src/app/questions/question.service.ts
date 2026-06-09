import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnswerResult,
  PendingQuestionDto,
  HourlyHistoryDto,
  PaginatedMeta,
  SubjectDto,
  ChapterDto,
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  BookmarkCollection,
} from './question.models';

@Injectable({ providedIn: 'root' })
export class QuestionService {
  private http = inject(HttpClient);

  getPendingQuestions(): Observable<{ data: PendingQuestionDto[] }> {
    return this.http.get<{ data: PendingQuestionDto[] }>('/api/hourly-questions');
  }

  submitAnswer(pendingQuestionId: string, selectedOption: string): Observable<AnswerResult> {
    return this.http.post<AnswerResult>(
      `/api/hourly-questions/${pendingQuestionId}/answer`,
      { selectedOption },
    );
  }

  getHourlyHistory(
    page = 1,
    pageSize = 20,
  ): Observable<{ data: HourlyHistoryDto[]; meta: PaginatedMeta }> {
    return this.http.get<{ data: HourlyHistoryDto[]; meta: PaginatedMeta }>(
      `/api/hourly-questions/history?page=${page}&pageSize=${pageSize}`,
    );
  }

  getSubjects(): Observable<{ data: SubjectDto[] }> {
    return this.http.get<{ data: SubjectDto[] }>('/api/subjects');
  }

  getChapters(slug: string): Observable<{ data: ChapterDto[] }> {
    return this.http.get<{ data: ChapterDto[] }>(`/api/subjects/${slug}/chapters`);
  }

  getQuestions(
    subjectSlug: string,
    chapterNumber: number,
    page = 1,
    pageSize = 20,
  ): Observable<{ data: QuestionWithoutAnswersDto[]; meta: PaginatedMeta }> {
    return this.http.get<{ data: QuestionWithoutAnswersDto[]; meta: PaginatedMeta }>(
      `/api/questions?subjectSlug=${subjectSlug}&chapterNumber=${chapterNumber}&page=${page}&pageSize=${pageSize}`,
    );
  }

  getQuestionDetail(id: string): Observable<{ data: QuestionDetailDto }> {
    return this.http.get<{ data: QuestionDetailDto }>(`/api/questions/${id}`);
  }

  getQuestionMediaOnly(id: string): Observable<{ data: import('./question.models').MediaDto[] }> {
    return this.http.get<{ data: import('./question.models').MediaDto[] }>(`/api/questions/${id}/media`);
  }

  getBookmarkCollections(): Observable<{ data: BookmarkCollection[] }> {
    return this.http.get<{ data: BookmarkCollection[] }>('/api/bookmarks/collections');
  }

  addBookmarkItem(collectionId: string, questionId: string): Observable<void> {
    return this.http.post<void>(`/api/bookmarks/collections/${collectionId}/items`, { questionId });
  }

  createBookmarkCollection(name: string): Observable<{ data: BookmarkCollection }> {
    return this.http.post<{ data: BookmarkCollection }>('/api/bookmarks/collections', { name });
  }

  tickStreak(): Observable<void> {
    return this.http.post<void>('/api/streaks/tick', {});
  }

  getNotes(questionId: string): Observable<{ data: { id: string; content: string; createdAt: string }[] }> {
    return this.http.get<{ data: { id: string; content: string; createdAt: string }[] }>(
      `/api/notes?questionId=${questionId}`,
    );
  }
}
