import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { QuestionService } from '../questions/question.service';
import { GamificationStore } from './gamification.store';
import { PendingQuestionDto, AnswerResult } from '../questions/question.models';

interface QuestionState {
  pendingQuestions: PendingQuestionDto[];
  currentQuestionIndex: number;
  answerState: 'idle' | 'selected' | 'submitted' | 'revealed';
  selectedOption: string | null;
  answerResult: AnswerResult | null;
  answeredCountSinceLastBatch: number;
  recentAnsweredIds: string[];
  recentAnsweredSubjectNames: string[];
  isLoading: boolean;
}

const initialState: QuestionState = {
  pendingQuestions: [],
  currentQuestionIndex: 0,
  answerState: 'idle',
  selectedOption: null,
  answerResult: null,
  answeredCountSinceLastBatch: 0,
  recentAnsweredIds: [],
  recentAnsweredSubjectNames: [],
  isLoading: false,
};

export const QuestionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, service = inject(QuestionService), gamStore = inject(GamificationStore)) => ({
    setPending(questions: PendingQuestionDto[]): void {
      patchState(store, { pendingQuestions: questions, currentQuestionIndex: 0 });
    },
    selectOption(option: string): void {
      patchState(store, { selectedOption: option, answerState: 'selected' });
    },
    markAnswered(result: AnswerResult): void {
      const count = store.answeredCountSinceLastBatch() + 1;
      const currentQ = store.pendingQuestions()[store.currentQuestionIndex()];
      const questionId = currentQ?.question?.id;
      const recentIds = questionId
        ? [...store.recentAnsweredIds().slice(-4), questionId]
        : store.recentAnsweredIds();
      const subjectName = currentQ?.question?.subjectName ?? null;
      const prevSubjects = store.recentAnsweredSubjectNames();
      const recentSubjects = subjectName && !prevSubjects.includes(subjectName)
        ? [...prevSubjects.slice(-4), subjectName]
        : prevSubjects;
      patchState(store, {
        answerResult: result,
        answerState: 'submitted',
        answeredCountSinceLastBatch: count,
        recentAnsweredIds: recentIds,
        recentAnsweredSubjectNames: recentSubjects,
      });
      service.tickStreak().subscribe();
      gamStore.load();
    },
    markRevealed(): void {
      patchState(store, { answerState: 'revealed' });
    },
    advance(): void {
      patchState(store, {
        currentQuestionIndex: store.currentQuestionIndex() + 1,
        answerState: 'idle',
        selectedOption: null,
        answerResult: null,
      });
    },
    resetBatchCount(): void {
      patchState(store, { answeredCountSinceLastBatch: 0, recentAnsweredIds: [], recentAnsweredSubjectNames: [] });
    },
    reset(): void {
      patchState(store, initialState);
    },
  })),
);
