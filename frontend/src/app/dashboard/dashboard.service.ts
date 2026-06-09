import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  DashboardResponse,
  XpSummaryResponse,
  StreakResponse,
  PendingQuestionsResponse,
} from './dashboard.models';

const BASE = '/api';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${BASE}/analysis/dashboard`);
  }

  getXpSummary(): Observable<XpSummaryResponse> {
    return this.http.get<XpSummaryResponse>(`${BASE}/xp/summary`);
  }

  getStreaks(): Observable<StreakResponse> {
    return this.http.get<StreakResponse>(`${BASE}/streaks`);
  }

  getPendingQuestions(): Observable<PendingQuestionsResponse> {
    return this.http.get<PendingQuestionsResponse>(`${BASE}/hourly-questions`);
  }
}
