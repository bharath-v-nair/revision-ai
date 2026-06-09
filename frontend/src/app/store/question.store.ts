import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { PendingQuestionDto } from '../dashboard/dashboard.models';

interface QuestionState {
  pendingQuestions: PendingQuestionDto[];
  currentQuestion: PendingQuestionDto | null;
  answerState: 'idle' | 'selected' | 'submitted' | 'revealed';
  selectedOption: string | null;
  answerResult: { isCorrect: boolean; correctOption: string; explanation: string } | null;
  answeredCountSinceLastBatch: number;
  isLoading: boolean;
}

const initialState: QuestionState = {
  pendingQuestions: [],
  currentQuestion: null,
  answerState: 'idle',
  selectedOption: null,
  answerResult: null,
  answeredCountSinceLastBatch: 0,
  isLoading: false,
};

export const QuestionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setPending(questions: PendingQuestionDto[]): void {
      patchState(store, { pendingQuestions: questions });
    },
    selectOption(option: string): void {
      patchState(store, { selectedOption: option, answerState: 'selected' });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
