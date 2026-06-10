import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { AnalyticsService } from '../stats/analytics.service';
import { AnalyticsDashboardResponse, BatchAnalysisResponse } from '../stats/analytics.models';

interface AnalyticsState {
  dashboard: AnalyticsDashboardResponse | null;
  batchResult: BatchAnalysisResponse | null;
  pendingBatchQuestionIds: string[];
  showBatchPopup: boolean;
  isLoading: boolean;
}

const initialState: AnalyticsState = {
  dashboard: null,
  batchResult: null,
  pendingBatchQuestionIds: [],
  showBatchPopup: false,
  isLoading: false,
};

export const AnalyticsStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(AnalyticsService)) => ({
    loadDashboard(): void {
      patchState(store, { isLoading: true });
      service.getDashboard().subscribe({
        next: (dashboard) => patchState(store, { dashboard, isLoading: false }),
        error: () => patchState(store, { isLoading: false }),
      });
    },
    triggerBatchPopup(questionIds: string[]): void {
      patchState(store, {
        pendingBatchQuestionIds: questionIds,
        showBatchPopup: true,
        batchResult: null,
      });
      service.getBatchAnalysis(questionIds).subscribe({
        next: (batchResult) => patchState(store, { batchResult }),
        error: () => {},
      });
    },
    closePopup(): void {
      patchState(store, { showBatchPopup: false });
    },
  })),
);
