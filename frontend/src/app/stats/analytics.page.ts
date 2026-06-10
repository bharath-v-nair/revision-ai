import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnalyticsStore } from '../store/analytics.store';
import { SkeletonLoaderComponent } from '../shared/ui/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { SrStatsDto } from '../review/review.models';

const CIRCUMFERENCE = 2 * Math.PI * 60; // r=60 → ~376.99

@Component({
  selector: 'app-analytics',
  imports: [RouterLink, SkeletonLoaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col bg-gray-50 min-h-full pb-6">

      <!-- Header -->
      <div class="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">My Stats</h1>
      </div>

      @if (analyticsStore.isLoading()) {
        <!-- Loading skeletons -->
        <div class="px-4 mt-4 space-y-4">
          <app-skeleton-loader type="card" [lines]="2" />
          <app-skeleton-loader type="card" [lines]="2" />
          <app-skeleton-loader type="card" [lines]="2" />
        </div>

      } @else if (!analyticsStore.dashboard()) {
        <!-- Error / no data -->
        <app-empty-state
          icon="⚠️"
          title="Could not load stats"
          subtitle="Please check your connection and try again."
        />

      } @else if (analyticsStore.dashboard()!.totalQuestionsAnswered === 0) {
        <!-- Empty state — no questions answered yet -->
        <app-empty-state
          icon="📊"
          title="No data yet"
          subtitle="Start answering questions to see your analytics!"
          ctaLabel="Start Now"
          ctaRoute="/questions"
        />

      } @else {
        <!-- ─── A. Overall Accuracy Gauge ─── -->
        <div class="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold text-gray-500 mb-4">Overall Accuracy</h2>
          <div class="flex items-center justify-center">
            <svg viewBox="0 0 140 140" class="w-36 h-36">
              <!-- Track -->
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                stroke="#f3f4f6"
                stroke-width="12"
              />
              <!-- Fill arc -->
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                [attr.stroke]="gaugeColor(analyticsStore.dashboard()!.overallAccuracy)"
                stroke-width="12"
                stroke-linecap="round"
                [attr.stroke-dasharray]="gaugeDash(analyticsStore.dashboard()!.overallAccuracy)"
                transform="rotate(-90 70 70)"
              />
              <!-- Percentage label -->
              <text
                x="70" y="65"
                text-anchor="middle"
                dominant-baseline="central"
                font-size="22"
                font-weight="700"
                [attr.fill]="gaugeColor(analyticsStore.dashboard()!.overallAccuracy)"
              >{{ analyticsStore.dashboard()!.overallAccuracy.toFixed(1) }}%</text>
              <!-- Sub-label -->
              <text
                x="70" y="86"
                text-anchor="middle"
                dominant-baseline="central"
                font-size="10"
                fill="#9ca3af"
              >accuracy</text>
            </svg>
          </div>
        </div>

        <!-- ─── B. Stats Summary Cards ─── -->
        <div class="mx-4 mt-4 grid grid-cols-2 gap-3">
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="text-2xl mb-1">📚</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ analyticsStore.dashboard()!.totalQuestionsAnswered }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">Total Questions</div>
          </div>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="text-2xl mb-1">✅</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ analyticsStore.dashboard()!.totalCorrect }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">Correct</div>
          </div>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="text-2xl mb-1">❌</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ analyticsStore.dashboard()!.totalIncorrect }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">Incorrect</div>
          </div>
          <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div class="text-2xl mb-1">🔥</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ analyticsStore.dashboard()!.streakDays }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">Current Streak</div>
          </div>
        </div>

        <!-- ─── C. Subject Snapshot ─── -->
        <div class="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold text-gray-500 mb-4">Subject Snapshot</h2>

          @if (!analyticsStore.dashboard()!.strongestSubject && !analyticsStore.dashboard()!.weakestSubject) {
            <p class="text-sm text-gray-400 text-center py-2">
              Answer more questions across subjects to see your strengths and weaknesses.
            </p>
          } @else {
            <div class="space-y-3">
              @if (analyticsStore.dashboard()!.strongestSubject; as strongest) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">
                      🟢 Strongest: {{ strongest.subjectName }}
                    </span>
                    <span class="text-sm font-bold text-green-600">
                      {{ strongest.accuracy.toFixed(0) }}%
                    </span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-green-400 rounded-full transition-all duration-700"
                      [style.width.%]="strongest.accuracy"
                    ></div>
                  </div>
                </div>
              }
              @if (analyticsStore.dashboard()!.weakestSubject; as weakest) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">
                      🔴 Weakest: {{ weakest.subjectName }}
                    </span>
                    <span class="text-sm font-bold text-red-500">
                      {{ weakest.accuracy.toFixed(0) }}%
                    </span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-red-400 rounded-full transition-all duration-700"
                      [style.width.%]="weakest.accuracy"
                    ></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- ─── D. XP & Level Summary ─── -->
        <div class="mx-4 mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold text-gray-500 mb-3">XP & Level</h2>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Level badge -->
              <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span class="text-lg font-black text-primary">
                  {{ analyticsStore.dashboard()!.currentLevel }}
                </span>
              </div>
              <div>
                <div class="text-sm font-semibold text-gray-800">
                  Level {{ analyticsStore.dashboard()!.currentLevel }}
                </div>
                <div class="text-xs text-gray-500">
                  {{ analyticsStore.dashboard()!.totalXp }} XP total
                </div>
              </div>
            </div>
            <a
              routerLink="/profile/xp"
              class="text-xs text-primary font-semibold"
            >View XP history →</a>
          </div>
        </div>

        <!-- ─── E. Quick Action Buttons ─── -->
        <div class="mx-4 mt-4 space-y-3">
          <a
            routerLink="/review"
            class="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">📝</span>
              <span class="text-sm font-semibold text-gray-800">
                Review Due Questions
                @if (srDueCount() !== null) {
                  <span class="ml-1 text-primary">({{ srDueCount() }})</span>
                }
              </span>
            </div>
            <span class="text-gray-400 text-sm">→</span>
          </a>
          <a
            routerLink="/mock"
            class="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 active:bg-gray-50"
          >
            <div class="flex items-center gap-3">
              <span class="text-xl">🎯</span>
              <span class="text-sm font-semibold text-gray-800">Build Custom Mock</span>
            </div>
            <span class="text-gray-400 text-sm">→</span>
          </a>
        </div>
      }
    </div>
  `,
})
export default class AnalyticsPage implements OnInit {
  protected analyticsStore = inject(AnalyticsStore);
  private http = inject(HttpClient);

  protected srDueCount = signal<number | null>(null);

  readonly circumference = CIRCUMFERENCE;

  ngOnInit(): void {
    this.analyticsStore.loadDashboard();
    this.http.get<SrStatsDto>('/api/spaced-repetition/stats').subscribe({
      next: (stats) => this.srDueCount.set(stats.dueToday),
      error: () => this.srDueCount.set(null),
    });
  }

  protected gaugeColor(accuracy: number): string {
    if (accuracy >= 70) return '#22c55e';
    if (accuracy >= 50) return '#eab308';
    return '#ef4444';
  }

  protected gaugeDash(accuracy: number): string {
    const fill = (accuracy / 100) * CIRCUMFERENCE;
    return `${fill} ${CIRCUMFERENCE}`;
  }
}
