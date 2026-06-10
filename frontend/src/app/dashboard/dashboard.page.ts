import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  HostListener,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DashboardStore } from './dashboard.store';
import { GamificationStore } from '../store/gamification.store';
import { AuthStore } from '../store/auth.store';
import { SkeletonLoaderComponent } from '../shared/ui/skeleton-loader/skeleton-loader.component';
import { StreakFlameComponent } from './components/streak-flame.component';
import { XpBarComponent } from './components/xp-bar.component';
import { SrStatsDto } from '../review/review.models';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    SkeletonLoaderComponent,
    StreakFlameComponent,
    XpBarComponent,
  ],
  template: `
    <div class="px-4 space-y-4 py-4">

      <!-- A. Greeting Header -->
      <div class="flex items-center justify-between pt-2">
        <div>
          <h1 class="text-xl font-bold text-gray-800">
            Good {{ greeting }}, {{ userName() }} 👋
          </h1>
          <p class="text-sm text-gray-500">{{ dateSubtitle }}</p>
        </div>
        <button
          class="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Notifications"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.437L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>

      <!-- B. Streak + XP Card -->
      @if (dashStore.isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
      } @else {
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
          <app-streak-flame
            [streak]="gamStore.currentStreak()"
            [isAtRisk]="gamStore.isAtRisk()"
          />
          <app-xp-bar
            [totalXp]="gamStore.totalXp()"
            [xpToNextLevel]="gamStore.xpToNextLevel()"
            [level]="gamStore.currentLevel()"
          />
        </div>
      }

      <!-- C. Questions Waiting Card (most prominent) -->
      @if (dashStore.isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
      } @else {
        <div
          routerLink="/questions"
          class="bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-white shadow-lg cursor-pointer active:opacity-90 transition-opacity"
        >
          <div [class.animate-pulse]="dashStore.pendingCount() > 0">
            <span class="text-5xl font-bold">{{ dashStore.pendingCount() }}</span>
          </div>
          @if (dashStore.pendingCount() > 0) {
            <p class="text-white/80 mt-1 text-lg font-medium">Questions Waiting</p>
            <p class="text-white/60 text-sm mt-2 font-mono tracking-widest">
              {{ countdownDisplay() }}
            </p>
          } @else {
            <p class="text-white/80 mt-1 text-lg font-medium">No questions yet</p>
            <p class="text-white/60 text-sm mt-2">
              Next drop in {{ countdownDisplay() }}
            </p>
          }
        </div>
      }

      <!-- D. Today's Stats Bar -->
      @if (dashStore.isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
      } @else {
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          @if (dashStore.stats(); as s) {
            <div class="grid grid-cols-2 gap-2">
              <div class="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                <span class="text-xl">✅</span>
                <div>
                  <div class="font-bold text-gray-800">{{ s.totalCorrect }}</div>
                  <div class="text-xs text-gray-500">correct</div>
                </div>
              </div>
              <div class="flex items-center gap-2 bg-red-50 rounded-xl p-3">
                <span class="text-xl">❌</span>
                <div>
                  <div class="font-bold text-gray-800">{{ s.totalIncorrect }}</div>
                  <div class="text-xs text-gray-500">incorrect</div>
                </div>
              </div>
              <div class="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                <span class="text-xl">🎯</span>
                <div>
                  <div class="font-bold text-gray-800">{{ s.overallAccuracy.toFixed(1) }}%</div>
                  <div class="text-xs text-gray-500">accuracy</div>
                </div>
              </div>
              <div class="flex items-center gap-2 bg-purple-50 rounded-xl p-3">
                <span class="text-xl">📚</span>
                <div>
                  <div class="font-bold text-gray-800">{{ s.totalQuestionsAnswered }}</div>
                  <div class="text-xs text-gray-500">total</div>
                </div>
              </div>
            </div>
          } @else {
            <p class="text-sm text-gray-500 text-center py-4">
              Start answering questions to unlock your stats!
            </p>
          }
        </div>
      }

      <!-- E. Weakest vs Strongest Subject -->
      @if (dashStore.isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
      } @else {
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Subject Snapshot
          </h2>
          @if (dashStore.stats()?.strongestSubject || dashStore.stats()?.weakestSubject) {
            <div class="space-y-3">
              @if (dashStore.stats()?.strongestSubject; as s) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm">🟢 <span class="font-medium text-gray-700">{{ s.subjectName }}</span></span>
                    <span class="text-xs text-gray-500">{{ s.accuracy.toFixed(1) }}%</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-green-500 rounded-full transition-all duration-700"
                      [style.width.%]="s.accuracy"
                    ></div>
                  </div>
                </div>
              }
              @if (dashStore.stats()?.weakestSubject; as w) {
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm">🔴 <span class="font-medium text-gray-700">{{ w.subjectName }}</span></span>
                    <span class="text-xs text-gray-500">{{ w.accuracy.toFixed(1) }}%</span>
                  </div>
                  <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-red-500 rounded-full transition-all duration-700"
                      [style.width.%]="w.accuracy"
                    ></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-gray-500 text-center py-4">
              Answer more questions to see your subject stats
            </p>
          }
        </div>
      }

      <!-- F. Recent XP Activity -->
      @if (dashStore.isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
      } @else {
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 class="text-sm font-semibold text-gray-600 mb-3">Recent XP</h2>
          @if (dashStore.xpSummary()?.recentTransactions?.length) {
            <div class="space-y-2">
              @for (tx of dashStore.xpSummary()!.recentTransactions.slice(0, 3); track tx.id) {
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{{ xpIcon(tx.reason) }}</span>
                    <span class="text-sm text-gray-600">{{ tx.reason }}</span>
                  </div>
                  <span class="text-sm font-semibold text-primary">+{{ tx.amount }} XP</span>
                </div>
              }
            </div>
          } @else {
            <p class="text-sm text-gray-500 text-center py-4">Answer questions to earn XP!</p>
          }
        </div>
      }

      <!-- G. Quick Actions Row -->
      <div class="grid grid-cols-2 gap-3 pb-2">
        <button
          routerLink="/review"
          class="relative bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <span class="text-2xl block mb-1">📝</span>
          <span class="text-sm font-medium text-gray-700">Daily Review</span>
          @if ((srStats()?.dueToday ?? 0) > 0) {
            <span class="absolute top-2 right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {{ srStats()!.dueToday }}
            </span>
          }
        </button>
        <button
          routerLink="/stats"
          class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
        >
          <span class="text-2xl block mb-1">📊</span>
          <span class="text-sm font-medium text-gray-700">Full Stats</span>
        </button>
      </div>

    </div>
  `,
})
export default class DashboardPage implements OnInit, OnDestroy {
  protected dashStore = inject(DashboardStore);
  protected gamStore = inject(GamificationStore);
  protected authStore = inject(AuthStore);
  private http = inject(HttpClient);

  protected countdownDisplay = signal('--:--:--');
  protected srStats = signal<SrStatsDto | null>(null);

  protected readonly greeting = this.getGreeting();
  protected readonly dateSubtitle = this.getDateSubtitle();

  private intervalId?: ReturnType<typeof setInterval>;
  private touchStartY = 0;

  protected userName() {
    return this.authStore.user()?.displayName ?? 'there';
  }

  ngOnInit(): void {
    this.dashStore.load();
    this.updateCountdown();
    this.intervalId = setInterval(() => this.updateCountdown(), 1000);
    this.http.get<SrStatsDto>('/api/spaced-repetition/stats').subscribe({
      next: (stats) => this.srStats.set(stats),
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent): void {
    const delta = e.changedTouches[0].clientY - this.touchStartY;
    if (delta > 80) this.dashStore.load();
  }

  protected xpIcon(reason: string): string {
    const r = reason.toLowerCase();
    if (r.includes('streak')) return '🔥';
    if (r.includes('speed')) return '⚡';
    if (r.includes('achievement')) return '🏆';
    if (r.includes('correct')) return '✅';
    return '⭐';
  }

  private getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  private getDateSubtitle(): string {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
  }

  private updateCountdown(): void {
    const pendingCount = this.dashStore.pendingCount();
    const earliestExpiry = this.dashStore.earliestExpiry();

    if (pendingCount > 0 && earliestExpiry) {
      const diff = new Date(earliestExpiry).getTime() - Date.now();
      if (diff <= 0) {
        this.countdownDisplay.set('00:00:00');
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      this.countdownDisplay.set(
        `${pad(h)}:${pad(m)}:${pad(s)}`,
      );
    } else {
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = nextHour.getTime() - now.getTime();
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      this.countdownDisplay.set(`00:${pad(m)}:${pad(s)}`);
    }
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
