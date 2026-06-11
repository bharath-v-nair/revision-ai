import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { forkJoin } from 'rxjs';
import { XpSummaryResponse, StreakResponse, XpTransaction, AchievementDto } from '../dashboard/dashboard.models';

export interface XpToastEntry {
  id: number;
  delta: number;
  reason: string;
}

interface GamificationState {
  totalXp: number;
  previousTotalXp: number;
  currentLevel: number;
  previousLevel: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  recentTransactions: XpTransaction[];
  isLoading: boolean;
  xpToastQueue: XpToastEntry[];
  showLevelUp: boolean;
  levelUpFrom: number;
  levelUpTo: number;
  achievementToastQueue: AchievementDto[];
}

let toastIdCounter = 0;

const initialState: GamificationState = {
  totalXp: 0,
  previousTotalXp: 0,
  currentLevel: 1,
  previousLevel: 1,
  xpToNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  isAtRisk: false,
  recentTransactions: [],
  isLoading: false,
  xpToastQueue: [],
  showLevelUp: false,
  levelUpFrom: 1,
  levelUpTo: 2,
  achievementToastQueue: [],
};

function buildXpState(xp: XpSummaryResponse, streaks: StreakResponse): Partial<GamificationState> {
  return {
    totalXp: xp.totalXp ?? 0,
    previousTotalXp: xp.totalXp ?? 0,
    currentLevel: xp.currentLevel ?? 1,
    previousLevel: xp.currentLevel ?? 1,
    xpToNextLevel: xp.xpToNextLevel ?? 100,
    recentTransactions: xp.recentTransactions ?? [],
    currentStreak: streaks.currentStreak ?? 0,
    longestStreak: streaks.longestStreak ?? 0,
    isAtRisk: streaks.isAtRisk ?? false,
    isLoading: false,
  };
}

export const GamificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    loadGamificationData(): void {
      patchState(store, { isLoading: true });
      forkJoin({
        xp: http.get<XpSummaryResponse>('/api/xp/summary'),
        streaks: http.get<StreakResponse>('/api/streaks'),
      }).subscribe({
        next: ({ xp, streaks }) => patchState(store, buildXpState(xp, streaks)),
        error: () => patchState(store, { isLoading: false }),
      });
    },

    load(): void {
      patchState(store, { isLoading: true });
      forkJoin({
        xp: http.get<XpSummaryResponse>('/api/xp/summary'),
        streaks: http.get<StreakResponse>('/api/streaks'),
      }).subscribe({
        next: ({ xp, streaks }) => patchState(store, buildXpState(xp, streaks)),
        error: () => patchState(store, { isLoading: false }),
      });
    },

    setData(xp: XpSummaryResponse, streaks: StreakResponse): void {
      patchState(store, buildXpState(xp, streaks));
    },

    onAnswerCompleted(): void {
      const prevXp = store.totalXp();
      const prevLevel = store.currentLevel();
      patchState(store, { previousTotalXp: prevXp, previousLevel: prevLevel });

      http.get<XpSummaryResponse>('/api/xp/summary').subscribe({
        next: (xp) => {
          const newXp = xp.totalXp ?? 0;
          const newLevel = xp.currentLevel ?? 1;
          const delta = newXp - prevXp;

          patchState(store, {
            totalXp: newXp,
            currentLevel: newLevel,
            xpToNextLevel: xp.xpToNextLevel ?? 100,
            recentTransactions: xp.recentTransactions ?? [],
          });

          if (delta > 0) {
            const reason = xp.recentTransactions?.[0]?.reason ?? 'CorrectAnswer';
            const currentQueue = store.xpToastQueue();
            const trimmed = currentQueue.length >= 3 ? currentQueue.slice(-2) : currentQueue;
            patchState(store, {
              xpToastQueue: [...trimmed, { id: ++toastIdCounter, delta, reason }],
            });
          }

          if (newLevel > prevLevel) {
            patchState(store, {
              showLevelUp: true,
              levelUpFrom: prevLevel,
              levelUpTo: newLevel,
            });
          }
        },
      });

      http.post<{ newlyUnlocked: AchievementDto[] }>('/api/achievements/check', {}).subscribe({
        next: (res) => {
          if (res.newlyUnlocked?.length > 0) {
            patchState(store, {
              achievementToastQueue: [...store.achievementToastQueue(), ...res.newlyUnlocked],
            });
          }
        },
      });
    },

    dismissXpToast(id: number): void {
      patchState(store, {
        xpToastQueue: store.xpToastQueue().filter((t) => t.id !== id),
      });
    },

    dismissLevelUp(): void {
      patchState(store, { showLevelUp: false });
    },

    dismissAchievementToast(): void {
      patchState(store, { achievementToastQueue: store.achievementToastQueue().slice(1) });
    },
  })),
);
