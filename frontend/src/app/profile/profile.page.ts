import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { AuthStore } from '../store/auth.store';
import { GamificationStore } from '../store/gamification.store';
import { AchievementDto } from '../dashboard/dashboard.models';

@Component({
  selector: 'app-profile',
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="flex flex-col min-h-full bg-gray-50 overflow-y-auto pb-8">

      <!-- Avatar + user info -->
      <div class="bg-white px-4 pt-6 pb-5 border-b border-gray-100">
        <div class="flex items-center gap-4">
          <div class="relative flex-shrink-0">
            @if (user()?.avatarUrl) {
              <img
                [src]="user()!.avatarUrl"
                class="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                alt="Avatar"
              />
            } @else {
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-primary/20">
                {{ initials() }}
              </div>
            }
            <span class="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></span>
          </div>
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-bold text-gray-900 truncate">{{ user()?.displayName ?? 'Student' }}</h1>
            <p class="text-sm text-gray-500 truncate">{{ user()?.email ?? '' }}</p>
            <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              🎓 NEET PG Aspirant
            </span>
          </div>
        </div>
      </div>

      <!-- Gamification stats -->
      <div class="mx-4 mt-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Level + XP bar -->
        <div class="px-4 pt-4 pb-3">
          <div class="flex items-center gap-3 mb-2">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-primary flex flex-col items-center justify-center shadow-sm">
              <span class="text-white text-[10px] font-bold uppercase tracking-wide leading-none">Lv.</span>
              <span class="text-white text-lg font-black leading-none">{{ gamStore.currentLevel() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-semibold text-gray-500">Level {{ gamStore.currentLevel() }}</span>
                <span class="text-xs font-semibold text-primary">
                  {{ gamStore.totalXp() | number }} / {{ xpForNext() | number }} XP
                </span>
              </div>
              <div class="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full transition-all duration-500"
                  [style.width]="xpPercent() + '%'"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Streak -->
        <div class="px-4 py-3 border-t border-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔥</span>
              <div>
                <p class="text-sm font-semibold text-gray-800">
                  {{ gamStore.currentStreak() }} day streak
                </p>
                <p class="text-xs text-gray-400">Longest: {{ gamStore.longestStreak() }} days</p>
              </div>
            </div>
            @if (gamStore.isAtRisk()) {
              <span class="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                ⚠️ At risk
              </span>
            }
          </div>
        </div>

        <!-- Achievement count -->
        <div class="px-4 py-3 border-t border-gray-50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">🏆</span>
              <p class="text-sm font-semibold text-gray-800">
                @if (achievementsLoaded()) {
                  {{ unlockedCount() }} / {{ totalCount() }} Achievements
                } @else {
                  Loading achievements…
                }
              </p>
            </div>
            <a routerLink="/profile/achievements" class="text-xs text-primary font-semibold">View all →</a>
          </div>
        </div>
      </div>

      <!-- My Content -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">My Content</p>
        <div class="grid grid-cols-2 gap-3">
          @for (link of contentLinks; track link.route) {
            <a
              [routerLink]="link.route"
              class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all flex flex-col gap-2"
            >
              <span class="text-3xl">{{ link.emoji }}</span>
              <div>
                <p class="text-sm font-semibold text-gray-800">{{ link.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ link.sublabel }}</p>
              </div>
            </a>
          }
        </div>
      </div>

      <!-- Menu -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Account</p>
        <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
          @for (link of menuLinks; track link.route) {
            <a
              [routerLink]="link.route"
              class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <span class="text-xl w-8 text-center flex-shrink-0">{{ link.emoji }}</span>
              <p class="flex-1 text-sm font-semibold text-gray-800">{{ link.label }}</p>
              <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          }
          <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
            <span class="text-xl w-8 text-center flex-shrink-0">⚙️</span>
            <p class="flex-1 text-sm font-semibold text-gray-800">Settings</p>
            <span class="text-xs text-gray-400 italic">Coming soon</span>
          </div>
          <button
            class="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 transition-colors"
            (click)="signOut()"
          >
            <span class="text-xl w-8 text-center flex-shrink-0">🚪</span>
            <p class="text-sm font-semibold text-red-500">Sign Out</p>
          </button>
        </div>
      </div>

      <!-- Dev tools -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dev Tools</p>
        <a
          routerLink="/admin/reports"
          class="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 active:bg-amber-200 transition-colors"
        >
          <span class="text-xl w-8 text-center flex-shrink-0">🚩</span>
          <div>
            <p class="text-sm font-semibold text-amber-800">QA Reports</p>
            <p class="text-xs text-amber-600">Flagged question issues</p>
          </div>
        </a>
      </div>

    </div>
  `,
})
export default class ProfilePage implements OnInit {
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private http = inject(HttpClient);
  protected gamStore = inject(GamificationStore);

  protected user = this.authStore.user;

  private achievements = signal<AchievementDto[]>([]);
  protected achievementsLoaded = signal(false);
  protected unlockedCount = computed(() => this.achievements().filter((a) => a.isUnlocked).length);
  protected totalCount = computed(() => this.achievements().length);

  protected xpForNext = computed(() => this.gamStore.totalXp() + this.gamStore.xpToNextLevel());
  protected xpPercent = computed(() => {
    const total = this.xpForNext();
    if (!total) return 0;
    return Math.min(100, Math.round((this.gamStore.totalXp() / total) * 100));
  });

  protected readonly contentLinks = [
    { label: 'My Notes', sublabel: 'Your study library', route: '/notes', emoji: '📝' },
    { label: 'Bookmarks', sublabel: 'Saved questions', route: '/bookmarks', emoji: '🔖' },
    { label: 'Achievements', sublabel: 'Badges & milestones', route: '/profile/achievements', emoji: '🏆' },
    { label: 'XP History', sublabel: 'Points & streaks', route: '/profile/xp', emoji: '⚡' },
  ];

  protected readonly menuLinks = [
    { label: 'Friends', route: '/friends', emoji: '👥' },
  ];

  ngOnInit(): void {
    this.http.get<AchievementDto[]>('/api/achievements').subscribe({
      next: (list) => {
        this.achievements.set(list);
        this.achievementsLoaded.set(true);
      },
      error: () => this.achievementsLoaded.set(true),
    });
  }

  protected initials(): string {
    const name = this.user()?.displayName ?? this.user()?.email ?? 'S';
    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  protected signOut(): void {
    this.authStore.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
