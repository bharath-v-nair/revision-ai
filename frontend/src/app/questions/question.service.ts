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
  NoteDto,
} from './question.models';
import { DueQuestionDto, SrStatsDto, SrReviewResult } from '../review/review.models';

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

  // SR — plain response objects
  getSrStats(): Observable<SrStatsDto> {
    return this.http.get<SrStatsDto>('/api/spaced-repetition/stats');
  }

  getDueQuestions(
    page = 1,
    pageSize = 20,
  ): Observable<{ data: DueQuestionDto[]; meta: PaginatedMeta }> {
    return this.http.get<{ data: DueQuestionDto[]; meta: PaginatedMeta }>(
      `/api/spaced-repetition/due?page=${page}&pageSize=${pageSize}`,
    );
  }

  submitSrReview(
    questionId: string,
    selectedOption: string,
    timeTakenMs: number,
  ): Observable<SrReviewResult> {
    return this.http.post<SrReviewResult>(
      `/api/spaced-repetition/${questionId}/review`,
      { selectedOption, timeTakenMs },
    );
  }

  // Bookmarks — collections plain array, items paginated
  getBookmarkCollections(): Observable<BookmarkCollection[]> {
    return this.http.get<BookmarkCollection[]>('/api/bookmarks/collections');
  }

  createBookmarkCollection(name: string): Observable<BookmarkCollection> {
    return this.http.post<BookmarkCollection>('/api/bookmarks/collections', { name });
  }

  deleteBookmarkCollection(id: string): Observable<void> {
    return this.http.delete<void>(`/api/bookmarks/collections/${id}`);
  }

  getBookmarkItems(
    collectionId: string,
    page = 1,
    pageSize = 20,
  ): Observable<{ data: QuestionWithoutAnswersDto[]; meta: PaginatedMeta }> {
    return this.http.get<{ data: QuestionWithoutAnswersDto[]; meta: PaginatedMeta }>(
      `/api/bookmarks/collections/${collectionId}/items?page=${page}&pageSize=${pageSize}`,
    );
  }

  addBookmarkItem(collectionId: string, questionId: string): Observable<void> {
    return this.http.post<void>(`/api/bookmarks/collections/${collectionId}/items`, { questionId });
  }

  deleteBookmarkItem(collectionId: string, questionId: string): Observable<void> {
    return this.http.delete<void>(
      `/api/bookmarks/collections/${collectionId}/items/${questionId}`,
    );
  }

  // Notes — plain array response
  getNotes(questionId: string): Observable<NoteDto[]> {
    return this.http.get<NoteDto[]>(`/api/notes?questionId=${questionId}`);
  }

  uploadNote(questionId: string, file: File): Observable<NoteDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<NoteDto>(`/api/notes?questionId=${questionId}`, formData);
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`);
  }

  tickStreak(): Observable<void> {
    return this.http.post<void>('/api/streaks/tick', {});
  }
}
