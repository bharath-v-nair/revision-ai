import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import {
  QuestionIssue,
  QuestionReportDto,
  ChapterReportsDto,
  SubjectReportSummaryDto,
  SubjectReportIndexDto,
} from '../../../questions/question.models';

@Injectable({ providedIn: 'root' })
export class QuestionReportService {
  private http = inject(HttpClient);

  getReport(questionId: string): Observable<QuestionReportDto | null> {
    return this.http.get<QuestionReportDto | null>(`/api/qa/questions/${questionId}/report`).pipe(
      catchError(() => of(null))
    );
  }

  upsertReport(questionId: string, issues: QuestionIssue[], notes: string | null): Observable<QuestionReportDto> {
    return this.http.post<QuestionReportDto>(`/api/qa/questions/${questionId}/report`, { issues, notes });
  }

  clearReport(questionId: string): Observable<void> {
    return this.http.delete<void>(`/api/qa/questions/${questionId}/report`);
  }

  getChapterReports(chapterId: string): Observable<ChapterReportsDto> {
    return this.http.get<ChapterReportsDto>(`/api/qa/chapters/${chapterId}/reports`);
  }

  getSubjectReports(subjectId: string): Observable<SubjectReportSummaryDto> {
    return this.http.get<SubjectReportSummaryDto>(`/api/qa/subjects/${subjectId}/reports`);
  }

  getAllSubjectReports(): Observable<SubjectReportIndexDto[]> {
    return this.http.get<SubjectReportIndexDto[]>('/api/qa/subjects/reports');
  }
}
