import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import { MockStore } from '../../store/mock.store';
import { MockAnswerDto, MockQuestionDto } from '../mock.models';
import { QuestionWithoutAnswersDto } from '../../questions/question.models';
import { QuestionCardComponent } from '../../shared/question/question-card/question-card.component';
import { QuestionReportSheetComponent } from '../../shared/question/question-report/question-report-sheet.component';

function adaptMockQuestion(q: MockQuestionDto): QuestionWithoutAnswersDto {
  return {
    id: q.questionId,
    questionNumber: q.displayOrder,
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    hasMedia: q.hasMedia,
    sourcePage: 0,
    subjectName: null,
    chapterTitle: null,
  };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

@Component({
  selector: 'app-mock-taker',
  imports: [QuestionCardComponent, QuestionReportSheetComponent],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      @if (mockStore.isLoading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading mock…</p>
        </div>
      } @else if (mockStore.questions().length > 0) {

        <!-- Header -->
        <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button
            class="text-sm text-gray-500 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 active:bg-gray-200"
            (click)="showQuitDialog.set(true)"
          >← Quit</button>
          <span class="text-sm font-semibold text-gray-700">
            Q{{ mockStore.currentQuestionIndex() + 1 }}/{{ mockStore.questions().length }}
          </span>
          <div
            class="flex items-center gap-1 font-mono text-sm font-semibold"
            [class.text-red-500]="isCountdown() && mockStore.timer() < 60"
            [class.text-gray-600]="!isCountdown() || mockStore.timer() >= 60"
          >
            {{ timerDisplay() }} ⏱
          </div>
        </div>

        <!-- Question dots -->
        <div class="bg-white border-b border-gray-100 px-3 py-2 flex-shrink-0 overflow-x-auto">
          <div class="flex gap-1.5 w-max">
            @for (q of mockStore.questions(); track q.questionId; let i = $index) {
              <button
                class="w-5 h-5 rounded-full flex-shrink-0 border-2 transition-all"
                [class]="dotClass(q.questionId, i)"
                (click)="goToQuestion(i)"
                [title]="'Question ' + (i + 1)"
              ></button>
            }
          </div>
        </div>

        <!-- Question card -->
        <div class="flex-1 relative overflow-hidden">
          @if (adaptedQuestion()) {
            <app-question-card
              [question]="adaptedQuestion()!"
              [mode]="'mock'"
              [pendingQuestionId]="currentQuestion()!.questionId"
              [questionIndex]="mockStore.currentQuestionIndex()"
              [totalQuestions]="mockStore.questions().length"
              [initialSelectedOption]="currentInitialSelection()"
              (mockAnswered)="onMockAnswered($event)"
              (reportTap)="openReportSheet()"
            />
          }
        </div>

        <!-- Navigation + Submit -->
        <div class="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0 space-y-2">
          <div class="flex gap-3">
            <button
              class="flex-1 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors"
              [class]="mockStore.currentQuestionIndex() === 0
                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100'"
              [disabled]="mockStore.currentQuestionIndex() === 0"
              (click)="prev()"
            >← Prev</button>
            <button
              class="flex-1 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors"
              [class]="mockStore.currentQuestionIndex() === mockStore.questions().length - 1
                ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 active:bg-gray-100'"
              [disabled]="mockStore.currentQuestionIndex() === mockStore.questions().length - 1"
              (click)="next()"
            >Next →</button>
          </div>
          <button
            class="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all"
            [class]="isSubmitting() ? 'bg-primary/50 text-white cursor-wait' : 'bg-primary text-white active:bg-primary/90 shadow-md'"
            [disabled]="isSubmitting()"
            (click)="showSubmitDialog.set(true)"
          >
            @if (isSubmitting()) { Submitting… } @else { Submit Mock }
          </button>
        </div>

      }

      <!-- Quit confirmation dialog -->
      @if (showQuitDialog()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" (click)="showQuitDialog.set(false)">
          <div class="bg-white rounded-t-3xl p-6 w-full max-w-[480px]" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold text-gray-800 mb-2">Quit this mock?</h3>
            <p class="text-sm text-gray-500 mb-6">Your progress will be lost.</p>
            <div class="flex gap-3">
              <button
                class="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600"
                (click)="showQuitDialog.set(false)"
              >Keep Going</button>
              <button
                class="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold text-sm"
                (click)="confirmQuit()"
              >Quit</button>
            </div>
          </div>
        </div>
      }

      <!-- Report issue sheet -->
      @if (reportSheetOpen() && currentQuestion()) {
        <app-question-report-sheet
          [questionId]="currentQuestion()!.questionId"
          [questionNumber]="mockStore.currentQuestionIndex() + 1"
          (dismissed)="reportSheetOpen.set(false)"
          (submitted)="reportSheetOpen.set(false)"
          (cleared)="reportSheetOpen.set(false)"
        />
      }

      <!-- Submit confirmation dialog -->
      @if (showSubmitDialog()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" (click)="showSubmitDialog.set(false)">
          <div class="bg-white rounded-t-3xl p-6 w-full max-w-[480px]" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-bold text-gray-800 mb-2">Submit Mock?</h3>
            @if (unansweredCount() > 0) {
              <p class="text-sm text-gray-500 mb-6">
                You have <strong class="text-gray-700">{{ unansweredCount() }}</strong>
                unanswered question{{ unansweredCount() > 1 ? 's' : '' }}. Submit anyway?
              </p>
            } @else {
              <p class="text-sm text-gray-500 mb-6">
                All {{ mockStore.questions().length }} questions answered. Ready to submit?
              </p>
            }
            <div class="flex gap-3">
              <button
                class="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600"
                (click)="showSubmitDialog.set(false)"
              >Cancel</button>
              <button
                class="flex-1 py-3 rounded-2xl bg-primary text-white font-semibold text-sm"
                (click)="submitMock()"
              >Submit</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class MockTakerPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(QuestionService);
  protected mockStore = inject(MockStore);

  protected showQuitDialog = signal(false);
  protected showSubmitDialog = signal(false);
  protected isSubmitting = signal(false);
  protected reportSheetOpen = signal(false);

  private mockSessionId = '';
  private timerInterval?: ReturnType<typeof setInterval>;
  private questionStartTime = Date.now();

  protected readonly currentQuestion = computed(() =>
    this.mockStore.questions()[this.mockStore.currentQuestionIndex()] ?? null,
  );

  protected readonly adaptedQuestion = computed(() => {
    const q = this.currentQuestion();
    return q ? adaptMockQuestion(q) : null;
  });

  protected readonly currentInitialSelection = computed(() => {
    const q = this.currentQuestion();
    return q ? (this.mockStore.answers()[q.questionId]?.selectedOption ?? null) : null;
  });

  protected readonly answeredCount = computed(() =>
    Object.keys(this.mockStore.answers()).length,
  );

  protected readonly unansweredCount = computed(() =>
    this.mockStore.questions().length - this.answeredCount(),
  );

  protected readonly isCountdown = computed(() =>
    (this.mockStore.currentSession()?.timeLimitMinutes ?? 0) > 0,
  );

  protected readonly timerDisplay = computed(() => {
    const t = this.mockStore.timer();
    return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
  });

  ngOnInit(): void {
    this.mockSessionId = this.route.snapshot.paramMap.get('id')!;
    this.mockStore.setLoading(true);
    this.service.getMockSession(this.mockSessionId).subscribe({
      next: (session) => {
        if (session.isCompleted) {
          this.router.navigate(['/mock', this.mockSessionId, 'results']);
          return;
        }
        this.mockStore.setSession(session);
        this.startTimer();
        this.questionStartTime = Date.now();
      },
      error: () => this.router.navigate(['/mock']),
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerInterval);
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.isCountdown()) {
        this.mockStore.tickCountdown();
        if (this.mockStore.timer() === 0) {
          clearInterval(this.timerInterval);
          this.autoSubmit();
        }
      } else {
        this.mockStore.tickTimer();
      }
    }, 1000);
  }

  protected dotClass(questionId: string, index: number): string {
    const isCurrent = index === this.mockStore.currentQuestionIndex();
    const isAnswered = !!this.mockStore.answers()[questionId];
    if (isCurrent) return 'border-indigo-500 bg-indigo-500 ring-2 ring-indigo-300 ring-offset-1';
    if (isAnswered) return 'border-primary bg-primary';
    return 'border-gray-300 bg-white';
  }

  protected openReportSheet(): void {
    this.reportSheetOpen.set(true);
  }

  protected onMockAnswered(event: { questionId: string; selectedOption: string }): void {
    if (!event.selectedOption) {
      this.mockStore.removeAnswer(event.questionId);
    } else {
      const timeTakenMs = Date.now() - this.questionStartTime;
      this.mockStore.recordAnswer(event.questionId, event.selectedOption, timeTakenMs);
    }
  }

  protected goToQuestion(index: number): void {
    this.questionStartTime = Date.now();
    this.mockStore.setCurrentIndex(index);
  }

  protected prev(): void {
    const idx = this.mockStore.currentQuestionIndex();
    if (idx > 0) this.goToQuestion(idx - 1);
  }

  protected next(): void {
    const idx = this.mockStore.currentQuestionIndex();
    if (idx < this.mockStore.questions().length - 1) this.goToQuestion(idx + 1);
  }

  protected confirmQuit(): void {
    clearInterval(this.timerInterval);
    this.mockStore.reset();
    this.router.navigate(['/mock']);
  }

  protected submitMock(): void {
    this.showSubmitDialog.set(false);
    this.isSubmitting.set(true);
    const answers = this.buildAnswers();
    this.service.submitMockAnswers(this.mockSessionId, answers).subscribe({
      next: () => {
        this.service.completeMock(this.mockSessionId).subscribe({
          next: () => {
            clearInterval(this.timerInterval);
            this.mockStore.reset();
            this.router.navigate(['/mock', this.mockSessionId, 'results']);
          },
          error: () => this.isSubmitting.set(false),
        });
      },
      error: () => this.isSubmitting.set(false),
    });
  }

  private autoSubmit(): void {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    const answers = this.buildAnswers();
    this.service.submitMockAnswers(this.mockSessionId, answers).subscribe({
      next: () => {
        this.service.completeMock(this.mockSessionId).subscribe({
          next: () => {
            this.mockStore.reset();
            this.router.navigate(['/mock', this.mockSessionId, 'results']);
          },
        });
      },
    });
  }

  private buildAnswers(): MockAnswerDto[] {
    const answersMap = this.mockStore.answers();
    return this.mockStore
      .questions()
      .filter(q => answersMap[q.questionId])
      .map(q => ({
        questionId: q.questionId,
        displayOrder: q.displayOrder,
        selectedOption: answersMap[q.questionId].selectedOption,
        timeTakenMs: answersMap[q.questionId].timeTakenMs,
      }));
  }
}
