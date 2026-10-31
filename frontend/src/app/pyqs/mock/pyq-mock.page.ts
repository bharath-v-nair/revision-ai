import {
  Component,
  OnInit,
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

interface StoredAnswer {
  selectedOption: string;
  result: AnswerResult;
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
            <p>
              Accuracy: <strong class="text-gray-800">{{ accuracy() }}%</strong>
              <span class="text-sm text-gray-400">({{ correctCount() }} of {{ answeredCount() }} answered)</span>
            </p>
            @if (answeredCount() < questions().length) {
              <p class="text-sm text-amber-600">{{ questions().length - answeredCount() }} left unanswered</p>
            }
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

        <!-- Header: progress + navigation -->
        <div class="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
          <div class="flex items-center justify-between mb-2">
            <button
              class="text-sm text-gray-500 font-medium px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
              (click)="backToPapers()"
            >✕ Quit</button>
            <span class="text-sm font-semibold text-gray-700 truncate max-w-[40%] text-center">{{ examName() }}</span>
            <button
              class="text-sm font-semibold px-3 py-1 rounded-lg text-green-600 disabled:opacity-30 hover:bg-green-50 active:bg-green-100"
              [disabled]="answeredCount() === 0"
              (click)="finish()"
            >Finish</button>
          </div>
          <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary rounded-full transition-all duration-500"
              [style.width.%]="progressPct()"
            ></div>
          </div>
          <div class="flex items-center justify-between mt-1 text-xs text-gray-400">
            <span>Q{{ currentIndex() + 1 }} / {{ questions().length }}</span>
            <span>{{ answeredCount() }} / {{ questions().length }} answered</span>
          </div>
          <!-- Prev / Next navigation -->
          <div class="flex items-center justify-between mt-2">
            <button
              class="text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 active:bg-gray-100"
              [disabled]="currentIndex() === 0"
              (click)="goBack()"
            >← Prev</button>
            <button
              class="text-sm px-3 py-1 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-30 hover:bg-gray-50 active:bg-gray-100"
              [disabled]="currentIndex() >= questions().length - 1"
              (click)="goForward()"
            >Next →</button>
          </div>
        </div>

        <!-- Question card -->
        <div class="flex-1 relative overflow-hidden">
          <app-question-card
            [question]="currentQuestion()!"
            [mode]="'review'"
            [showSkip]="false"
            [pendingQuestionId]="currentQuestion()!.id"
            [questionIndex]="currentIndex()"
            [totalQuestions]="questions().length"
            [reviewSubmitFn]="currentReviewSubmitFn()"
            [initialSelectedOption]="currentStoredAnswer()?.selectedOption ?? null"
            [initialResult]="currentStoredAnswer()?.result ?? null"
            (answered)="advance()"
          />
        </div>

      }

    </div>
  `,
})
export default class PyqMockPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pyqService = inject(PyqService);
  private questionService = inject(QuestionService);

  protected isLoading = signal(true);
  protected questions = signal<QuestionDetailDto[]>([]);
  protected currentIndex = signal(0);
  protected examName = signal('');
  protected finished = signal(false);

  // questionId -> the answer the user committed. Recorded exactly once per question
  // so navigating back and forth never re-counts the score or re-awards XP.
  private answers = signal<Record<string, StoredAnswer>>({});

  private subjectSlug = '';
  private cardStartTime = Date.now();
  private mockStartTime = Date.now();
  private elapsedSeconds = signal(0);

  protected readonly currentQuestion = computed(() =>
    this.questions()[this.currentIndex()] ?? null,
  );

  protected readonly answeredCount = computed(() => Object.keys(this.answers()).length);

  protected readonly correctCount = computed(() =>
    Object.values(this.answers()).filter(a => a.result.isCorrect).length,
  );

  // The paper is "complete" only when the user explicitly finishes (or runs off the
  // end). Progress is measured by questions answered, not by navigation position.
  protected readonly isComplete = computed(() => this.finished());

  protected readonly progressPct = computed(() => {
    const total = this.questions().length;
    return total ? (this.answeredCount() / total) * 100 : 0;
  });

  protected readonly accuracy = computed(() => {
    const answered = this.answeredCount();
    return answered ? Math.round((this.correctCount() / answered) * 100) : 0;
  });

  protected readonly timeTakenDisplay = computed(() => {
    const s = this.elapsedSeconds();
    const m = Math.floor(s / 60);
    return `${pad(m)}:${pad(s % 60)}`;
  });

  // The stored answer for the current question (null until it's been answered).
  protected readonly currentStoredAnswer = computed(() => {
    const q = this.currentQuestion();
    return q ? this.answers()[q.id] ?? null : null;
  });

  // Rebuild the submit function whenever the current question changes.
  protected readonly currentReviewSubmitFn = computed(() => {
    const q = this.currentQuestion();
    if (!q) return null;
    const questionId = q.id;
    return (selectedOption: string): Observable<AnswerResult> => {
      const timeTakenMs = Date.now() - this.cardStartTime;
      // Feeds the answer into spaced repetition (grants XP server-side).
      return this.questionService.submitSrReview(questionId, selectedOption, timeTakenMs).pipe(
        tap(result => {
          // Record once per question — never overwrite, so score/XP count a single time.
          this.answers.update(m =>
            m[questionId] ? m : { ...m, [questionId]: { selectedOption, result } },
          );
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

    this.pyqService.getPaperQuestions(this.subjectSlug, examName).subscribe({
      next: (res) => {
        this.examName.set(res.examName);
        this.questions.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  // Fired when the user taps "Next Question →" on the card after answering.
  // Running off the end of the paper finishes it.
  protected advance(): void {
    const next = this.currentIndex() + 1;
    if (next >= this.questions().length) {
      this.finish();
      return;
    }
    this.currentIndex.set(next);
  }

  protected goBack(): void {
    if (this.currentIndex() > 0) this.currentIndex.update(i => i - 1);
  }

  protected goForward(): void {
    if (this.currentIndex() < this.questions().length - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  protected finish(): void {
    this.elapsedSeconds.set(Math.round((Date.now() - this.mockStartTime) / 1000));
    this.finished.set(true);
  }

  protected backToPapers(): void {
    this.router.navigate(['/pyqs', this.subjectSlug]);
  }
}
