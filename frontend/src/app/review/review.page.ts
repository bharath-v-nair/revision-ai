import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { QuestionService } from '../questions/question.service';
import { QuestionCardComponent } from '../shared/question/question-card/question-card.component';
import { ReviewStore } from '../store/review.store';
import { AnswerResult } from '../questions/question.models';
import { SrReviewResult } from './review.models';

@Component({
  selector: 'app-review',
  imports: [RouterLink, QuestionCardComponent],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header: title + stats + progress -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex-shrink-0">
        <h1 class="text-xl font-bold text-gray-800 mb-2">Daily Review</h1>

        @if (reviewStore.stats(); as stats) {
          <div class="flex items-center gap-3 text-sm text-gray-500 mb-2 flex-wrap">
            <span><strong class="text-gray-800">{{ stats.dueToday }}</strong> due today</span>
            <span class="text-gray-300">·</span>
            <span><strong class="text-gray-800">{{ stats.totalScheduled }}</strong> scheduled</span>
            <span class="text-gray-300">·</span>
            <span>Avg EF: <strong class="text-gray-800">{{ stats.averageEaseFactor.toFixed(2) }}</strong></span>
          </div>
        }

        @if (reviewStore.dueQuestions().length > 0) {
          <div>
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>{{ reviewStore.reviewedCount() }} / {{ reviewStore.dueQuestions().length }} reviewed</span>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary rounded-full transition-all duration-500"
                [style.width.%]="progressPct()"
              ></div>
            </div>
          </div>
        }
      </div>

      <!-- Body -->
      @if (reviewStore.isLoading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading your review queue…</p>
        </div>

      } @else if (isComplete()) {
        <!-- Session complete -->
        <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <span class="text-6xl">🏆</span>
          <h2 class="text-2xl font-bold text-gray-800">Session complete!</h2>
          <div class="space-y-1 text-base text-gray-600">
            <p>Reviewed: <strong class="text-gray-800">{{ reviewStore.reviewedCount() }}</strong></p>
            <p>Correct: <strong class="text-gray-800">{{ reviewStore.correctCount() }}</strong></p>
            <p>Accuracy: <strong class="text-gray-800">{{ accuracy() }}%</strong></p>
          </div>
          <button
            routerLink="/dashboard"
            class="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm active:opacity-90"
          >Back to Dashboard</button>
        </div>

      } @else if (isEmpty()) {
        <!-- All caught up -->
        <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <span class="text-6xl">🎉</span>
          <h2 class="text-2xl font-bold text-gray-800">All caught up!</h2>
          <p class="text-gray-500 text-sm">No reviews due today. Come back tomorrow.</p>
          <button
            routerLink="/dashboard"
            class="mt-4 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm active:opacity-90"
          >Back to Dashboard</button>
        </div>

      } @else if (currentQuestion()) {
        <!-- Question card + SM-2 overlay -->
        <div class="flex-1 relative overflow-hidden">
          <app-question-card
            [question]="currentQuestion()!.question"
            [mode]="'review'"
            [pendingQuestionId]="currentQuestion()!.questionScheduleId"
            [questionIndex]="reviewStore.currentIndex()"
            [totalQuestions]="reviewStore.dueQuestions().length"
            [reviewSubmitFn]="currentReviewSubmitFn()"
            (answered)="onAnswered($event)"
            (skipped)="onSkipped()"
          />

          <!-- SM-2 outcome overlay (shown after answer submitted) -->
          @if (srReviewResult()) {
            <div class="absolute bottom-[76px] left-4 right-4 bg-white/95 rounded-2xl shadow-md border border-gray-200 px-4 py-3 z-10 pointer-events-none">
              @if (srReviewResult()!.isCorrect) {
                <p class="text-sm font-semibold text-green-700">
                  Next review in {{ srReviewResult()!.newInterval }} days 📅
                </p>
              } @else {
                <p class="text-sm font-semibold text-orange-600">
                  Review again soon — interval reset
                </p>
              }
            </div>
          }
        </div>
      }

    </div>
  `,
})
export default class ReviewPage implements OnInit, OnDestroy {
  protected reviewStore = inject(ReviewStore);
  private service = inject(QuestionService);

  protected srReviewResult = signal<SrReviewResult | null>(null);
  private cardStartTime = Date.now();
  private autoAdvanceTimer?: ReturnType<typeof setTimeout>;

  protected readonly currentQuestion = computed(() => {
    const idx = this.reviewStore.currentIndex();
    return this.reviewStore.dueQuestions()[idx] ?? null;
  });

  protected readonly isComplete = computed(() => {
    const qs = this.reviewStore.dueQuestions();
    return !this.reviewStore.isLoading() && qs.length > 0 && this.reviewStore.currentIndex() >= qs.length;
  });

  protected readonly isEmpty = computed(() => {
    return !this.reviewStore.isLoading() && this.reviewStore.dueQuestions().length === 0;
  });

  protected readonly progressPct = computed(() => {
    const total = this.reviewStore.dueQuestions().length;
    return total ? (this.reviewStore.reviewedCount() / total) * 100 : 0;
  });

  protected readonly accuracy = computed(() => {
    const r = this.reviewStore.reviewedCount();
    return r ? Math.round((this.reviewStore.correctCount() / r) * 100) : 0;
  });

  // Rebuild the submit function whenever the current question changes
  protected readonly currentReviewSubmitFn = computed(() => {
    const q = this.currentQuestion();
    if (!q) return null;
    const questionId = q.question.id;
    return (selectedOption: string): Observable<AnswerResult> => {
      const timeTakenMs = Date.now() - this.cardStartTime;
      return this.service.submitSrReview(questionId, selectedOption, timeTakenMs).pipe(
        tap(result => {
          this.srReviewResult.set(result);
          this.reviewStore.recordResult(result.isCorrect);
          clearTimeout(this.autoAdvanceTimer);
          this.autoAdvanceTimer = setTimeout(() => this.advanceReview(), 2500);
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
    // Reset start time and clear SR result whenever the question changes
    effect(() => {
      const _idx = this.reviewStore.currentIndex();
      this.cardStartTime = Date.now();
      this.srReviewResult.set(null);
    });
  }

  ngOnInit(): void {
    this.reviewStore.load();
  }

  ngOnDestroy(): void {
    clearTimeout(this.autoAdvanceTimer);
  }

  protected onAnswered(_event: { selectedOption: string; result: AnswerResult }): void {
    this.advanceReview();
  }

  protected onSkipped(): void {
    this.advanceReview();
  }

  private advanceReview(): void {
    clearTimeout(this.autoAdvanceTimer);
    this.reviewStore.advance();
  }
}
