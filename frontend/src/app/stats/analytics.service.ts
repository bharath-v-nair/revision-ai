import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AnalyticsDashboardResponse,
  BatchAnalysisResponse,
  QuestionHistoryResponse,
} from './analytics.models';

const BASE = '/api';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private http = inject(HttpClient);

  getDashboard(): Observable<AnalyticsDashboardResponse> {
    return this.http.get<AnalyticsDashboardResponse>(`${BASE}/analysis/dashboard`);
  }

  getBatchAnalysis(questionIds: string[]): Observable<BatchAnalysisResponse> {
    return this.http.post<BatchAnalysisResponse>(`${BASE}/analysis/batch`, { questionIds });
  }

  getQuestionHistory(questionId: string): Observable<QuestionHistoryResponse> {
    return this.http.get<QuestionHistoryResponse>(
      `${BASE}/analysis/question/${questionId}/history`,
    );
  }
}
