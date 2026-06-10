import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { forkJoin } from 'rxjs';
import { DueQuestionDto, SrStatsDto } from '../review/review.models';
import { PaginatedMeta } from '../questions/question.models';

interface ReviewState {
  stats: SrStatsDto | null;
  dueQuestions: DueQuestionDto[];
  currentIndex: number;
  reviewedCount: number;
  correctCount: number;
  isLoading: boolean;
}

const initialState: ReviewState = {
  stats: null,
  dueQuestions: [],
  currentIndex: 0,
  reviewedCount: 0,
  correctCount: 0,
  isLoading: false,
};

export const ReviewStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, http = inject(HttpClient)) => ({
    load(): void {
      patchState(store, { isLoading: true });
      forkJoin({
        stats: http.get<SrStatsDto>('/api/spaced-repetition/stats'),
        due: http.get<{ data: DueQuestionDto[]; meta: PaginatedMeta }>(
          '/api/spaced-repetition/due?page=1&pageSize=20',
        ),
      }).subscribe({
        next: ({ stats, due }) => {
          patchState(store, {
            stats,
            dueQuestions: due.data,
            currentIndex: 0,
            reviewedCount: 0,
            correctCount: 0,
            isLoading: false,
          });
        },
        error: () => patchState(store, { isLoading: false }),
      });
    },
    advance(): void {
      patchState(store, { currentIndex: store.currentIndex() + 1 });
    },
    recordResult(isCorrect: boolean): void {
      patchState(store, {
        reviewedCount: store.reviewedCount() + 1,
        correctCount: isCorrect ? store.correctCount() + 1 : store.correctCount(),
      });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
