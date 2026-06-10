import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionReportService } from '../../shared/question/question-report/question-report.service';
import {
  SubjectReportIndexDto,
  SubjectReportSummaryDto,
  ChapterReportsDto,
  QuestionReportDto,
  QuestionIssue,
} from '../../questions/question.models';

type AdminView = 'subjects' | 'chapters' | 'questions';

const ISSUE_CONFIG: Record<QuestionIssue, { label: string; color: string }> = {
  QuestionText:      { label: 'Question text',        color: 'bg-orange-100 text-orange-700' },
  QuestionMedia:     { label: 'Question image(s)',    color: 'bg-yellow-100 text-yellow-700' },
  CorrectOption:     { label: 'Correct option',       color: 'bg-red-100 text-red-700' },
  ExplanationText:   { label: 'Explanation text',     color: 'bg-blue-100 text-blue-700' },
  ExplanationImages: { label: 'Explanation image(s)', color: 'bg-purple-100 text-purple-700' },
  ExplanationTables: { label: 'Explanation table(s)', color: 'bg-teal-100 text-teal-700' },
};

@Component({
  selector: 'app-admin-reports',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col min-h-screen bg-gray-50">

      <!-- Page header -->
      <div class="bg-white border-b border-gray-200 px-4 py-4 flex items-center gap-3">
        @if (view() !== 'subjects') {
          <button class="p-1.5 rounded-full hover:bg-gray-100" (click)="goBack()">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
        } @else {
          <a routerLink="/dashboard" class="p-1.5 rounded-full hover:bg-gray-100">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </a>
        }
        <div>
          <h1 class="text-base font-bold text-gray-800">QA Reports</h1>
          <p class="text-xs text-gray-400">{{ breadcrumb() }}</p>
        </div>
      </div>

      <!-- ─── SUBJECTS VIEW ─── -->
      @if (view() === 'subjects') {
        @if (loadingSubjects()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (subjects().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <span class="text-4xl">✅</span>
            <p class="text-gray-500 text-sm font-medium">No issues reported yet.</p>
          </div>
        } @else {
          <div class="p-4 space-y-2">
            @for (sub of subjects(); track sub.subjectId) {
              <button
                class="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md active:bg-gray-50 transition-all flex items-center justify-between"
                (click)="selectSubject(sub)"
              >
                <div>
                  <p class="text-sm font-semibold text-gray-800">{{ sub.subjectName }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ sub.totalFlagged }} flagged question{{ sub.totalFlagged !== 1 ? 's' : '' }}</p>
                </div>
                @if (sub.totalFlagged > 0) {
                  <span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {{ sub.totalFlagged }}
                  </span>
                }
              </button>
            }
          </div>
        }
      }

      <!-- ─── CHAPTERS VIEW ─── -->
      @if (view() === 'chapters') {
        @if (loadingChapters()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else {
          <div class="divide-y divide-gray-100">
            @for (ch of subjectSummary()!.chapters; track ch.chapterId) {
              <button
                class="w-full text-left px-4 py-4 bg-white hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between"
                [class.opacity-50]="ch.flaggedCount === 0"
                (click)="selectChapter(ch.chapterId, ch.title)"
              >
                <div>
                  <p class="text-sm font-semibold text-gray-800">Ch {{ ch.chapterNumber }}. {{ ch.title }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ ch.flaggedCount === 0 ? 'No issues' : ch.flaggedCount + ' flagged' }}
                  </p>
                </div>
                @if (ch.flaggedCount > 0) {
                  <span class="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {{ ch.flaggedCount }}
                  </span>
                }
              </button>
            }
          </div>
        }
      }

      <!-- ─── QUESTIONS VIEW ─── -->
      @if (view() === 'questions') {
        @if (loadingQuestions()) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (chapterReports()?.reports?.length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-3">
            <span class="text-4xl">✅</span>
            <p class="text-gray-500 text-sm font-medium">No issues reported in this chapter.</p>
          </div>
        } @else {
          <!-- Export button -->
          <div class="px-4 pt-4 pb-2 flex justify-end">
            <button
              class="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white text-xs font-semibold rounded-full active:opacity-80"
              (click)="exportJson()"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Export JSON
            </button>
          </div>

          <div class="px-4 pb-6 space-y-3">
            @for (report of chapterReports()!.reports; track report.reportId) {
              <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2">
                <!-- Question number + text -->
                <div class="flex items-start gap-2">
                  <span class="flex-shrink-0 text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-2 py-1 mt-0.5">
                    Q{{ report.questionNumber }}
                  </span>
                  <p class="text-sm text-gray-700 leading-snug">{{ truncate(report.questionText, 120) }}</p>
                </div>

                <!-- Issue chips -->
                <div class="flex flex-wrap gap-1.5">
                  @for (issue of report.issues; track issue) {
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full {{ issueColor(issue) }}">
                      {{ issueLabel(issue) }}
                    </span>
                  }
                </div>

                <!-- Notes -->
                @if (report.notes) {
                  <p class="text-xs text-gray-500 italic border-l-2 border-gray-200 pl-2">{{ report.notes }}</p>
                }

                <!-- Updated -->
                <p class="text-xs text-gray-300">Reported {{ formatDate(report.updatedAt) }}</p>
              </div>
            }
          </div>
        }
      }

    </div>
  `,
})
export default class AdminReportsPage implements OnInit {
  private reportService = inject(QuestionReportService);

  protected view = signal<AdminView>('subjects');
  protected subjects = signal<SubjectReportIndexDto[]>([]);
  protected loadingSubjects = signal(false);

  protected selectedSubjectId = signal<string>('');
  protected subjectSummary = signal<SubjectReportSummaryDto | null>(null);
  protected loadingChapters = signal(false);

  protected selectedChapterId = signal<string>('');
  protected selectedChapterTitle = signal<string>('');
  protected chapterReports = signal<ChapterReportsDto | null>(null);
  protected loadingQuestions = signal(false);

  protected breadcrumb = computed(() => {
    if (this.view() === 'subjects') return 'All subjects';
    if (this.view() === 'chapters') return this.subjectSummary()?.subjectName ?? '';
    return this.selectedChapterTitle();
  });

  ngOnInit(): void {
    this.loadSubjects();
  }

  private loadSubjects(): void {
    this.loadingSubjects.set(true);
    this.reportService.getAllSubjectReports().subscribe({
      next: (data) => { this.subjects.set(data); this.loadingSubjects.set(false); },
      error: () => this.loadingSubjects.set(false),
    });
  }

  protected selectSubject(sub: SubjectReportIndexDto): void {
    this.selectedSubjectId.set(sub.subjectId);
    this.view.set('chapters');
    this.loadingChapters.set(true);
    this.reportService.getSubjectReports(sub.subjectId).subscribe({
      next: (data) => { this.subjectSummary.set(data); this.loadingChapters.set(false); },
      error: () => this.loadingChapters.set(false),
    });
  }

  protected selectChapter(chapterId: string, title: string): void {
    this.selectedChapterId.set(chapterId);
    this.selectedChapterTitle.set(title);
    this.view.set('questions');
    this.loadingQuestions.set(true);
    this.reportService.getChapterReports(chapterId).subscribe({
      next: (data) => { this.chapterReports.set(data); this.loadingQuestions.set(false); },
      error: () => this.loadingQuestions.set(false),
    });
  }

  protected goBack(): void {
    if (this.view() === 'questions') {
      this.view.set('chapters');
    } else if (this.view() === 'chapters') {
      this.view.set('subjects');
    }
  }

  protected exportJson(): void {
    const data = this.chapterReports();
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qa-report-${data.chapterTitle.replace(/\s+/g, '_').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected issueLabel(issue: QuestionIssue): string {
    return ISSUE_CONFIG[issue]?.label ?? issue;
  }

  protected issueColor(issue: QuestionIssue): string {
    return ISSUE_CONFIG[issue]?.color ?? 'bg-gray-100 text-gray-600';
  }

  protected truncate(text: string, len: number): string {
    return text.length > len ? text.slice(0, len) + '…' : text;
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
