import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { XpSummaryResponse, XpTransaction } from '../../dashboard/dashboard.models';

type FilterChip = 'All' | 'Questions' | 'Streaks' | 'Mocks' | 'Achievements';

const REASON_ICON: Record<string, string> = {
  CorrectAnswer: '✅',
  StreakBonus: '🔥',
  SpeedBonus: '⚡',
  MockCompletion: '🏆',
  AchievementUnlocked: '🎖',
};

const REASON_LABEL: Record<string, string> = {
  CorrectAnswer: 'Correct Answer',
  StreakBonus: 'Streak Bonus',
  SpeedBonus: 'Speed Bonus',
  MockCompletion: 'Mock Complete',
  AchievementUnlocked: 'Achievement Unlocked',
};

interface DateGroup {
  label: string;
  entries: XpTransaction[];
}

@Component({
  selector: 'app-xp-history',
  imports: [DecimalPipe],
  template: `
    <div class="flex flex-col min-h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 class="text-xl font-bold text-gray-900">XP History</h1>
        @if (loaded()) {
          <div class="flex items-center gap-3 mt-1">
            <span class="text-sm font-semibold text-primary">Total XP: {{ summary()!.totalXp | number }}</span>
            <span class="text-gray-300">·</span>
            <span class="text-sm text-gray-500">Level {{ summary()!.currentLevel }}</span>
          </div>

          <!-- Level progress bar -->
          <div class="mt-3">
            <div class="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress to Level {{ summary()!.currentLevel + 1 }}</span>
              <span>{{ xpProgressPercent() }}%</span>
            </div>
            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full transition-all"
                [style.width]="xpProgressPercent() + '%'"
              ></div>
            </div>
          </div>
        }
      </div>

      <!-- Filter chips -->
      <div class="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none bg-white border-b border-gray-100">
        @for (chip of chips; track chip) {
          <button
            class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors"
            [class.bg-primary]="activeFilter() === chip"
            [class.text-white]="activeFilter() === chip"
            [class.border-primary]="activeFilter() === chip"
            [class.bg-white]="activeFilter() !== chip"
            [class.text-gray-600]="activeFilter() !== chip"
            [class.border-gray-200]="activeFilter() !== chip"
            (click)="activeFilter.set(chip)"
          >
            {{ chip }}
          </button>
        }
      </div>

      <!-- Transactions -->
      <div class="flex-1 overflow-y-auto px-4 py-3 space-y-4">

        @if (!loaded()) {
          @for (i of [1,2,3]; track i) {
            <div class="space-y-2">
              <div class="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              @for (j of [1,2,3]; track j) {
                <div class="h-12 bg-white rounded-xl animate-pulse"></div>
              }
            </div>
          }
        } @else if (filteredGroups().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <p class="text-5xl mb-3">⚡</p>
            <p class="text-gray-500 text-sm">No XP transactions in this category yet.</p>
          </div>
        } @else {
          @for (group of filteredGroups(); track group.label) {
            <div>
              <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{{ group.label }}</p>
              <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden shadow-sm">
                @for (tx of group.entries; track tx.id) {
                  <div class="flex items-center gap-3 px-4 py-3">
                    <span class="text-xl flex-shrink-0">{{ icon(tx.reason) }}</span>
                    <p class="flex-1 text-sm font-medium text-gray-700">{{ label(tx.reason) }}</p>
                    <span class="text-sm font-black text-primary">+{{ tx.amount }} XP</span>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

    </div>
  `,
})
export default class XpHistoryPage implements OnInit {
  private http = inject(HttpClient);

  protected summary = signal<XpSummaryResponse | null>(null);
  protected loaded = signal(false);
  protected activeFilter = signal<FilterChip>('All');
  protected readonly chips: FilterChip[] = ['All', 'Questions', 'Streaks', 'Mocks', 'Achievements'];

  protected xpProgressPercent = computed(() => {
    const s = this.summary();
    if (!s) return 0;
    const total = s.totalXp + s.xpToNextLevel;
    return total ? Math.min(100, Math.round((s.totalXp / total) * 100)) : 0;
  });

  protected filteredTransactions = computed(() => {
    const txs = this.summary()?.recentTransactions ?? [];
    const f = this.activeFilter();
    if (f === 'All') return txs;
    return txs.filter((t) => {
      if (f === 'Questions') return t.reason === 'CorrectAnswer' || t.reason === 'SpeedBonus';
      if (f === 'Streaks') return t.reason === 'StreakBonus';
      if (f === 'Mocks') return t.reason === 'MockCompletion';
      if (f === 'Achievements') return t.reason === 'AchievementUnlocked';
      return true;
    });
  });

  protected filteredGroups = computed<DateGroup[]>(() => {
    const txs = this.filteredTransactions();
    const groups = new Map<string, XpTransaction[]>();

    for (const tx of txs) {
      const label = this.dateLabel(tx.createdAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(tx);
    }

    return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries }));
  });

  ngOnInit(): void {
    this.http.get<XpSummaryResponse>('/api/xp/summary').subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  protected icon(reason: string): string {
    return REASON_ICON[reason] ?? '⭐';
  }

  protected label(reason: string): string {
    return REASON_LABEL[reason] ?? reason;
  }

  private dateLabel(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (this.sameDay(date, today)) return 'Today';
    if (this.sameDay(date, yesterday)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private sameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
