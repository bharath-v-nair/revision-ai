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
import {
  MockGenerateResponse,
  MockSessionDetail,
  MockAnswerDto,
  MockAnswersResponse,
  MockCompleteResponse,
  MockResultsResponse,
  MockHistoryResponse,
} from '../mock/mock.models';

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

  renameBookmarkCollection(id: string, name: string): Observable<void> {
    return this.http.patch<void>(`/api/bookmarks/collections/${id}`, { name });
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

  getUserNotes(filter?: { chapterId?: string; subjectId?: string }): Observable<NoteDto[]> {
    const params: string[] = [];
    if (filter?.chapterId) params.push(`chapterId=${filter.chapterId}`);
    if (filter?.subjectId) params.push(`subjectId=${filter.subjectId}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.http.get<NoteDto[]>(`/api/notes${qs}`);
  }

  uploadNote(questionId: string, file: File, noteType = 'Digital'): Observable<NoteDto> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<NoteDto>(
      `/api/notes?questionId=${questionId}&noteType=${encodeURIComponent(noteType)}`,
      formData,
    );
  }

  createNoteForChapter(file: File, chapterId: string, questionId?: string): Observable<NoteDto> {
    const formData = new FormData();
    formData.append('file', file);
    const isPdf = file.type === 'application/pdf';
    const noteType = isPdf ? 'PDF' : 'Digital';
    let url = `/api/notes?chapterId=${chapterId}&noteType=${encodeURIComponent(noteType)}`;
    if (questionId) url += `&questionId=${questionId}`;
    return this.http.post<NoteDto>(url, formData);
  }

  deleteNote(id: string): Observable<void> {
    return this.http.delete<void>(`/api/notes/${id}`);
  }

  tickStreak(): Observable<void> {
    return this.http.post<void>('/api/streaks/tick', {});
  }

  // Mocks
  generateMock(
    subjectIds: string[],
    questionCount: number,
    timeLimitMinutes?: number,
  ): Observable<MockGenerateResponse> {
    return this.http.post<MockGenerateResponse>('/api/mocks/generate', {
      subjectIds,
      questionCount,
      ...(timeLimitMinutes ? { timeLimitMinutes } : {}),
    });
  }

  getMockSession(mockSessionId: string): Observable<MockSessionDetail> {
    return this.http.get<MockSessionDetail>(`/api/mocks/${mockSessionId}`);
  }

  submitMockAnswers(
    mockSessionId: string,
    answers: MockAnswerDto[],
  ): Observable<MockAnswersResponse> {
    return this.http.post<MockAnswersResponse>(
      `/api/mocks/${mockSessionId}/answers`,
      { answers },
    );
  }

  completeMock(mockSessionId: string): Observable<MockCompleteResponse> {
    return this.http.post<MockCompleteResponse>(
      `/api/mocks/${mockSessionId}/complete`,
      {},
    );
  }

  getMockResults(mockSessionId: string): Observable<MockResultsResponse> {
    return this.http.get<MockResultsResponse>(`/api/mocks/${mockSessionId}/results`);
  }

  getMockHistory(page = 1, pageSize = 20): Observable<MockHistoryResponse> {
    return this.http.get<MockHistoryResponse>(
      `/api/mocks/history?page=${page}&pageSize=${pageSize}`,
    );
  }

  retakeIncorrect(previousMockSessionId: string): Observable<MockGenerateResponse> {
    return this.http.post<MockGenerateResponse>(
      '/api/mocks/generate/retake-incorrect',
      { previousMockSessionId },
    );
  }
}
