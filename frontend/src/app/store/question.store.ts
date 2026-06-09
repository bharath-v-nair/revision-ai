import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';

interface PendingQuestionDto {
  id: string;
  questionText: string;
  options: { key: string; text: string }[];
  subject: string;
  topic: string;
  scheduledFor: string;
}

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
    selectOption(option: string): void {
      patchState(store, { selectedOption: option, answerState: 'selected' });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
