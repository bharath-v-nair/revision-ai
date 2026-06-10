import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import { SubjectDto } from '../../questions/question.models';

// NEET PG standard: ~63s per question; round to nearest 5 min
function suggestMinutes(questionCount: number): number {
  return Math.max(5, Math.min(210, Math.round(questionCount * 1.05 / 5) * 5));
}

@Component({
  selector: 'app-mock-builder',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-4 flex-shrink-0">
        <h1 class="text-xl font-bold text-gray-800">Build Your Mock</h1>
        <p class="text-sm text-gray-500 mt-0.5">Customise your practice test</p>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        <!-- Subjects -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Subjects <span class="text-red-400">*</span>
          </label>
          @if (subjects().length === 0) {
            <div class="flex flex-wrap gap-2">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="h-8 w-24 rounded-full bg-gray-200 animate-pulse"></div>
              }
            </div>
          } @else {
            <div class="flex flex-wrap gap-2">
              @for (subj of subjects(); track subj.id) {
                <button
                  class="px-4 py-1.5 rounded-full text-sm font-medium transition-all border-2"
                  [class]="isSelected(subj.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'"
                  (click)="toggleSubject(subj.id)"
                >
                  {{ subj.name }}
                </button>
              }
            </div>
          }
          @if (selectedSubjectIds().size === 0 && subjects().length > 0) {
            <p class="text-xs text-red-400 mt-1.5">Select at least one subject</p>
          }
        </div>

        <!-- Question Count -->
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">
            Question Count: <span class="text-primary font-bold text-base">{{ questionCount() }}</span>
          </label>
          <input
            type="range"
            min="5" max="100" step="5"
            [value]="questionCount()"
            (input)="questionCount.set(+$any($event.target).value)"
            class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div class="flex justify-between text-xs text-gray-400 mt-1">
            <span>5</span>
            <span>100</span>
          </div>
        </div>

        <!-- Time Limit -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-semibold text-gray-700">
              Time Limit
              @if (hasTimeLimit()) {
                — <span class="text-primary font-bold">{{ timeLimitMinutes() }} min</span>
              } @else {
                <span class="text-gray-400 font-normal"> — No limit</span>
              }
            </label>
            <button
              class="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors"
              [class]="hasTimeLimit()
                ? 'border-gray-200 text-gray-500 hover:bg-gray-50'
                : 'border-primary/30 text-primary bg-primary/5 hover:bg-primary/10'"
              (click)="toggleTimeLimit()"
            >
              {{ hasTimeLimit() ? '✕ Remove' : '+ Add limit' }}
            </button>
          </div>

          @if (hasTimeLimit()) {
            <div class="space-y-1">
              <input
                type="range"
                min="5" max="210" step="5"
                [value]="timeLimitMinutes()"
                (input)="timeLimitMinutes.set(+$any($event.target).value)"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-400">5 min</span>
                <button
                  class="text-primary font-medium hover:underline"
                  (click)="applySuggestedTime()"
                >Suggest {{ suggestedMinutes() }} min ↗</button>
                <span class="text-gray-400">3h 30m</span>
              </div>
            </div>
          }
        </div>

        <!-- Start button -->
        <button
          class="w-full py-4 rounded-2xl font-semibold text-sm transition-all"
          [class]="canSubmit() && !isLoading()
            ? 'bg-primary text-white active:opacity-90 shadow-md'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'"
          [disabled]="!canSubmit() || isLoading()"
          (click)="startMock()"
        >
          @if (isLoading()) { Starting Mock… } @else { Start Mock }
        </button>

        <!-- History link -->
        <p class="text-center text-sm">
          <a routerLink="/mock/history" class="text-primary font-medium">View history →</a>
        </p>

      </div>
    </div>
  `,
})
export default class MockBuilderPage implements OnInit {
  private service = inject(QuestionService);
  private router = inject(Router);

  protected subjects = signal<SubjectDto[]>([]);
  protected selectedSubjectIds = signal<Set<string>>(new Set());
  protected questionCount = signal(20);
  protected timeLimitMinutes = signal<number>(suggestMinutes(20));
  protected hasTimeLimit = signal(false);
  protected isLoading = signal(false);

  protected readonly suggestedMinutes = computed(() => suggestMinutes(this.questionCount()));

  protected readonly canSubmit = computed(() =>
    this.selectedSubjectIds().size > 0 &&
    this.questionCount() >= 5 &&
    this.questionCount() <= 100,
  );

  ngOnInit(): void {
    this.service.getSubjects().subscribe({
      next: (res) => this.subjects.set(res.data),
    });
  }

  protected isSelected(id: string): boolean {
    return this.selectedSubjectIds().has(id);
  }

  protected toggleSubject(id: string): void {
    this.selectedSubjectIds.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected toggleTimeLimit(): void {
    this.hasTimeLimit.update(v => !v);
    if (!this.hasTimeLimit()) return;
    // Apply suggestion when enabling time limit
    this.timeLimitMinutes.set(this.suggestedMinutes());
  }

  protected applySuggestedTime(): void {
    this.timeLimitMinutes.set(this.suggestedMinutes());
  }

  protected startMock(): void {
    if (!this.canSubmit() || this.isLoading()) return;
    this.isLoading.set(true);
    this.service
      .generateMock(
        Array.from(this.selectedSubjectIds()),
        this.questionCount(),
        this.hasTimeLimit() ? this.timeLimitMinutes() : undefined,
      )
      .subscribe({
        next: (res) => this.router.navigate(['/mock', res.mockSessionId]),
        error: () => this.isLoading.set(false),
      });
  }
}
