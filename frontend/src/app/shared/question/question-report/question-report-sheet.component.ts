import {
  Component,
  input,
  output,
  OnInit,
  inject,
  signal,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { QuestionIssue, QuestionReportDto } from '../../../questions/question.models';
import { QuestionReportService } from './question-report.service';

interface IssueOption {
  key: QuestionIssue;
  label: string;
  color: string;
}

const ISSUE_OPTIONS: IssueOption[] = [
  { key: 'QuestionText',      label: 'Question text',        color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { key: 'QuestionMedia',     label: 'Question image(s)',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { key: 'CorrectOption',     label: 'Correct option',       color: 'bg-red-100 text-red-700 border-red-200' },
  { key: 'ExplanationText',   label: 'Explanation text',     color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'ExplanationImages', label: 'Explanation image(s)', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'ExplanationTables', label: 'Explanation table(s)', color: 'bg-teal-100 text-teal-700 border-teal-200' },
];

@Component({
  selector: 'app-question-report-sheet',
  imports: [FormsModule],
  template: `
    <!-- Backdrop — above detail sheet (z-50) -->
    <div class="fixed inset-0 bg-black/30 z-[60]" (click)="dismiss()"></div>

    <!-- Sheet — above detail sheet (z-50) -->
    <div
      #sheet
      class="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl flex flex-col"
      style="max-height: 80vh"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <!-- Header -->
      <div class="px-4 pb-3 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-sm font-bold text-gray-800">Report Issue</h2>
            <p class="text-xs text-gray-400 mt-0.5">Q{{ questionNumber() }} — select all that apply</p>
          </div>
          @if (loading()) {
            <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          }
        </div>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-3">

        <!-- Issue checkboxes -->
        <div class="space-y-2">
          @for (opt of issues; track opt.key) {
            <label
              class="flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all"
              [class]="selectedIssues().has(opt.key) ? opt.color : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'"
            >
              <input
                type="checkbox"
                class="sr-only"
                [checked]="selectedIssues().has(opt.key)"
                (change)="toggleIssue(opt.key)"
              />
              <div
                class="flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
                [class]="selectedIssues().has(opt.key) ? 'border-current bg-current' : 'border-gray-300'"
              >
                @if (selectedIssues().has(opt.key)) {
                  <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                  </svg>
                }
              </div>
              <span class="text-sm font-medium">{{ opt.label }}</span>
            </label>
          }
        </div>

        <!-- Notes textarea -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (optional)</label>
          <textarea
            class="w-full rounded-2xl border-2 border-gray-200 px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-primary transition-colors"
            rows="3"
            placeholder="e.g. Option B should be correct, image on page 42 is cut off…"
            [(ngModel)]="notes"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="px-4 pb-6 pt-3 flex-shrink-0 space-y-2 border-t border-gray-100">
        <button
          class="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all"
          [class]="canSubmit() ? 'bg-primary text-white shadow-sm active:opacity-80' : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
          [disabled]="!canSubmit() || submitting()"
          (click)="submit()"
        >
          {{ submitting() ? 'Saving…' : existingReport() ? 'Update Report' : 'Submit Report' }}
        </button>

        @if (existingReport()) {
          <button
            class="w-full py-2.5 text-sm font-medium text-red-500 active:text-red-700 transition-colors"
            [disabled]="submitting()"
            (click)="clear()"
          >
            Clear Report
          </button>
        }
      </div>
    </div>
  `,
})
export class QuestionReportSheetComponent implements OnInit, AfterViewInit {
  private reportService = inject(QuestionReportService);

  readonly questionId = input.required<string>();
  readonly questionNumber = input<number>(0);

  readonly dismissed = output<void>();
  readonly submitted = output<QuestionReportDto>();
  readonly cleared = output<void>();

  @ViewChild('sheet') sheetRef!: ElementRef<HTMLElement>;

  protected readonly issues = ISSUE_OPTIONS;
  protected selectedIssues = signal(new Set<QuestionIssue>());
  protected notes = '';
  protected loading = signal(false);
  protected submitting = signal(false);
  protected existingReport = signal<QuestionReportDto | null>(null);

  protected canSubmit = () => this.selectedIssues().size > 0;

  private touchStartY = 0;
  private currentY = 0;

  ngOnInit(): void {
    this.loading.set(true);
    this.reportService.getReport(this.questionId()).subscribe({
      next: (report) => {
        this.loading.set(false);
        if (report) {
          this.existingReport.set(report);
          this.selectedIssues.set(new Set(report.issues));
          this.notes = report.notes ?? '';
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngAfterViewInit(): void {
    gsap.from(this.sheetRef.nativeElement, {
      y: '100%',
      duration: 0.3,
      ease: 'power2.out',
    });
  }

  protected toggleIssue(key: QuestionIssue): void {
    this.selectedIssues.update(set => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected submit(): void {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    const issues = Array.from(this.selectedIssues()) as QuestionIssue[];
    this.reportService.upsertReport(this.questionId(), issues, this.notes || null).subscribe({
      next: (report) => {
        this.submitting.set(false);
        this.submitted.emit(report);
        this.animateDismiss();
      },
      error: () => this.submitting.set(false),
    });
  }

  protected clear(): void {
    this.submitting.set(true);
    this.reportService.clearReport(this.questionId()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cleared.emit();
        this.animateDismiss();
      },
      error: () => this.submitting.set(false),
    });
  }

  protected dismiss(): void {
    this.animateDismiss();
  }

  private animateDismiss(): void {
    gsap.to(this.sheetRef.nativeElement, {
      y: '100%',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => this.dismissed.emit(),
    });
  }

  protected onTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
    this.currentY = 0;
  }

  protected onTouchMove(e: TouchEvent): void {
    this.currentY = e.touches[0].clientY - this.touchStartY;
    if (this.currentY > 0) gsap.set(this.sheetRef.nativeElement, { y: this.currentY });
  }

  protected onTouchEnd(): void {
    if (this.currentY > 120) this.animateDismiss();
    else gsap.to(this.sheetRef.nativeElement, { y: 0, duration: 0.2, ease: 'power2.out' });
  }
}
