import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AnalyticsStore } from '../store/analytics.store';
import { QuestionService } from '../questions/question.service';
import { SkeletonLoaderComponent } from '../shared/ui/skeleton-loader/skeleton-loader.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { MockHistoryDto } from '../mock/mock.models';
import { SrStatsDto } from '../review/review.models';

type StatTab = 'overview' | 'mocks' | 'review' | 'subjects';

const TABS: { key: StatTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'mocks', label: 'Mocks' },
  { key: 'review', label: 'Review' },
  { key: 'subjects', label: 'Subjects' },
];

@Component({
  selector: 'app-analytics',
  imports: [RouterLink, SkeletonLoaderComponent, EmptyStateComponent],
  template: `
    <div class="flex flex-col bg-gray-50 min-h-full">

      <!-- Header + tabs -->
      <div class="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div class="px-4 pt-5 pb-0">
          <h1 class="text-xl font-bold text-gray-900 mb-4">My Stats</h1>
          <!-- Tab bar -->
          <div class="flex">
            @for (tab of tabs; track tab.key) {
              <button
                class="flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors"
                [class]="activeTab() === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-400'"
                (click)="activeTab.set(tab.key)"
              >{{ tab.label }}</button>
            }
          </div>
        </div>
      </div>

      <!-- Tab content -->
      @switch (activeTab()) {

        <!-- ══════════ OVERVIEW ══════════ -->
        @case ('overview') {
          <div class="flex flex-col gap-4 p-4 pb-6">

            @if (analyticsStore.isLoading()) {
              <app-skeleton-loader type="card" [lines]="2" />
              <app-skeleton-loader type="card" [lines]="2" />
            } @else if (!analyticsStore.dashboard()) {
              <app-empty-state icon="⚠️" title="Could not load stats"
                subtitle="Check your connection and try again." />
            } @else {

              <!-- Performance snapshot -->
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Performance Snapshot
                </h2>
                <div class="flex items-center gap-4">
                  <!-- Big accuracy -->
                  <div
                    class="w-20 h-20 rounded-full flex-shrink-0 flex flex-col items-center justify-center border-4"
                    [style.border-color]="gaugeColor(analyticsStore.dashboard()!.overallAccuracy)"
                  >
                    <span
                      class="text-xl font-black leading-none"
                      [style.color]="gaugeColor(analyticsStore.dashboard()!.overallAccuracy)"
                    >{{ analyticsStore.dashboard()!.overallAccuracy.toFixed(0) }}%</span>
                    <span class="text-[9px] text-gray-400 mt-0.5">accuracy</span>
                  </div>
                  <!-- Stats alongside -->
                  <div class="flex-1 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Questions done</span>
                      <span class="font-semibold text-gray-800">
                        {{ analyticsStore.dashboard()!.totalQuestionsAnswered }}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Correct</span>
                      <span class="font-semibold text-green-600">
                        {{ analyticsStore.dashboard()!.totalCorrect }}
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-500">Incorrect</span>
                      <span class="font-semibold text-red-500">
                        {{ analyticsStore.dashboard()!.totalIncorrect }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Mock score snapshot -->
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Mock Tests
                  </h2>
                  <button class="text-xs text-primary font-semibold"
                    (click)="activeTab.set('mocks')">
                    View all →
                  </button>
                </div>

                @if (isLoadingMocks()) {
                  <div class="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                } @else if (!completedMocks().length) {
                  <p class="text-sm text-gray-400">No completed mocks yet.</p>
                  <a routerLink="/mock" class="inline-block mt-2 text-sm text-primary font-semibold">
                    Take your first mock →
                  </a>
                } @else {
                  <div class="flex gap-3">
                    @if (mockBestScore() !== null) {
                      <div class="flex-1 bg-green-50 rounded-xl p-3 text-center">
                        <div class="text-lg font-bold text-green-700">{{ mockBestScore() }}%</div>
                        <div class="text-xs text-green-500 mt-0.5">Best</div>
                      </div>
                    }
                    @if (mockLatestScore() !== null) {
                      <div class="flex-1 bg-blue-50 rounded-xl p-3 text-center">
                        <div class="text-lg font-bold text-blue-700">{{ mockLatestScore() }}%</div>
                        <div class="text-xs text-blue-500 mt-0.5">Latest</div>
                      </div>
                    }
                    @if (mockAvgScore() !== null) {
                      <div class="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                        <div class="text-lg font-bold text-gray-700">{{ mockAvgScore() }}%</div>
                        <div class="text-xs text-gray-400 mt-0.5">Avg</div>
                      </div>
                    }
                  </div>
                }
              </div>

              <!-- SR health snapshot -->
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div class="flex items-center justify-between mb-3">
                  <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Spaced Repetition
                  </h2>
                  <button class="text-xs text-primary font-semibold"
                    (click)="activeTab.set('review')">
                    Details →
                  </button>
                </div>

                @if (isLoadingSr()) {
                  <div class="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
                } @else if (!srStats()) {
                  <p class="text-sm text-gray-400">Could not load SR stats.</p>
                } @else if (srStats()!.totalScheduled === 0) {
                  <p class="text-sm text-gray-400">No cards scheduled yet. Answer more questions!</p>
                } @else {
                  <div class="flex items-center gap-4">
                    <div>
                      <span
                        class="text-2xl font-black"
                        [style.color]="srEfColor(srStats()!.averageEaseFactor)"
                      >{{ srStats()!.averageEaseFactor.toFixed(2) }}</span>
                      <span class="text-xs text-gray-400 ml-1">avg EF</span>
                    </div>
                    <div>
                      <span
                        class="text-sm font-semibold px-2.5 py-1 rounded-full"
                        [style.background-color]="srEfBg(srStats()!.averageEaseFactor)"
                        [style.color]="srEfColor(srStats()!.averageEaseFactor)"
                      >{{ srEfLabel(srStats()!.averageEaseFactor) }}</span>
                    </div>
                    <div class="ml-auto text-right">
                      <div class="text-sm font-semibold text-gray-800">
                        {{ srStats()!.dueToday }} due
                      </div>
                      <div class="text-xs text-gray-400">today</div>
                    </div>
                  </div>
                }
              </div>

              <!-- Question History entry point -->
              <a
                routerLink="/questions/history"
                class="flex items-center gap-4 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 active:bg-gray-50"
              >
                <span class="text-2xl">🔍</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-800">Question History</div>
                  <div class="text-xs text-gray-400 mt-0.5">
                    Browse all attempted questions and see your attempt timeline
                  </div>
                </div>
                <span class="text-gray-300 text-sm flex-shrink-0">›</span>
              </a>

              <!-- Coming next chips -->
              <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <p class="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                  Coming in Phase 4
                </p>
                <div class="flex flex-wrap gap-2">
                  <span class="bg-white text-xs text-indigo-600 font-medium px-3 py-1 rounded-full border border-indigo-100">
                    📈 30-day accuracy trend
                  </span>
                  <span class="bg-white text-xs text-indigo-600 font-medium px-3 py-1 rounded-full border border-indigo-100">
                    🗓 Study heatmap
                  </span>
                  <span class="bg-white text-xs text-indigo-600 font-medium px-3 py-1 rounded-full border border-indigo-100">
                    🧪 Session comparison
                  </span>
                  <span class="bg-white text-xs text-indigo-600 font-medium px-3 py-1 rounded-full border border-indigo-100">
                    ✨ AI insights
                  </span>
                </div>
              </div>
            }
          </div>
        }

        <!-- ══════════ MOCKS ══════════ -->
        @case ('mocks') {
          <div class="flex flex-col gap-4 p-4 pb-6">

            @if (isLoadingMocks()) {
              <app-skeleton-loader type="card" [lines]="2" />
              <app-skeleton-loader type="card" [lines]="3" />
            } @else if (!completedMocks().length) {
              <app-empty-state
                icon="📋"
                title="No mocks taken yet"
                subtitle="Build a custom mock to track your progress over time."
                ctaLabel="Build a Mock"
                ctaRoute="/mock"
              />
            } @else {

              <!-- Score summary row -->
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  All-Time Performance
                </h2>
                <div class="flex gap-3">
                  <div class="flex-1 text-center bg-green-50 rounded-xl p-3">
                    <div class="text-xl font-bold text-green-700">{{ mockBestScore() }}%</div>
                    <div class="text-xs text-green-500">Best</div>
                  </div>
                  <div class="flex-1 text-center bg-blue-50 rounded-xl p-3">
                    <div class="text-xl font-bold text-blue-700">{{ mockLatestScore() }}%</div>
                    <div class="text-xs text-blue-500">Latest</div>
                  </div>
                  <div class="flex-1 text-center bg-gray-50 rounded-xl p-3">
                    <div class="text-xl font-bold text-gray-700">{{ mockAvgScore() }}%</div>
                    <div class="text-xs text-gray-400">Average</div>
                  </div>
                  <div class="flex-1 text-center bg-purple-50 rounded-xl p-3">
                    <div class="text-xl font-bold text-purple-700">{{ completedMocks().length }}</div>
                    <div class="text-xs text-purple-400">Total</div>
                  </div>
                </div>
              </div>

              <!-- Bar chart -->
              @if (chartMocks().length > 0) {
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Score History (last {{ chartMocks().length }})
                  </h2>
                  <svg viewBox="0 0 300 145" class="w-full" style="height: 145px;">
                    <!-- y-grid lines -->
                    <line x1="0" y1="20" x2="300" y2="20" stroke="#f3f4f6" stroke-width="1"/>
                    <line x1="0" y1="47" x2="300" y2="47" stroke="#f3f4f6" stroke-width="1"/>
                    <line x1="0" y1="65" x2="300" y2="65" stroke="#f3f4f6" stroke-width="1"/>
                    <!-- 50% guide line -->
                    <line x1="0" y1="65" x2="300" y2="65" stroke="#fde68a" stroke-width="0.5" stroke-dasharray="4 3"/>
                    <!-- Baseline -->
                    <line x1="0" y1="110" x2="300" y2="110" stroke="#e5e7eb" stroke-width="1"/>

                    @for (mock of chartMocks(); track mock.mockSessionId; let i = $index) {
                      <!-- Bar -->
                      <rect
                        [attr.x]="barX(i, chartMocks().length)"
                        [attr.y]="barY(mockAccuracy(mock))"
                        [attr.width]="barW(chartMocks().length)"
                        [attr.height]="barH(mockAccuracy(mock))"
                        rx="3"
                        [attr.fill]="barColor(mockAccuracy(mock))"
                      />
                      <!-- Score label -->
                      <text
                        [attr.x]="barCenterX(i, chartMocks().length)"
                        [attr.y]="barY(mockAccuracy(mock)) - 4"
                        text-anchor="middle"
                        font-size="9"
                        font-weight="700"
                        [attr.fill]="barColor(mockAccuracy(mock))"
                      >{{ mockAccuracy(mock) }}%</text>
                      <!-- Date label -->
                      <text
                        [attr.x]="barCenterX(i, chartMocks().length)"
                        y="128"
                        text-anchor="middle"
                        font-size="8"
                        fill="#9ca3af"
                      >{{ formatMockDate(mock.startedAt) }}</text>
                    }
                  </svg>
                  <p class="text-[10px] text-gray-400 text-center mt-1">
                    Yellow dashed line = 50% threshold
                  </p>
                </div>
              }

              <!-- Mock list -->
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div class="px-5 py-3 border-b border-gray-100">
                  <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    All Mocks
                  </h2>
                </div>
                @for (mock of completedMocks(); track mock.mockSessionId) {
                  <a
                    [routerLink]="['/mock', mock.mockSessionId, 'results']"
                    class="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50"
                  >
                    <div>
                      <div class="text-sm font-semibold text-gray-800">
                        {{ mock.questionCount }}-question mock
                      </div>
                      <div class="text-xs text-gray-400 mt-0.5">
                        {{ formatMockDateFull(mock.startedAt) }}
                        @if (mock.timeTakenSeconds) {
                          · {{ formatTime(mock.timeTakenSeconds) }}
                        }
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span
                        class="text-base font-bold"
                        [style.color]="barColor(mockAccuracy(mock))"
                      >{{ mockAccuracy(mock) }}%</span>
                      <span class="text-gray-300 text-sm">›</span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>
        }

        <!-- ══════════ REVIEW (SR) ══════════ -->
        @case ('review') {
          <div class="flex flex-col gap-4 p-4 pb-6">

            @if (isLoadingSr()) {
              <app-skeleton-loader type="card" [lines]="2" />
              <app-skeleton-loader type="card" [lines]="3" />
            } @else if (!srStats()) {
              <app-empty-state icon="⚠️" title="Could not load SR stats"
                subtitle="Check your connection and try again." />
            } @else if (srStats()!.totalScheduled === 0) {
              <app-empty-state
                icon="🔁"
                title="No cards scheduled yet"
                subtitle="Answer more questions to build your spaced repetition deck."
                ctaLabel="Start Reviewing"
                ctaRoute="/review"
              />
            } @else {

              <!-- Ease Factor health -->
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Retention Health
                </h2>
                <div class="flex items-center gap-4 mb-4">
                  <!-- EF gauge (simple circle with color) -->
                  <div
                    class="w-20 h-20 rounded-full flex-shrink-0 flex flex-col items-center justify-center border-4"
                    [style.border-color]="srEfColor(srStats()!.averageEaseFactor)"
                  >
                    <span
                      class="text-xl font-black leading-none"
                      [style.color]="srEfColor(srStats()!.averageEaseFactor)"
                    >{{ srStats()!.averageEaseFactor.toFixed(2) }}</span>
                    <span class="text-[9px] text-gray-400 mt-0.5">avg EF</span>
                  </div>
                  <div>
                    <div
                      class="text-base font-bold mb-1"
                      [style.color]="srEfColor(srStats()!.averageEaseFactor)"
                    >{{ srEfLabel(srStats()!.averageEaseFactor) }}</div>
                    <p class="text-xs text-gray-400 leading-snug">
                      {{ srEfDescription(srStats()!.averageEaseFactor) }}
                    </p>
                  </div>
                </div>
                <!-- EF scale legend -->
                <div class="flex gap-2 text-[10px] text-center">
                  <div class="flex-1 bg-red-50 rounded-lg px-2 py-1.5">
                    <div class="font-semibold text-red-600">&lt; 2.0</div>
                    <div class="text-red-400">Struggling</div>
                  </div>
                  <div class="flex-1 bg-yellow-50 rounded-lg px-2 py-1.5">
                    <div class="font-semibold text-yellow-600">2.0 – 2.5</div>
                    <div class="text-yellow-500">Good</div>
                  </div>
                  <div class="flex-1 bg-green-50 rounded-lg px-2 py-1.5">
                    <div class="font-semibold text-green-600">&gt; 2.5</div>
                    <div class="text-green-400">Excellent</div>
                  </div>
                </div>
              </div>

              <!-- Stats grid -->
              <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                  Deck Stats
                </h2>
                <div class="grid grid-cols-2 gap-3">
                  <div class="bg-gray-50 rounded-xl p-4">
                    <div class="text-2xl font-bold text-gray-800">
                      {{ srStats()!.totalScheduled }}
                    </div>
                    <div class="text-xs text-gray-400 mt-0.5">Cards scheduled</div>
                  </div>
                  <div class="bg-orange-50 rounded-xl p-4">
                    <div class="text-2xl font-bold text-orange-600">
                      {{ srStats()!.dueToday }}
                    </div>
                    <div class="text-xs text-orange-400 mt-0.5">Due today</div>
                  </div>
                  <div class="bg-blue-50 rounded-xl p-4">
                    <div class="text-2xl font-bold text-blue-700">
                      {{ srStats()!.totalReviews }}
                    </div>
                    <div class="text-xs text-blue-400 mt-0.5">Total reviews</div>
                  </div>
                  <div class="bg-green-50 rounded-xl p-4">
                    <div class="text-2xl font-bold text-green-700">
                      {{ reviewRate() }}%
                    </div>
                    <div class="text-xs text-green-400 mt-0.5">Review rate</div>
                  </div>
                </div>
              </div>

              <!-- Action -->
              @if (srStats()!.dueToday > 0) {
                <a
                  routerLink="/review"
                  class="flex items-center justify-between bg-primary text-white rounded-2xl px-5 py-4 active:opacity-90 shadow-md"
                >
                  <div>
                    <div class="font-semibold text-sm">📝 Start Daily Review</div>
                    <div class="text-xs text-white/70 mt-0.5">
                      {{ srStats()!.dueToday }} cards waiting
                    </div>
                  </div>
                  <span class="text-white/70">→</span>
                </a>
              } @else {
                <div class="bg-green-50 border border-green-100 rounded-2xl px-5 py-4 text-center">
                  <p class="text-sm font-semibold text-green-700">🎉 All caught up!</p>
                  <p class="text-xs text-green-500 mt-0.5">No reviews due today.</p>
                </div>
              }
            }
          </div>
        }

        <!-- ══════════ SUBJECTS ══════════ -->
        @case ('subjects') {
          <div class="flex flex-col gap-4 p-4 pb-6">

            @if (analyticsStore.isLoading()) {
              <app-skeleton-loader type="card" [lines]="2" />
            } @else if (!analyticsStore.dashboard()) {
              <app-empty-state icon="⚠️" title="Could not load stats"
                subtitle="Check your connection and try again." />
            } @else {

              <!-- Current data: strongest/weakest -->
              @if (analyticsStore.dashboard()!.strongestSubject || analyticsStore.dashboard()!.weakestSubject) {
                <div class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h2 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                    Subject Highlights
                  </h2>
                  <div class="space-y-4">
                    @if (analyticsStore.dashboard()!.strongestSubject; as s) {
                      <div>
                        <div class="flex justify-between items-center mb-1.5">
                          <div class="flex items-center gap-2">
                            <span class="text-sm">🟢</span>
                            <span class="text-sm font-semibold text-gray-800">{{ s.subjectName }}</span>
                          </div>
                          <span class="text-sm font-bold text-green-600">
                            {{ s.accuracy.toFixed(0) }}%
                          </span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div class="h-full bg-green-400 rounded-full"
                            [style.width.%]="s.accuracy"></div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">Your strongest subject</p>
                      </div>
                    }
                    @if (analyticsStore.dashboard()!.weakestSubject; as w) {
                      <div>
                        <div class="flex justify-between items-center mb-1.5">
                          <div class="flex items-center gap-2">
                            <span class="text-sm">🔴</span>
                            <span class="text-sm font-semibold text-gray-800">{{ w.subjectName }}</span>
                          </div>
                          <span class="text-sm font-bold text-red-500">
                            {{ w.accuracy.toFixed(0) }}%
                          </span>
                        </div>
                        <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div class="h-full bg-red-400 rounded-full"
                            [style.width.%]="w.accuracy"></div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1">Your weakest subject — focus here</p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Drill weak subject action -->
                @if (analyticsStore.dashboard()!.weakestSubject; as w) {
                  <a
                    routerLink="/mock"
                    class="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 active:bg-gray-50"
                  >
                    <span class="text-2xl">🎯</span>
                    <div>
                      <div class="text-sm font-semibold text-gray-800">
                        Drill {{ w.subjectName }}
                      </div>
                      <div class="text-xs text-gray-400 mt-0.5">
                        Build a focused mock on your weakest subject
                      </div>
                    </div>
                    <span class="ml-auto text-gray-300 text-sm">→</span>
                  </a>
                }
              } @else {
                <app-empty-state icon="📚" title="Not enough data yet"
                  subtitle="Answer questions across multiple subjects to see your strengths and weaknesses." />
              }

              <!-- Coming soon: full breakdown -->
              <div class="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                <p class="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-2">
                  Coming in Phase 4
                </p>
                <p class="text-sm text-indigo-700 mb-2">
                  Full subject × chapter breakdown with question counts, accuracy per chapter,
                  and drill-down to exactly where you're losing marks.
                </p>
                <div class="flex flex-wrap gap-1.5 text-[10px] text-indigo-500">
                  <span class="bg-white rounded-full px-2 py-0.5 border border-indigo-100">
                    All subjects ranked
                  </span>
                  <span class="bg-white rounded-full px-2 py-0.5 border border-indigo-100">
                    Chapter-level accuracy
                  </span>
                  <span class="bg-white rounded-full px-2 py-0.5 border border-indigo-100">
                    % of bank attempted
                  </span>
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
})
export default class AnalyticsPage implements OnInit {
  protected analyticsStore = inject(AnalyticsStore);
  private http = inject(HttpClient);
  private service = inject(QuestionService);

  protected readonly tabs = TABS;
  protected activeTab = signal<StatTab>('overview');

  protected mockHistory = signal<MockHistoryDto[]>([]);
  protected srStats = signal<SrStatsDto | null>(null);
  protected isLoadingMocks = signal(true);
  protected isLoadingSr = signal(true);

  protected readonly completedMocks = computed(() =>
    this.mockHistory().filter((m) => m.score !== null && m.completedAt !== null),
  );

  protected readonly chartMocks = computed(() =>
    [...this.completedMocks().slice(0, 8)].reverse(),
  );

  protected mockAccuracy(mock: MockHistoryDto): number {
    return Math.round((mock.score! / mock.questionCount) * 100);
  }

  protected readonly mockBestScore = computed(() => {
    const scores = this.completedMocks().map((m) => this.mockAccuracy(m));
    return scores.length ? Math.max(...scores) : null;
  });

  protected readonly mockLatestScore = computed(() => {
    const c = this.completedMocks();
    return c.length ? this.mockAccuracy(c[0]) : null;
  });

  protected readonly mockAvgScore = computed(() => {
    const c = this.completedMocks();
    if (!c.length) return null;
    return Math.round(c.reduce((sum, m) => sum + this.mockAccuracy(m), 0) / c.length);
  });

  protected readonly reviewRate = computed(() => {
    const s = this.srStats();
    if (!s || !s.totalScheduled) return 0;
    return Math.min(100, Math.round((s.totalReviews / s.totalScheduled) * 100));
  });

  ngOnInit(): void {
    this.analyticsStore.loadDashboard();
    this.service.getMockHistory(1, 20).subscribe({
      next: (r) => { this.mockHistory.set(r.data); this.isLoadingMocks.set(false); },
      error: () => this.isLoadingMocks.set(false),
    });
    this.http.get<SrStatsDto>('/api/spaced-repetition/stats').subscribe({
      next: (s) => { this.srStats.set(s); this.isLoadingSr.set(false); },
      error: () => this.isLoadingSr.set(false),
    });
  }

  // ─── Gauge / color helpers ───────────────────────────────────────

  protected gaugeColor(pct: number): string {
    if (pct >= 70) return '#22c55e';
    if (pct >= 50) return '#eab308';
    return '#ef4444';
  }

  protected barColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#ef4444';
  }

  // ─── SVG bar chart helpers ────────────────────────────────────────

  protected barW(total: number): number {
    return Math.max(1, 300 / total - 8);
  }

  protected barX(index: number, total: number): number {
    const slotW = 300 / total;
    return index * slotW + 4;
  }

  protected barCenterX(index: number, total: number): number {
    const slotW = 300 / total;
    return index * slotW + 4 + this.barW(total) / 2;
  }

  protected barH(score: number): number {
    return Math.max(2, (score / 100) * 90);
  }

  protected barY(score: number): number {
    return 110 - this.barH(score);
  }

  // ─── SR helpers ───────────────────────────────────────────────────

  protected srEfColor(ef: number): string {
    if (ef >= 2.5) return '#16a34a';
    if (ef >= 2.0) return '#ca8a04';
    if (ef > 0) return '#dc2626';
    return '#9ca3af';
  }

  protected srEfBg(ef: number): string {
    if (ef >= 2.5) return '#f0fdf4';
    if (ef >= 2.0) return '#fefce8';
    if (ef > 0) return '#fef2f2';
    return '#f9fafb';
  }

  protected srEfLabel(ef: number): string {
    if (ef >= 2.5) return 'Excellent retention';
    if (ef >= 2.0) return 'Good retention';
    if (ef > 0) return 'Needs attention';
    return 'No cards yet';
  }

  protected srEfDescription(ef: number): string {
    if (ef >= 2.5) return 'Your long-term memory is working well. Keep up the review habit.';
    if (ef >= 2.0) return 'Solid retention. Stay consistent with your daily reviews.';
    if (ef > 0) return 'Some cards are difficult. More review sessions will strengthen retention.';
    return 'Start answering questions to build your deck.';
  }

  // ─── Date / time formatters ───────────────────────────────────────

  protected formatMockDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  protected formatMockDateFull(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  protected formatTime(seconds: number): string {
    const total = Math.floor(seconds);
    if (total < 60) return `${total}s`;
    const m = Math.floor(total / 60);
    const s = total % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
}
