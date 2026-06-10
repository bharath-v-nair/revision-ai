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
import { QuestionCardComponent } from '../shared/question/question-card/question-card.component';
import {
  PendingQuestionDto,
  SubjectDto,
  ChapterDto,
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  MediaDto,
  AnswerResult,
  QuestionReportDto,
} from './question.models';
import { BookmarkButtonComponent } from '../shared/question/bookmark-button/bookmark-button.component';
import { QuestionReportSheetComponent } from '../shared/question/question-report/question-report-sheet.component';

type BrowseView = 'subjects' | 'chapters' | 'questions';

const SUBJECT_ICON_MAP: Record<string, string> = {
  anaesthesia: '💉', anesthesia: '💉',
  anatomy: '🫀',
  physiology: '🧬',
  biochemistry: '⚗️',
  pathology: '🔬',
  pharmacology: '💊',
  microbiology: '🦠',
  medicine: '🩺', internal: '🩺',
  surgery: '🔪',
  obstetrics: '👶', gynaecology: '👶', gynecology: '👶',
  psychiatry: '🧠',
  forensic: '⚖️',
  community: '🏥', preventive: '🏥',
  ophthalmology: '👁️',
  ent: '👂',
  dermatology: '🩹',
  radiology: '☢️',
  paediatrics: '🍼', pediatrics: '🍼',
  orthopaedics: '🦴', orthopedics: '🦴',
};

function subjectEmoji(iconName: string | null | undefined): string {
  if (!iconName) return '📚';
  const key = iconName.toLowerCase().replace(/[\s_-]+/g, '');
  for (const [k, v] of Object.entries(SUBJECT_ICON_MAP)) {
    if (key.includes(k)) return v;
  }
  return '📚';
}

@Component({
  selector: 'app-questions',
  imports: [
    RouterLink,
    QuestionCardComponent,
    BookmarkButtonComponent,
    QuestionReportSheetComponent,
  ],
  template: `
    <!-- Outer container: viewport height minus bottom nav -->
    <div class="flex flex-col" style="height: calc(100vh - 64px)">

      <!-- Tab bar -->
      <div class="flex border-b border-gray-200 bg-white flex-shrink-0">
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
        <div class="flex-1 overflow-hidden flex flex-col">
          @if (loadingPending()) {
            <div class="flex-1 flex items-center justify-center">
              <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (!pendingQuestions().length) {
            <!-- Empty state -->
            <div class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span class="text-6xl">⏰</span>
              <h3 class="text-xl font-bold text-gray-900">No questions waiting</h3>
              <p class="text-gray-500 text-sm">New questions drop every hour. Check back soon!</p>
              <button
                class="px-5 py-2.5 bg-primary text-white rounded-full text-sm font-semibold shadow-sm active:opacity-80"
                [disabled]="loadingPending()"
                (click)="refreshPending()"
              >
                Check Now
              </button>
              <a routerLink="/questions/history"
                 class="text-sm text-primary font-medium underline underline-offset-2">
                View History
              </a>
            </div>
          } @else if (currentIndex() >= pendingQuestions().length) {
            <!-- All done -->
            <div class="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span class="text-6xl">🎉</span>
              <h3 class="text-xl font-bold text-gray-900">All done!</h3>
              <p class="text-gray-500 text-sm">You've answered all {{ pendingQuestions().length }} pending questions.</p>
              <a routerLink="/questions/history"
                 class="mt-2 px-6 py-3 bg-primary text-white rounded-full text-sm font-semibold shadow-sm">
                View History
              </a>
            </div>
          } @else {
            <!-- Card — flex-1 means it fills remaining height -->
            <div class="flex-1 overflow-hidden">
              <app-question-card
                [question]="currentQuestion()!.question"
                [pendingQuestionId]="currentQuestion()!.pendingQuestionId"
                [questionIndex]="currentIndex()"
                [totalQuestions]="pendingQuestions().length"
                mode="hourly"
                [isReported]="isQuestionReported(currentQuestion()!.question.id)"
                (answered)="onAnswered($event)"
                (skipped)="onSkip()"
                (bookmarkToggled)="onBookmark($event)"
                (reportTap)="openReportSheet(currentQuestion()!.question.id, currentQuestion()!.question.questionNumber)"
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
            } @else if (!subjects().length) {
              <div class="flex flex-col items-center justify-center py-20 gap-3">
                <span class="text-4xl">📚</span>
                <p class="text-gray-500 text-sm">No subjects found.</p>
              </div>
            } @else {
              <div class="grid grid-cols-2 gap-3 p-4">
                @for (sub of subjects(); track sub.id) {
                  <button
                    class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:shadow-md active:bg-gray-50 transition-all"
                    (click)="selectSubject(sub)"
                  >
                    <span class="text-3xl block mb-2">{{ emoji(sub.iconName) }}</span>
                    <p class="text-sm font-semibold text-gray-800 leading-tight">{{ sub.name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ sub.questionCount }} questions</p>
                  </button>
                }
              </div>
            }
          }

          <!-- CHAPTERS -->
          @if (browseView() === 'chapters') {
            <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <button class="p-1.5 rounded-full hover:bg-gray-100" (click)="browseView.set('subjects')">
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
                      <p class="text-sm font-semibold text-gray-800">Ch {{ ch.chapterNumber }}. {{ ch.title }}</p>
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
            <div class="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
              <button class="p-1.5 rounded-full hover:bg-gray-100" (click)="browseView.set('chapters')">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <div>
                <h2 class="text-sm font-bold text-gray-800">
                  Ch {{ selectedChapter()?.chapterNumber }}. {{ selectedChapter()?.title }}
                </h2>
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
                      <span class="flex-shrink-0 text-xs font-bold text-gray-400 bg-gray-100 rounded-lg px-2 py-1 mt-0.5">
                        Q{{ q.questionNumber }}
                      </span>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 leading-snug">{{ truncate(q.questionText, 80) }}</p>
                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                          @if (q.subjectName) {
                            <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                              {{ q.subjectName }}
                            </span>
                          }
                          @if (q.hasMedia) {
                            <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">📷 Image</span>
                          }
                        </div>
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

    </div>

    <!-- ─── REPORT ISSUE SHEET (QA feature) ─── -->
    @if (reportSheetOpen()) {
      <app-question-report-sheet
        [questionId]="reportSheetQuestionId()"
        [questionNumber]="reportSheetQuestionNumber()"
        (dismissed)="reportSheetOpen.set(false)"
        (submitted)="onReportSubmitted($event)"
        (cleared)="onReportCleared()"
      />
    }

    <!-- ─── QUESTION DETAIL SHEET (Browse) ─── -->
    @if (detailSheetOpen()) {
      <div class="fixed inset-0 z-50 flex items-end">
        <div class="absolute inset-0 bg-black/40" (click)="closeDetailSheet()"></div>
        <div class="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col z-10">
          <!-- Handle -->
          <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <!-- Header -->
          <div class="flex items-center justify-between px-4 pb-3 border-b border-gray-100 flex-shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-600">Q{{ detailQuestion()?.questionNumber }}</span>
              @if (detailQuestion()?.subjectName) {
                <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  {{ detailQuestion()!.subjectName }}
                </span>
              }
            </div>
            <div class="flex items-center gap-1">
              @if (detailQuestion()) {
                <!-- QA flag button — prominent in detail sheet (QA feature) -->
                <button
                  class="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all"
                  [class]="isQuestionReported(detailQuestion()!.id) ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-400'"
                  (click)="openReportSheet(detailQuestion()!.id, detailQuestion()!.questionNumber)"
                >
                  <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 01.707 1.707L13.414 9l3.293 3.293A1 1 0 0116 14H4a1 1 0 01-1-1V5zm0 0" clip-rule="evenodd"/>
                    <path d="M3 5v9"/>
                  </svg>
                  {{ isQuestionReported(detailQuestion()!.id) ? 'Reported' : 'Report' }}
                </button>
                <app-bookmark-button
                  [questionId]="detailQuestion()!.id"
                  (bookmarkToggled)="onBookmark($event)"
                />
              }
              <button class="p-1.5 rounded-full hover:bg-gray-100" (click)="closeDetailSheet()">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Scrollable content -->
          <div class="flex-1 overflow-y-auto p-4 space-y-3">

            <!-- Question images — shown BEFORE answering -->
            @if (loadingDetailMedia()) {
              <div class="rounded-xl bg-gray-100 animate-pulse h-40"></div>
            } @else if (detailQuestionMedia().length) {
              <div class="space-y-2">
                @for (m of detailQuestionMedia(); track m.id) {
                  @if (isHttpUrl(m.blobUrl)) {
                    <figure class="rounded-xl overflow-hidden bg-gray-100">
                      <img
                        [src]="m.blobUrl"
                        [alt]="m.description ?? 'Question image'"
                        class="w-full object-contain max-h-60"
                        (error)="onImgError($event)"
                      />
                      @if (m.description) {
                        <figcaption class="text-xs text-gray-500 px-3 py-1.5 italic">{{ m.description }}</figcaption>
                      }
                    </figure>
                  } @else {
                    <div class="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5 flex items-center gap-2 text-sm text-slate-600">
                      <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      <span class="italic">{{ m.description ?? ('Figure, page ' + m.pageNumber) }}</span>
                    </div>
                  }
                }
              </div>
            }

            <!-- Question text -->
            <p class="text-sm font-medium text-gray-900 leading-relaxed">
              {{ detailQuestion()?.questionText }}
            </p>

            <!-- Options — selectable BEFORE reveal, shows result AFTER -->
            <div class="space-y-2.5">
              @for (opt of OPTIONS; track opt) {
                <button
                  class="w-full text-left px-4 py-3 rounded-2xl border-2 flex items-center gap-3 text-sm font-medium transition-colors"
                  [class]="detailOptionClass(opt)"
                  [disabled]="detailRevealed()"
                  (click)="detailGuess.set(opt)"
                >
                  <span
                    class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2"
                    [class]="detailOptionKeyClass(opt)"
                  >{{ opt }}</span>
                  <span class="flex-1">{{ getDetailOptionText(opt) }}</span>
                  @if (detailRevealed()) {
                    @if (opt === detailFull()?.correctOption) {
                      <span class="text-green-600 font-bold">✓</span>
                    } @else if (opt === detailGuess() && opt !== detailFull()?.correctOption) {
                      <span class="text-red-500">✗</span>
                    }
                  }
                </button>
              }
            </div>

            <!-- Reveal button / Explanation -->
            @if (!detailRevealed()) {
              <button
                class="w-full py-4 bg-primary text-white rounded-2xl font-semibold text-sm shadow-sm active:opacity-80 disabled:opacity-60"
                [disabled]="loadingDetail()"
                (click)="revealDetailAnswer()"
              >
                {{ loadingDetail() ? 'Loading…' : detailGuess() ? 'Check My Answer' : 'Reveal Answer' }}
              </button>
            } @else {
              <!-- Result banner -->
              @if (detailGuess()) {
                <div
                  class="rounded-2xl px-4 py-3 flex items-center gap-3"
                  [class]="detailGuess() === detailFull()?.correctOption ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'"
                >
                  <span class="text-xl">{{ detailGuess() === detailFull()?.correctOption ? '✅' : '❌' }}</span>
                  <span class="text-sm font-semibold"
                        [class]="detailGuess() === detailFull()?.correctOption ? 'text-green-800' : 'text-red-800'">
                    {{ detailGuess() === detailFull()?.correctOption ? 'Correct!' : 'Incorrect — correct answer is ' + detailFull()?.correctOption }}
                  </span>
                </div>
              }
              <!-- Explanation -->
              <div class="bg-gray-50 rounded-2xl p-4 space-y-3">
                <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Explanation</p>
                @if (detailExplanationMedia().length) {
                  <div class="space-y-2">
                    @for (m of detailExplanationMedia(); track m.id) {
                      @if (isHttpUrl(m.blobUrl)) {
                        <figure class="rounded-xl overflow-hidden bg-white border border-gray-200">
                          <img
                            [src]="m.blobUrl"
                            [alt]="m.description ?? 'Explanation image'"
                            class="w-full object-contain max-h-52"
                            (error)="onImgError($event)"
                          />
                          @if (m.description) {
                            <figcaption class="text-xs text-gray-500 px-3 py-1.5 italic">{{ m.description }}</figcaption>
                          }
                        </figure>
                      } @else {
                        <div class="rounded-xl bg-white border border-slate-200 px-3 py-2.5 flex items-center gap-2 text-sm text-slate-600">
                          <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                          <span class="italic">{{ m.description ?? ('Figure, page ' + m.pageNumber) }}</span>
                        </div>
                      }
                    }
                  </div>
                }
                <p class="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{{ detailFull()?.explanation }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export default class QuestionsPage implements OnInit {
  private service = inject(QuestionService);
  private questionStore = inject(QuestionStore);

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;

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
  private subjectsLoaded = false;

  protected selectedSubject = signal<SubjectDto | null>(null);
  protected chapters = signal<ChapterDto[]>([]);
  protected loadingChapters = signal(false);

  protected selectedChapter = signal<ChapterDto | null>(null);
  protected browseQuestions = signal<QuestionWithoutAnswersDto[]>([]);
  protected loadingBrowseQuestions = signal(false);
  protected loadingMore = signal(false);
  protected browseHasMore = signal(false);
  protected browsePage = signal(1);

  // Report sheet (QA feature)
  protected reportSheetOpen = signal(false);
  protected reportSheetQuestionId = signal<string>('');
  protected reportSheetQuestionNumber = signal<number>(0);
  protected reportedQuestionIds = signal(new Set<string>());

  // Detail sheet
  protected detailSheetOpen = signal(false);
  protected detailQuestion = signal<QuestionWithoutAnswersDto | null>(null);
  protected detailFull = signal<QuestionDetailDto | null>(null);
  protected detailRevealed = signal(false);
  protected loadingDetail = signal(false);
  protected detailMedia = signal<MediaDto[]>([]);
  protected loadingDetailMedia = signal(false);
  protected detailGuess = signal<string | null>(null);

  protected readonly detailQuestionMedia = computed(() => this.detailMedia().filter(m => !m.isExplanation));
  protected readonly detailExplanationMedia = computed(() => this.detailMedia().filter(m => m.isExplanation));

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

  protected refreshPending(): void {
    this.questionStore.reset();
    this.currentIndex.set(0);
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
    this.currentIndex.update(i => i + 1);
    this.questionStore.advance();
  }

  protected onSkip(): void {
    this.currentIndex.update(i => i + 1);
    this.questionStore.advance();
  }

  protected onBookmark(_questionId: string): void {}

  // Browse
  protected onBrowseTabClick(): void {
    this.activeTab.set('browse');
    if (!this.subjectsLoaded) this.loadSubjects();
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
      next: (res) => { this.chapters.set(res.data); this.loadingChapters.set(false); },
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
      error: () => { this.loadingBrowseQuestions.set(false); this.loadingMore.set(false); },
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
    this.detailMedia.set([]);
    this.detailGuess.set(null);
    this.detailSheetOpen.set(true);

    // Load media immediately (separate endpoint — doesn't expose correct answer)
    if (q.hasMedia) {
      this.loadingDetailMedia.set(true);
      this.service.getQuestionMediaOnly(q.id).subscribe({
        next: (res) => { this.detailMedia.set(res.data); this.loadingDetailMedia.set(false); },
        error: () => this.loadingDetailMedia.set(false),
      });
    }
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
        // Merge explanation media from the full detail response into detailMedia
        // so detailExplanationMedia() computed signal picks them up
        const existing = this.detailMedia();
        const existingIds = new Set(existing.map(m => m.id));
        const newItems = res.data.media.filter(m => !existingIds.has(m.id));
        if (newItems.length) this.detailMedia.update(prev => [...prev, ...newItems]);
        this.detailRevealed.set(true);
        this.loadingDetail.set(false);
      },
      error: () => this.loadingDetail.set(false),
    });
  }

  // QA report sheet helpers
  protected openReportSheet(questionId: string, questionNumber: number): void {
    this.reportSheetQuestionId.set(questionId);
    this.reportSheetQuestionNumber.set(questionNumber);
    this.reportSheetOpen.set(true);
  }

  protected onReportSubmitted(report: QuestionReportDto): void {
    this.reportedQuestionIds.update(s => new Set([...s, report.questionId]));
    this.reportSheetOpen.set(false);
  }

  protected onReportCleared(): void {
    const id = this.reportSheetQuestionId();
    this.reportedQuestionIds.update(s => { const n = new Set(s); n.delete(id); return n; });
    this.reportSheetOpen.set(false);
  }

  protected isQuestionReported(questionId: string): boolean {
    return this.reportedQuestionIds().has(questionId);
  }

  protected detailOptionClass(opt: string): string {
    const guess = this.detailGuess();
    const revealed = this.detailRevealed();
    const correct = this.detailFull()?.correctOption;

    if (revealed) {
      if (opt === correct) return 'bg-green-50 border-green-500 text-green-800 cursor-default';
      if (opt === guess && opt !== correct) return 'bg-red-50 border-red-400 text-red-800 cursor-default';
      return 'bg-white border-gray-200 text-gray-400 opacity-60 cursor-default';
    }
    if (opt === guess) return 'bg-indigo-50 border-primary text-gray-900';
    return 'bg-white border-gray-300 text-gray-700 hover:border-gray-400 active:bg-gray-50';
  }

  protected detailOptionKeyClass(opt: string): string {
    const guess = this.detailGuess();
    const revealed = this.detailRevealed();
    const correct = this.detailFull()?.correctOption;

    if (revealed) {
      if (opt === correct) return 'border-green-500 bg-green-500 text-white';
      if (opt === guess) return 'border-red-400 bg-red-400 text-white';
      return 'border-gray-200 text-gray-300';
    }
    if (opt === guess) return 'border-primary bg-primary text-white';
    return 'border-gray-300 text-gray-500';
  }

  protected getDetailOptionText(opt: string): string {
    return (this.detailQuestion() as any)?.[`option${opt}`] ?? '';
  }

  protected isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }

  protected onImgError(e: Event): void {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    const fig = img.closest('figure');
    if (fig) {
      const fallback = document.createElement('div');
      fallback.className = 'px-4 py-3 flex items-center gap-2 text-sm text-gray-500';
      fallback.textContent = '📷 Image not available in dev environment';
      fig.appendChild(fallback);
    }
  }

  // Helpers
  protected emoji(iconName: string | null | undefined): string {
    return subjectEmoji(iconName);
  }

  protected truncate(text: string, len: number): string {
    return text.length > len ? text.slice(0, len) + '…' : text;
  }
}
