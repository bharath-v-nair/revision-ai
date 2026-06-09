import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { forkJoin } from 'rxjs';
import { DashboardService } from './dashboard.service';
import { DashboardResponse, XpSummaryResponse } from './dashboard.models';
import { GamificationStore } from '../store/gamification.store';
import { QuestionStore } from '../store/question.store';

interface DashboardState {
  stats: DashboardResponse | null;
  xpSummary: XpSummaryResponse | null;
  pendingCount: number;
  earliestExpiry: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  stats: null,
  xpSummary: null,
  pendingCount: 0,
  earliestExpiry: null,
  isLoading: false,
  error: null,
};

export const DashboardStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (
      store,
      service = inject(DashboardService),
      gamStore = inject(GamificationStore),
      questionStore = inject(QuestionStore),
    ) => ({
      load(): void {
        patchState(store, { isLoading: true, error: null });
        forkJoin({
          dashboard: service.getDashboard(),
          xp: service.getXpSummary(),
          streaks: service.getStreaks(),
          pending: service.getPendingQuestions(),
        }).subscribe({
          next: ({ dashboard, xp, streaks, pending }) => {
            const sorted = [...pending.data].sort(
              (a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime(),
            );

            patchState(store, {
              stats: dashboard,
              xpSummary: xp,
              pendingCount: pending.data.length,
              earliestExpiry: sorted[0]?.expiresAt ?? null,
              isLoading: false,
            });

            gamStore.setData(xp, streaks);
            questionStore.setPending(pending.data);
          },
          error: () =>
            patchState(store, { isLoading: false, error: 'Failed to load dashboard' }),
        });
      },
    }),
  ),
);
