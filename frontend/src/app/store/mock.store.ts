import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { MockSessionDetail, MockQuestionDto } from '../mock/mock.models';

interface AnswerRecord {
  selectedOption: string;
  timeTakenMs: number;
  answeredAt: number;
}

interface MockState {
  currentSession: MockSessionDetail | null;
  questions: MockQuestionDto[];
  answers: Record<string, AnswerRecord>;
  currentQuestionIndex: number;
  timer: number;
  status: 'idle' | 'building' | 'taking' | 'submitting' | 'results';
  isLoading: boolean;
}

const initialState: MockState = {
  currentSession: null,
  questions: [],
  answers: {},
  currentQuestionIndex: 0,
  timer: 0,
  status: 'idle',
  isLoading: false,
};

export const MockStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setSession(session: MockSessionDetail): void {
      const timer = session.timeLimitMinutes ? session.timeLimitMinutes * 60 : 0;
      patchState(store, {
        currentSession: session,
        questions: session.questions,
        answers: {},
        currentQuestionIndex: 0,
        timer,
        status: 'taking',
        isLoading: false,
      });
    },
    recordAnswer(questionId: string, selectedOption: string, timeTakenMs: number): void {
      patchState(store, {
        answers: {
          ...store.answers(),
          [questionId]: { selectedOption, timeTakenMs, answeredAt: Date.now() },
        },
      });
    },
    removeAnswer(questionId: string): void {
      const next = { ...store.answers() };
      delete next[questionId];
      patchState(store, { answers: next });
    },
    setCurrentIndex(idx: number): void {
      patchState(store, { currentQuestionIndex: idx });
    },
    tickTimer(): void {
      patchState(store, { timer: store.timer() + 1 });
    },
    tickCountdown(): void {
      patchState(store, { timer: Math.max(0, store.timer() - 1) });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
