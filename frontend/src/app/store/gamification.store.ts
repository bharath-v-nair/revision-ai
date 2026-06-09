import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { forkJoin } from 'rxjs';

interface GamificationState {
  totalXp: number;
  currentLevel: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  isAtRisk: boolean;
  isLoading: boolean;
}

const initialState: GamificationState = {
  totalXp: 0,
  currentLevel: 1,
  xpToNextLevel: 100,
  currentStreak: 0,
  longestStreak: 0,
  isAtRisk: false,
  isLoading: false,
};

export const GamificationStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    load(): void {
      patchState(store, { isLoading: true });
      forkJoin({
        xp: http.get<any>('http://localhost:5000/api/xp/summary'),
        streaks: http.get<any>('http://localhost:5000/api/streaks'),
      }).subscribe({
        next: ({ xp, streaks }) => {
          patchState(store, {
            totalXp: xp.totalXp ?? 0,
            currentLevel: xp.currentLevel ?? 1,
            xpToNextLevel: xp.xpToNextLevel ?? 100,
            currentStreak: streaks.currentStreak ?? 0,
            longestStreak: streaks.longestStreak ?? 0,
            isAtRisk: streaks.isAtRisk ?? false,
            isLoading: false,
          });
        },
        error: () => patchState(store, { isLoading: false }),
      });
    },
  })),
);
