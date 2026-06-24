import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { QuestionService } from '../../questions/question.service';
import { QuestionCardComponent } from '../../shared/question/question-card/question-card.component';
import { AnswerResult, QuestionDetailDto } from '../../questions/question.models';
import { PyqService } from '../pyq.service';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

@Component({
  selector: 'app-pyq-mock',
  imports: [QuestionCardComponent],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      @if (isLoading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading paper…</p>
        </div>

      } @else if (isComplete()) {
        <!-- Summary -->
        <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <span class="text-6xl">🏆</span>
          <h2 class="text-2xl font-bold text-gray-800">{{ examName() }} complete!</h2>
          <div class="space-y-1 text-base text-gray-600">
            <p>Score: <strong class="text-gray-800">{{ correctCount() }} / {{ questions().length }}</strong></p>
            <p>Accuracy: <strong class="text-gray-800">{{ accuracy() }}%</strong></p>
            <p>Time taken: <strong class="text-gray-800">{{ timeTakenDisplay() }}</strong></p>
          </div>
          <button
            class="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm active:opacity-90"
            (click)="backToPapers()"
          >Back to Papers</button>
        </div>

      } @else if (questions().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span class="text-5xl">🗂️</span>
          <h2 class="text-lg font-bold text-gray-800">No questions found</h2>
          <button
            class="mt-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm active:opacity-90"
            (click)="backToPapers()"
          >Back to Papers</button>
        </div>

      } @else if (currentQuestion()) {

        <!-- Header: progress -->
        <div class="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
          <div class="flex items-center justify-between mb-2">
            <button
              class="text-sm text-gray-500 font-medium px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              (click)="backToPapers()"
            >← Quit</button>
            <span class="text-sm font-semibold text-gray-700">{{ examName() }}</span>
            <span class="text-sm font-semibold text-gray-700">
              Q{{ currentIndex() + 1 }}/{{ questions().length }}
            </span>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-500"
              [style.width.%]="progressPct()"
            ></div>
          </div>
        </div>

        <!-- Question card -->
        <div class="flex-1 relative overflow-hidden">
          <app-question-card
            [question]="currentQuestion()!"
            [mode]="'review'"
            [pendingQuestionId]="currentQuestion()!.id"
            [questionIndex]="currentIndex()"
            [totalQuestions]="questions().length"
            [reviewSubmitFn]="currentReviewSubmitFn()"
            (answered)="advance()"
            (skipped)="advance()"
          />
        </div>

      }

    </div>
  `,
})
export default class PyqMockPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pyqService = inject(PyqService);
  private questionService = inject(QuestionService);

  protected isLoading = signal(true);
  protected questions = signal<QuestionDetailDto[]>([]);
  protected currentIndex = signal(0);
  protected reviewedCount = signal(0);
  protected correctCount = signal(0);
  protected examName = signal('');

  private subjectSlug = '';
  private cardStartTime = Date.now();
  private mockStartTime = Date.now();
  private elapsedSeconds = signal(0);
  private autoAdvanceTimer?: ReturnType<typeof setTimeout>;

  protected readonly currentQuestion = computed(() =>
    this.questions()[this.currentIndex()] ?? null,
  );

  protected readonly isComplete = computed(() => {
    const qs = this.questions();
    return !this.isLoading() && qs.length > 0 && this.currentIndex() >= qs.length;
  });

  protected readonly progressPct = computed(() => {
    const total = this.questions().length;
    return total ? (this.reviewedCount() / total) * 100 : 0;
  });

  protected readonly accuracy = computed(() => {
    const r = this.reviewedCount();
    return r ? Math.round((this.correctCount() / r) * 100) : 0;
  });

  protected readonly timeTakenDisplay = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    return `${pad(m)}:${pad(s % 60)}`;
  });

  // Rebuild the submit function whenever the current question changes.
  protected readonly currentReviewSubmitFn = computed(() => {
    const q = this.currentQuestion();
    if (!q) return null;
    const questionId = q.id;
    return (selectedOption: string): Observable<AnswerResult> => {
      const timeTakenMs = Date.now() - this.cardStartTime;
      // Feeds answers into the spaced repetition system (same endpoint as regular mocks).
      return this.questionService.submitSrReview(questionId, selectedOption, timeTakenMs).pipe(
        tap(result => {
          this.reviewedCount.update(c => c + 1);
          if (result.isCorrect) this.correctCount.update(c => c + 1);
          clearTimeout(this.autoAdvanceTimer);
          this.autoAdvanceTimer = setTimeout(() => this.advance(), 2500);
        }),
        map(r => ({
          isCorrect: r.isCorrect,
          correctOption: r.correctOption,
          explanation: r.explanation,
        } as AnswerResult)),
      );
    };
  });

  constructor() {
    // Reset the per-card timer whenever the question changes.
    effect(() => {
      this.currentIndex();
      this.cardStartTime = Date.now();
    });
  }

  ngOnInit(): void {
    this.subjectSlug = this.route.snapshot.paramMap.get('subjectSlug') ?? '';
    const examName = this.route.snapshot.paramMap.get('examName') ?? '';
    this.examName.set(examName);
    this.mockStartTime = Date.now();

    this.pyqService.getPaperQuestions(examName).subscribe({
      next: (res) => {
        this.examName.set(res.examName);
        this.questions.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.autoAdvanceTimer);
  }

  protected advance(): void {
    clearTimeout(this.autoAdvanceTimer);
    const next = this.currentIndex() + 1;
    if (next >= this.questions().length) {
      this.elapsedSeconds.set(Math.round((Date.now() - this.mockStartTime) / 1000));
    }
    this.currentIndex.set(next);
  }

  protected backToPapers(): void {
    clearTimeout(this.autoAdvanceTimer);
    this.router.navigate(['/pyqs', this.subjectSlug]);
  }
}
