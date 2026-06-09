import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from './question.service';
import { QuestionStore } from '../store/question.store';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { QuestionCardComponent } from '../shared/question/question-card/question-card.component';
import {
  PendingQuestionDto,
  SubjectDto,
  ChapterDto,
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  AnswerResult,
} from './question.models';

type BrowseView = 'subjects' | 'chapters' | 'questions' | 'detail';

const SUBJECT_ICONS: Record<string, string> = {
  anatomy: '🫀',
  physiology: '🧬',
  biochemistry: '⚗️',
  pathology: '🔬',
  pharmacology: '💊',
  microbiology: '🦠',
  medicine: '🩺',
  surgery: '🔧',
  obstetrics: '👶',
  psychiatry: '🧠',
  forensic: '⚖️',
  community: '🏥',
  default: '📚',
};

function subjectIcon(iconName: string): string {
  const key = iconName.toLowerCase().replace(/\s+/g, '');
  for (const [k, v] of Object.entries(SUBJECT_ICONS)) {
    if (key.includes(k)) return v;
  }
  return SUBJECT_ICONS['default'];
}

@Component({
  selector: 'app-questions',
  imports: [
    RouterLink,
    EmptyStateComponent,
    QuestionCardComponent,
  ],
  template: `
    <div class="flex flex-col h-full">

      <!-- Tab bar -->
      <div class="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          class="flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors"
          [class.border-primary]="activeTab() === 'pending'"
          [class.text-primary]="activeTab() === 'pending'"
          [class.border-transparent]="activeTab() !== 'pending'"
          [class.text-gray-500]="activeTab() !== 'pending'"
          (click)="activeTab.set('pending')"
        >
          Pending
          @if (pendingQuestions().length) {
            <span class="ml-1.5 bg-primary text-white text-xs rounded-full px-1.5 py-0.5">
              {{ pendingQuestions().length }}
            </span>
          }
        </button>
        <button
          class="flex-1 py-3.5 text-sm font-semibold border-b-2 transition-colors"
          [class.border-primary]="activeTab() === 'browse'"
          [class.text-primary]="activeTab() === 'browse'"
          [class.border-transparent]="activeTab() !== 'browse'"
          [class.text-gray-500]="activeTab() !== 'browse'"
          (click)="onBrowseTabClick()"
        >
          Browse
        </button>
      </div>

      <!-- ─── PENDING TAB ─── -->
      @if (activeTab() === 'pending') {
        <div class="flex-1 overflow-hidden">
          @if (loadingPending()) {
            <div class="flex items-center justify-center h-full">
              <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (!pendingQuestions().length) {
            <app-empty-state
              icon="⏰"
              title="No questions waiting"
              subtitle="New questions drop every hour — check back soon!"
            />
          } @else if (currentIndex() >= pendingQuestions().length) {
            <!-- All done -->
            <div class="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
              <span class="text-6xl">🎉</span>
              <h3 class="text-xl font-bold text-gray-900">All done!</h3>
              <p class="text-gray-500 text-sm">You've answered all {{ pendingQuestions().length }} pending questions.</p>
              <a routerLink="/questions/history"
                 class="mt-2 px-6 py-3 bg-primary text-white rounded-full text-sm font-semibold shadow-sm">
                View History
              </a>
            </div>
          } @else {
            <!-- Card area takes full height -->
            <div class="h-full">
              <app-question-card
                [question]="currentQuestion()!.question"
                [pendingQuestionId]="currentQuestion()!.pendingQuestionId"
                [questionIndex]="currentIndex()"
                [totalQuestions]="pendingQuestions().length"
                mode="hourly"
                (answered)="onAnswered($event)"
                (skipped)="onSkip()"
                (bookmarkToggled)="onBookmark($event)"
              />
            </div>
          }
        </div>
      }

      <!-- ─── BROWSE TAB ─── -->
      @if (activeTab() === 'browse') {
        <div class="flex-1 overflow-y-auto">

          <!-- SUBJECTS -->
          @if (browseView() === 'subjects') {
            @if (loadingSubjects()) {
              <div class="flex items-center justify-center py-20">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else {
              <div class="grid grid-cols-2 gap-3 p-4">
                @for (sub of subjects(); track sub.id) {
                  <button
                    class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md active:bg-gray-50 transition-all"
                    (click)="selectSubject(sub)"
                  >
                    <span class="text-3xl block mb-2">{{ subjectEmoji(sub.iconName) }}</span>
                    <p class="text-sm font-semibold text-gray-800 leading-tight">{{ sub.name }}</p>
                    <p class="text-xs text-gray-400 mt-1">{{ sub.questionCount }} questions</p>
                  </button>
                }
              </div>
            }
          }

          <!-- CHAPTERS -->
          @if (browseView() === 'chapters') {
            <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
              <button
                class="p-1.5 rounded-full hover:bg-gray-100"
                (click)="browseView.set('subjects')"
              >
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 class="text-sm font-bold text-gray-800">{{ selectedSubject()?.name }}</h2>
                <p class="text-xs text-gray-400">Select a chapter</p>
              </div>
            </div>
            @if (loadingChapters()) {
              <div class="flex items-center justify-center py-20">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else {
              <div class="divide-y divide-gray-100">
                @for (ch of chapters(); track ch.id) {
                  <button
                    class="w-full text-left px-4 py-4 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between"
                    (click)="selectChapter(ch)"
                  >
                    <div>
                      <p class="text-sm font-semibold text-gray-800">
                        Ch {{ ch.chapterNumber }}. {{ ch.title }}
                      </p>
                      <p class="text-xs text-gray-400 mt-0.5">{{ ch.questionCount }} questions</p>
                    </div>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                }
              </div>
            }
          }

          <!-- QUESTIONS LIST -->
          @if (browseView() === 'questions') {
            <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 z-10">
              <button
                class="p-1.5 rounded-full hover:bg-gray-100"
                (click)="browseView.set('chapters')"
              >
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 class="text-sm font-bold text-gray-800">Ch {{ selectedChapter()?.chapterNumber }}. {{ selectedChapter()?.title }}</h2>
                <p class="text-xs text-gray-400">{{ browseQuestions().length }} questions</p>
              </div>
            </div>
            @if (loadingBrowseQuestions()) {
              <div class="flex items-center justify-center py-20">
                <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else {
              <div class="divide-y divide-gray-100">
                @for (q of browseQuestions(); track q.id) {
                  <button
                    class="w-full text-left px-4 py-4 hover:bg-gray-50 active:bg-gray-100"
                    (click)="openDetail(q)"
                  >
                    <div class="flex items-start gap-3">
                      <span class="flex-shrink-0 text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-2 py-1">
                        Q{{ q.questionNumber }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 leading-snug">
                          {{ truncate(q.questionText, 80) }}
                        </p>
                        @if (q.subjectName) {
                          <span class="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {{ q.subjectName }}
                          </span>
                        }
                      </div>
                    </div>
                  </button>
                }
                @if (browseHasMore()) {
                  <div class="p-4 text-center">
                    <button
                      class="px-6 py-2.5 border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50"
                      [disabled]="loadingMore()"
                      (click)="loadMore()"
                    >
                      {{ loadingMore() ? 'Loading…' : 'Load more' }}
                    </button>
                  </div>
                }
              </div>
            }
          }

        </div>
      }

      <!-- ─── QUESTION DETAIL SHEET (Browse) ─── -->
      @if (detailSheetOpen()) {
        <div class="fixed inset-0 z-50 flex items-end">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40" (click)="closeDetailSheet()"></div>

          <!-- Sheet -->
          <div class="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col z-10">
            <!-- Handle -->
            <div class="flex justify-center pt-3 pb-1">
              <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <!-- Close -->
            <div class="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
              <span class="text-sm font-semibold text-gray-600">Q{{ detailQuestion()?.questionNumber }}</span>
              <button
                class="p-1.5 rounded-full hover:bg-gray-100"
                (click)="closeDetailSheet()"
              >
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Scrollable content -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              <p class="text-sm font-medium text-gray-900 leading-relaxed">
                {{ detailQuestion()?.questionText }}
              </p>

              <!-- Options -->
              <div class="space-y-2.5">
                @for (opt of OPTIONS; track opt) {
                  <div
                    class="px-4 py-3 rounded-2xl border-2 flex items-center gap-3 text-sm font-medium"
                    [class]="detailOptionClass(opt)"
                  >
                    <span
                      class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      [class]="detailOptionKeyClass(opt)"
                    >{{ opt }}</span>
                    {{ getDetailOptionText(opt) }}
                  </div>
                }
              </div>

              <!-- Reveal button / Explanation -->
              @if (!detailRevealed()) {
                <button
                  class="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-sm shadow-sm"
                  [disabled]="loadingDetail()"
                  (click)="revealDetailAnswer()"
                >
                  {{ loadingDetail() ? 'Loading…' : 'Reveal Answer' }}
                </button>
              } @else {
                <div class="bg-gray-50 rounded-2xl p-4">
                  <p class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Explanation</p>
                  <p class="text-sm text-gray-700 leading-relaxed">{{ detailFull()?.explanation }}</p>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
})
export default class QuestionsPage implements OnInit {
  private service = inject(QuestionService);
  private questionStore = inject(QuestionStore);

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;

  // Tabs
  protected activeTab = signal<'pending' | 'browse'>('pending');

  // Pending tab
  protected loadingPending = signal(false);
  protected pendingQuestions = signal<PendingQuestionDto[]>([]);
  protected currentIndex = signal(0);

  protected currentQuestion = computed(() => this.pendingQuestions()[this.currentIndex()] ?? null);

  // Browse tab
  protected browseView = signal<BrowseView>('subjects');
  protected subjects = signal<SubjectDto[]>([]);
  protected loadingSubjects = signal(false);
  protected subjectsLoaded = false;

  protected selectedSubject = signal<SubjectDto | null>(null);
  protected chapters = signal<ChapterDto[]>([]);
  protected loadingChapters = signal(false);

  protected selectedChapter = signal<ChapterDto | null>(null);
  protected browseQuestions = signal<QuestionWithoutAnswersDto[]>([]);
  protected loadingBrowseQuestions = signal(false);
  protected loadingMore = signal(false);
  protected browseHasMore = signal(false);
  protected browsePage = signal(1);

  // Detail sheet
  protected detailSheetOpen = signal(false);
  protected detailQuestion = signal<QuestionWithoutAnswersDto | null>(null);
  protected detailFull = signal<QuestionDetailDto | null>(null);
  protected detailRevealed = signal(false);
  protected loadingDetail = signal(false);

  ngOnInit(): void {
    this.loadPending();
  }

  private loadPending(): void {
    const stored = this.questionStore.pendingQuestions();
    if (stored.length) {
      this.pendingQuestions.set(stored);
      return;
    }
    this.loadingPending.set(true);
    this.service.getPendingQuestions().subscribe({
      next: (res) => {
        this.pendingQuestions.set(res.data);
        this.questionStore.setPending(res.data);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false),
    });
  }

  protected onAnswered(event: { selectedOption: string; result: AnswerResult }): void {
    this.questionStore.markAnswered(event.result);
    // 2-second delay then advance
    setTimeout(() => {
      this.currentIndex.update(i => i + 1);
      this.questionStore.advance();
    }, 2000);
  }

  protected onSkip(): void {
    this.currentIndex.update(i => i + 1);
    this.questionStore.advance();
  }

  protected onBookmark(questionId: string): void {
    // handled within BookmarkButtonComponent
  }

  // Browse
  protected onBrowseTabClick(): void {
    this.activeTab.set('browse');
    if (!this.subjectsLoaded) {
      this.loadSubjects();
    }
  }

  private loadSubjects(): void {
    this.loadingSubjects.set(true);
    this.service.getSubjects().subscribe({
      next: (res) => {
        this.subjects.set(res.data);
        this.loadingSubjects.set(false);
        this.subjectsLoaded = true;
      },
      error: () => this.loadingSubjects.set(false),
    });
  }

  protected selectSubject(sub: SubjectDto): void {
    this.selectedSubject.set(sub);
    this.browseView.set('chapters');
    this.loadingChapters.set(true);
    this.service.getChapters(sub.slug).subscribe({
      next: (res) => {
        this.chapters.set(res.data);
        this.loadingChapters.set(false);
      },
      error: () => this.loadingChapters.set(false),
    });
  }

  protected selectChapter(ch: ChapterDto): void {
    this.selectedChapter.set(ch);
    this.browseView.set('questions');
    this.browseQuestions.set([]);
    this.browsePage.set(1);
    this.browseHasMore.set(false);
    this.loadBrowseQuestions(1);
  }

  private loadBrowseQuestions(page: number): void {
    const sub = this.selectedSubject()!;
    const ch = this.selectedChapter()!;
    if (page === 1) this.loadingBrowseQuestions.set(true);
    else this.loadingMore.set(true);

    this.service.getQuestions(sub.slug, ch.chapterNumber, page).subscribe({
      next: (res) => {
        this.browseQuestions.update(q => [...q, ...res.data]);
        this.browseHasMore.set(res.meta.hasNext);
        this.browsePage.set(res.meta.page);
        this.loadingBrowseQuestions.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingBrowseQuestions.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  protected loadMore(): void {
    this.loadBrowseQuestions(this.browsePage() + 1);
  }

  // Detail sheet
  protected openDetail(q: QuestionWithoutAnswersDto): void {
    this.detailQuestion.set(q);
    this.detailFull.set(null);
    this.detailRevealed.set(false);
    this.loadingDetail.set(false);
    this.detailSheetOpen.set(true);
  }

  protected closeDetailSheet(): void {
    this.detailSheetOpen.set(false);
  }

  protected revealDetailAnswer(): void {
    const q = this.detailQuestion();
    if (!q) return;
    this.loadingDetail.set(true);
    this.service.getQuestionDetail(q.id).subscribe({
      next: (res) => {
        this.detailFull.set(res.data);
        this.detailRevealed.set(true);
        this.loadingDetail.set(false);
      },
      error: () => this.loadingDetail.set(false),
    });
  }

  protected detailOptionClass(opt: string): string {
    if (!this.detailRevealed()) return 'bg-white border-gray-200 text-gray-700';
    const correct = this.detailFull()?.correctOption;
    if (opt === correct) return 'bg-green-50 border-green-500 text-green-800';
    return 'bg-white border-gray-200 text-gray-500 opacity-70';
  }

  protected detailOptionKeyClass(opt: string): string {
    if (!this.detailRevealed()) return 'border-gray-300 text-gray-500';
    const correct = this.detailFull()?.correctOption;
    if (opt === correct) return 'border-green-500 bg-green-500 text-white';
    return 'border-gray-300 text-gray-400';
  }

  protected getDetailOptionText(opt: string): string {
    const q = this.detailQuestion() as any;
    return q?.[`option${opt}`] ?? '';
  }

  // Helpers
  protected subjectEmoji(iconName: string): string {
    return subjectIcon(iconName);
  }

  protected truncate(text: string, len: number): string {
    return text.length > len ? text.slice(0, len) + '…' : text;
  }
}
