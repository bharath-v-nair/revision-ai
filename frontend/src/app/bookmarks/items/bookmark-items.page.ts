import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import {
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  PaginatedMeta,
  MediaDto,
  BookmarkCollection,
} from '../../questions/question.models';

type SortKey = 'newest' | 'oldest' | 'az';

@Component({
  selector: 'app-bookmark-items',
  imports: [],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button
          class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200"
          (click)="location.back()"
        >
          <svg class="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-gray-800 truncate">{{ collectionName() }}</h1>
          <p class="text-xs text-gray-400">{{ filteredItems().length }} of {{ allItems().length }} questions</p>
        </div>
      </div>

      <!-- Sort / Filter bar -->
      @if (allItems().length > 0) {
        <div class="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto flex-shrink-0">
          <!-- Sort -->
          <select
            class="text-xs border border-gray-200 rounded-xl px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
            [value]="sortBy()"
            (change)="sortBy.set($any($event.target).value)"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">A–Z</option>
          </select>

          <!-- Subject filter -->
          @if (availableSubjects().length > 1) {
            <select
              class="text-xs border border-gray-200 rounded-xl px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              [value]="filterSubject()"
              (change)="onSubjectFilterChange($any($event.target).value)"
            >
              <option value="">All subjects</option>
              @for (s of availableSubjects(); track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          }

          <!-- Chapter filter (only if subject chosen) -->
          @if (filterSubject() && availableChapters().length > 1) {
            <select
              class="text-xs border border-gray-200 rounded-xl px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary bg-white"
              [value]="filterChapter()"
              (change)="filterChapter.set($any($event.target).value)"
            >
              <option value="">All chapters</option>
              @for (c of availableChapters(); track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          }

          <!-- Clear filters badge -->
          @if (filterSubject() || filterChapter()) {
            <button
              class="text-xs text-red-500 px-2 py-1.5 rounded-xl hover:bg-red-50 flex-shrink-0"
              (click)="clearFilters()"
            >× Clear</button>
          }
        </div>
      }

      <!-- Body -->
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading…</p>
        </div>
      } @else if (filteredItems().length === 0 && allItems().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span class="text-4xl">🔖</span>
          <p class="text-gray-500 text-sm">No bookmarks in this collection yet</p>
        </div>
      } @else if (filteredItems().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span class="text-4xl">🔍</span>
          <p class="text-gray-500 text-sm">No questions match your filters</p>
          <button class="text-primary text-sm font-medium" (click)="clearFilters()">Clear filters</button>
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          @for (item of filteredItems(); track item.id; let i = $index) {
            <div class="relative overflow-hidden border-b border-gray-100 bg-white">
              <!-- Swipeable content -->
              <div
                class="px-4 py-3.5 transition-transform duration-200"
                [style.transform]="revealedId() === item.id ? 'translateX(-70px)' : 'translateX(0)'"
                (touchstart)="onItemTouchStart($event, item.id)"
                (touchmove)="onItemTouchMove($event)"
                (touchend)="onItemTouchEnd($event, item.id)"
                (click)="openDetail(item)"
              >
                <div class="flex items-start gap-3">
                  <span class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex-shrink-0 mt-0.5">
                    Q{{ item.questionNumber }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-800 leading-snug line-clamp-2">{{ item.questionText }}</p>
                    <div class="flex flex-wrap gap-1.5 mt-1.5">
                      @if (item.subjectName) {
                        <span class="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                          {{ item.subjectName }}
                        </span>
                      }
                      @if (item.chapterTitle) {
                        <span class="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                          {{ item.chapterTitle }}
                        </span>
                      }
                    </div>
                  </div>
                  <!-- Desktop: inline delete button -->
                  <button
                    class="hidden md:flex flex-shrink-0 p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    (click)="$event.stopPropagation(); deleteItem(item.id)"
                    aria-label="Delete bookmark"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                  <!-- Mobile: swipe-reveal chevron -->
                  <svg class="md:hidden w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
              <!-- Delete button (revealed on swipe, mobile only) -->
              <button
                class="absolute right-0 top-0 bottom-0 w-[70px] bg-red-500 text-white text-xs font-semibold flex items-center justify-center md:hidden"
                (click)="deleteItem(item.id)"
              >Delete</button>
            </div>
          }

          <!-- Load more -->
          @if (meta()?.hasNext) {
            <div class="flex justify-center py-4">
              <button
                class="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 active:bg-gray-300 disabled:opacity-50"
                [disabled]="loadingMore()"
                (click)="loadMore()"
              >{{ loadingMore() ? 'Loading…' : 'Load more' }}</button>
            </div>
          }
        </div>
      }

    </div>

    <!-- Question detail sheet -->
    @if (detailSheetOpen()) {
      <div class="fixed inset-0 bg-black/30 z-40" (click)="closeDetailSheet()"></div>
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col">
        <!-- Handle + header -->
        <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
        <div class="flex items-center justify-between px-4 pb-3 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-sm font-semibold text-gray-700">Q{{ detailQuestion()?.questionNumber }}</h3>
          <button class="p-1.5 rounded-full hover:bg-gray-100" (click)="closeDetailSheet()">
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          <!-- Media -->
          @for (m of detailMedia(); track m.id) {
            @if (isHttpUrl(m.blobUrl) && !m.isExplanation) {
              <img [src]="m.blobUrl" class="w-full object-contain max-h-48 rounded-xl bg-gray-100" alt="Question media"/>
            }
          }
          <!-- Question text -->
          <p class="text-sm font-medium text-gray-900 leading-relaxed">{{ detailQuestion()?.questionText }}</p>
          <!-- Options -->
          <div class="space-y-2">
            @for (opt of OPTIONS; track opt) {
              <button
                class="w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-colors"
                [class]="detailOptionClass(opt)"
                [disabled]="detailRevealed()"
                (click)="onDetailGuess(opt)"
              >
                <span class="font-bold mr-2">{{ opt }}.</span>{{ getOptionText(opt) }}
              </button>
            }
          </div>
          <!-- Reveal button -->
          @if (!detailRevealed() && detailGuess()) {
            <button
              class="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-semibold active:opacity-90 disabled:opacity-50"
              [disabled]="loadingDetail()"
              (click)="revealAnswer()"
            >{{ loadingDetail() ? 'Loading…' : 'Reveal Answer' }}</button>
          }
          <!-- Explanation -->
          @if (detailRevealed() && detailFull()) {
            <div class="bg-gray-50 rounded-xl p-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Explanation</p>
              <p class="text-sm text-gray-700 leading-relaxed">{{ detailFull()!.explanation }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
})
export default class BookmarkItemsPage implements OnInit {
  protected location = inject(Location);
  private route = inject(ActivatedRoute);
  private service = inject(QuestionService);

  protected readonly collectionId = this.route.snapshot.paramMap.get('id') ?? '';

  protected allItems = signal<QuestionWithoutAnswersDto[]>([]);
  protected meta = signal<PaginatedMeta | null>(null);
  protected loading = signal(false);
  protected loadingMore = signal(false);
  protected revealedId = signal<string | null>(null);

  protected sortBy = signal<SortKey>('newest');
  protected filterSubject = signal('');
  protected filterChapter = signal('');
  protected collectionName = signal('Collection');

  protected availableSubjects = computed(() =>
    [...new Set(this.allItems().map(i => i.subjectName ?? '').filter(Boolean))].sort(),
  );

  protected availableChapters = computed(() => {
    const sub = this.filterSubject();
    if (!sub) return [];
    return [...new Set(
      this.allItems()
        .filter(i => i.subjectName === sub)
        .map(i => i.chapterTitle ?? '')
        .filter(Boolean),
    )].sort();
  });

  protected filteredItems = computed(() => {
    let items = [...this.allItems()];

    // Filter
    const sub = this.filterSubject();
    const ch = this.filterChapter();
    if (sub) items = items.filter(i => i.subjectName === sub);
    if (ch) items = items.filter(i => i.chapterTitle === ch);

    // Sort (API returns newest first)
    const sort = this.sortBy();
    if (sort === 'oldest') items = items.reverse();
    else if (sort === 'az') items = items.sort((a, b) => a.questionText.localeCompare(b.questionText));

    return items;
  });

  protected detailSheetOpen = signal(false);
  protected detailQuestion = signal<QuestionWithoutAnswersDto | null>(null);
  protected detailFull = signal<QuestionDetailDto | null>(null);
  protected detailRevealed = signal(false);
  protected detailGuess = signal<string | null>(null);
  protected detailMedia = signal<MediaDto[]>([]);
  protected loadingDetail = signal(false);

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;

  private currentPage = 1;
  private itemTouchStartX = 0;
  private itemTouchStartY = 0;
  private itemGestureDir: 'h' | 'v' | null = null;

  ngOnInit(): void {
    this.loadCollectionName();
    this.loadPage(1);
  }

  private loadCollectionName(): void {
    this.service.getBookmarkCollections().subscribe({
      next: (cols) => {
        const match = cols.find(c => c.id === this.collectionId);
        if (match) this.collectionName.set(match.name);
      },
    });
  }

  private loadPage(page: number): void {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);

    this.service.getBookmarkItems(this.collectionId, page, 100).subscribe({
      next: (res) => {
        this.allItems.update(prev => page === 1 ? res.data : [...prev, ...res.data]);
        this.meta.set(res.meta);
        this.currentPage = page;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => { this.loading.set(false); this.loadingMore.set(false); },
    });
  }

  protected loadMore(): void {
    this.loadPage(this.currentPage + 1);
  }

  protected onSubjectFilterChange(val: string): void {
    this.filterSubject.set(val);
    this.filterChapter.set('');
  }

  protected clearFilters(): void {
    this.filterSubject.set('');
    this.filterChapter.set('');
  }

  // Swipe-to-delete gesture
  protected onItemTouchStart(e: TouchEvent, _id: string): void {
    this.itemTouchStartX = e.touches[0].clientX;
    this.itemTouchStartY = e.touches[0].clientY;
    this.itemGestureDir = null;
  }

  protected onItemTouchMove(e: TouchEvent): void {
    if (!this.itemGestureDir) {
      const dx = Math.abs(e.touches[0].clientX - this.itemTouchStartX);
      const dy = Math.abs(e.touches[0].clientY - this.itemTouchStartY);
      if (dx > 8 || dy > 8) this.itemGestureDir = dx > dy ? 'h' : 'v';
    }
  }

  protected onItemTouchEnd(e: TouchEvent, id: string): void {
    if (this.itemGestureDir === 'h') {
      const dx = e.changedTouches[0].clientX - this.itemTouchStartX;
      if (dx < -50) this.revealedId.set(id);
      else if (dx > 30) this.revealedId.set(null);
    }
    this.itemGestureDir = null;
  }

  protected deleteItem(questionId: string): void {
    this.service.deleteBookmarkItem(this.collectionId, questionId).subscribe({
      next: () => {
        this.allItems.update(its => its.filter(it => it.id !== questionId));
        this.revealedId.set(null);
        this.meta.update(m => m ? { ...m, totalCount: m.totalCount - 1 } : m);
      },
    });
  }

  protected openDetail(q: QuestionWithoutAnswersDto): void {
    if (this.revealedId()) { this.revealedId.set(null); return; }
    this.detailQuestion.set(q);
    this.detailFull.set(null);
    this.detailRevealed.set(false);
    this.detailGuess.set(null);
    this.detailMedia.set([]);
    this.detailSheetOpen.set(true);

    if (q.hasMedia) {
      this.service.getQuestionMediaOnly(q.id).subscribe({
        next: (res) => this.detailMedia.set(res.data),
      });
    }
  }

  protected closeDetailSheet(): void {
    this.detailSheetOpen.set(false);
  }

  protected onDetailGuess(opt: string): void {
    if (!this.detailRevealed()) this.detailGuess.set(opt);
  }

  protected revealAnswer(): void {
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
    const guess = this.detailGuess();
    const revealed = this.detailRevealed();
    const correct = this.detailFull()?.correctOption;

    if (revealed && correct) {
      if (opt === correct) return 'bg-green-50 border-green-500 text-green-800 cursor-default';
      if (opt === guess && opt !== correct) return 'bg-red-50 border-red-400 text-red-800 cursor-default';
      return 'bg-white border-gray-200 text-gray-400 opacity-60 cursor-default';
    }
    if (opt === guess) return 'bg-indigo-50 border-primary text-gray-900';
    return 'bg-white border-gray-300 text-gray-700 hover:border-gray-400';
  }

  protected getOptionText(opt: string): string {
    return (this.detailQuestion() as any)?.[`option${opt}`] ?? '';
  }

  protected isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }
}
