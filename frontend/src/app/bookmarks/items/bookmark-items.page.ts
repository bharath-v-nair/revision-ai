import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import gsap from 'gsap';
import { QuestionService } from '../../questions/question.service';
import {
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  PaginatedMeta,
  MediaDto,
} from '../../questions/question.models';

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
        <div>
          <h1 class="text-lg font-bold text-gray-800">{{ collectionId }}</h1>
          <p class="text-xs text-gray-400">{{ meta()?.totalCount ?? items().length }} questions</p>
        </div>
      </div>

      <!-- Body -->
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading…</p>
        </div>
      } @else if (items().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span class="text-4xl">🔖</span>
          <p class="text-gray-500 text-sm">No bookmarks in this collection yet</p>
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto">
          @for (item of items(); track item.id; let i = $index) {
            <div
              #itemRow
              class="relative overflow-hidden border-b border-gray-100 bg-white"
            >
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
                    @if (item.subjectName) {
                      <span class="inline-block mt-1.5 px-2 py-0.5 bg-indigo-100 text-indigo-600 text-xs rounded-full">
                        {{ item.subjectName }}
                      </span>
                    }
                  </div>
                  <!-- Desktop: inline delete button (always visible on non-touch) -->
                  <button
                    class="hidden md:flex flex-shrink-0 p-1.5 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    (click)="$event.stopPropagation(); deleteItem(item.id, i)"
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
                (click)="deleteItem(item.id, i)"
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

  protected items = signal<QuestionWithoutAnswersDto[]>([]);
  protected meta = signal<PaginatedMeta | null>(null);
  protected loading = signal(false);
  protected loadingMore = signal(false);
  protected revealedId = signal<string | null>(null);

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
    this.loadPage(1);
  }

  private loadPage(page: number): void {
    if (page === 1) this.loading.set(true);
    else this.loadingMore.set(true);

    this.service.getBookmarkItems(this.collectionId, page).subscribe({
      next: (res) => {
        this.items.update(prev => page === 1 ? res.data : [...prev, ...res.data]);
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

  // Swipe-to-delete for items
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

  protected deleteItem(questionId: string, index: number): void {
    this.service.deleteBookmarkItem(this.collectionId, questionId).subscribe({
      next: () => {
        this.items.update(its => its.filter(it => it.id !== questionId));
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
