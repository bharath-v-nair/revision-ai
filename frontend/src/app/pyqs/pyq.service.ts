import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PyqSubjectDto, PyqPaperDto, PyqPaperQuestionsDto } from './pyq.models';

@Injectable({ providedIn: 'root' })
export class PyqService {
  private http = inject(HttpClient);

  getSubjects(): Observable<{ data: PyqSubjectDto[] }> {
    return this.http.get<{ data: PyqSubjectDto[] }>('/api/pyqs/subjects');
  }

  getPapers(subjectSlug: string): Observable<{ data: PyqPaperDto[] }> {
    return this.http.get<{ data: PyqPaperDto[] }>(
      `/api/pyqs/subjects/${encodeURIComponent(subjectSlug)}/papers`,
    );
  }

  getPaperQuestions(examName: string): Observable<PyqPaperQuestionsDto> {
    return this.http.get<PyqPaperQuestionsDto>(
      `/api/pyqs/papers/${encodeURIComponent(examName)}/questions`,
    );
  }
}
