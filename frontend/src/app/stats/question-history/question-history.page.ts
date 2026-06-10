import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SkeletonLoaderComponent } from '../../shared/ui/skeleton-loader/skeleton-loader.component';
import { QuestionHistoryResponse, QuestionAttemptDto } from '../analytics.models';

const SESSION_BADGE: Record<string, { label: string; classes: string }> = {
  Hourly: { label: 'Hourly', classes: 'bg-blue-100 text-blue-700' },
  Mock: { label: 'Mock', classes: 'bg-purple-100 text-purple-700' },
  SpacedRepetition: { label: 'SR', classes: 'bg-green-100 text-green-700' },
};

@Component({
  selector: 'app-question-history',
  imports: [RouterLink, SkeletonLoaderComponent],
  template: `
    <div class="flex flex-col bg-gray-50 min-h-full">

      <!-- Back header -->
      <div class="bg-white px-4 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
        <a routerLink="/stats" class="text-sm text-gray-500 font-medium">← Back</a>
        <h1 class="text-base font-bold text-gray-900">Question History</h1>
      </div>

      @if (isLoading()) {
        <div class="px-4 mt-4 space-y-4">
          <app-skeleton-loader type="card" [lines]="3" />
          <app-skeleton-loader type="card" [lines]="2" />
        </div>

      } @else if (error()) {
        <div class="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
          <span class="text-4xl">⚠️</span>
          <p class="text-sm text-gray-500">Could not load history. Check your connection.</p>
          <a routerLink="/stats" class="text-sm text-primary font-semibold">← Back to Stats</a>
        </div>

      } @else if (history()) {
        <!-- Question text -->
        <div class="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm font-medium text-gray-800 leading-relaxed">
            {{ history()!.questionText }}
          </p>

          <!-- SR state (if scheduled) -->
          @if (history()!.currentEaseFactor > 0) {
            <div class="mt-3 pt-3 border-t border-gray-100">
              <p class="text-xs text-gray-500">
                Spaced Repetition: EF {{ history()!.currentEaseFactor.toFixed(2) }}
                · Next in {{ history()!.currentInterval }} days
              </p>
            </div>
          }
        </div>

        <!-- Attempts summary -->
        @if (history()!.attempts.length > 0) {
          <div class="mx-4 mt-4">
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-sm font-semibold text-gray-500">
                {{ history()!.attempts.length }} attempt{{ history()!.attempts.length === 1 ? '' : 's' }}
              </h2>
              <span class="text-sm font-semibold text-gray-700">
                Accuracy: {{ accuracySummary() }}
              </span>
            </div>

            <!-- Attempt cards -->
            <div class="space-y-3">
              @for (attempt of history()!.attempts; track $index) {
                <div
                  class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
                  [class.border-l-4]="true"
                  [class.border-l-green-400]="attempt.isCorrect"
                  [class.border-l-red-400]="!attempt.isCorrect"
                >
                  <!-- Top row: attempt number, badge, date -->
                  <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-gray-700">Attempt {{ $index + 1 }}</span>
                      <span
                        class="text-xs font-semibold px-2 py-0.5 rounded-full"
                        [class]="sessionBadgeClasses(attempt.sessionType)"
                      >{{ sessionBadgeLabel(attempt.sessionType) }}</span>
                    </div>
                    <span class="text-xs text-gray-400">{{ formatDate(attempt.createdAt) }}</span>
                  </div>

                  <!-- Bottom row: selected option, time -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm">
                      @if (attempt.isCorrect) {
                        <span class="font-semibold text-green-700">
                          Selected: {{ attempt.selectedOption }} ✅
                        </span>
                      } @else {
                        <span class="font-semibold text-red-600">
                          Selected: {{ attempt.selectedOption }} ❌
                        </span>
                      }
                    </div>
                    <span class="text-xs text-gray-400">
                      {{ formatTime(attempt.timeTakenMs) }}
                    </span>
                  </div>
                </div>
              }
            </div>
          </div>

        } @else {
          <!-- Empty attempts state -->
          <div class="mx-4 mt-4 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
            <p class="text-sm text-gray-400">No attempts yet for this question.</p>
          </div>
        }
      }
    </div>
  `,
})
export default class QuestionHistoryPage implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  protected history = signal<QuestionHistoryResponse | null>(null);
  protected isLoading = signal(true);
  protected error = signal(false);

  protected readonly accuracySummary = computed(() => {
    const h = this.history();
    if (!h || h.attempts.length === 0) return '0/0';
    const correct = h.attempts.filter((a) => a.isCorrect).length;
    const pct = Math.round((correct / h.attempts.length) * 100);
    return `${correct}/${h.attempts.length} (${pct}%)`;
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<QuestionHistoryResponse>(`/api/analysis/question/${id}/history`).subscribe({
      next: (h) => {
        this.history.set(h);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.isLoading.set(false);
      },
    });
  }

  protected sessionBadgeLabel(sessionType: string): string {
    return SESSION_BADGE[sessionType]?.label ?? sessionType;
  }

  protected sessionBadgeClasses(sessionType: string): string {
    return SESSION_BADGE[sessionType]?.classes ?? 'bg-gray-100 text-gray-600';
  }

  protected formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      + ', '
      + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  protected formatTime(ms: number): string {
    return (ms / 1000).toFixed(0) + 's';
  }
}
