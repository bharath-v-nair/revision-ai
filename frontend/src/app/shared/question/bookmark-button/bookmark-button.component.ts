import {
  Component,
  input,
  output,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  inject,
} from '@angular/core';
import gsap from 'gsap';
import { QuestionService } from '../../../questions/question.service';
import { BookmarkCollection } from '../../../questions/question.models';

@Component({
  selector: 'app-bookmark-button',
  imports: [],
  template: `
    <!-- Heart button -->
    <button
      #heartBtn
      class="p-2 rounded-full transition-colors active:bg-gray-100"
      (click)="onTap()"
      aria-label="Bookmark"
    >
      @if (bookmarked()) {
        <svg class="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      } @else {
        <svg class="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
        </svg>
      }
    </button>

    <!-- Collection picker sheet -->
    @if (sheetOpen()) {
      <!-- Backdrop — tap to dismiss only when input is NOT focused -->
      <div
        class="fixed inset-0 z-50 bg-black/30"
        (click)="closeSheet()"
      ></div>

      <div
        class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[70vh]"
        (click)="$event.stopPropagation()"
      >
        <!-- Drag handle -->
        <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <!-- Header -->
        <div class="flex items-center justify-between px-4 pb-3 pt-1 border-b border-gray-100 flex-shrink-0">
          <h3 class="text-base font-semibold text-gray-800">Save to Collection</h3>
          <button
            class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200"
            (click)="closeSheet()"
            aria-label="Close"
          >
            <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          @if (loadingCollections()) {
            <p class="text-sm text-gray-400 text-center py-8">Loading…</p>
          } @else {
            @for (col of collections(); track col.id) {
              <button
                class="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between"
                (click)="saveToCollection(col.id)"
              >
                <span class="text-sm font-medium text-gray-700">{{ col.name }}</span>
                <span class="text-xs text-gray-400">{{ col.itemCount }} items</span>
              </button>
            }

            @if (!collections().length && !creatingNew()) {
              <p class="text-sm text-gray-400 text-center py-4">No collections yet. Create one below.</p>
            }
          }
        </div>

        <!-- New collection row — always pinned at bottom -->
        <div class="px-4 pb-6 pt-2 border-t border-gray-100 flex-shrink-0">
          @if (creatingNew()) {
            <div class="flex gap-2 items-center">
              <input
                #newColInput
                class="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Collection name…"
                [value]="newCollectionName()"
                (input)="newCollectionName.set($any($event.target).value)"
                (keyup.enter)="confirmNewCollection()"
              />
              <button
                class="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                [disabled]="!newCollectionName().trim() || saving()"
                (click)="confirmNewCollection()"
              >{{ saving() ? '…' : 'Create' }}</button>
              <button
                class="px-3 py-2.5 text-gray-500 text-sm rounded-xl hover:bg-gray-100"
                (click)="creatingNew.set(false); newCollectionName.set('')"
              >Cancel</button>
            </div>
          } @else {
            <button
              class="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
              (click)="creatingNew.set(true); focusInput()"
            >
              + New Collection
            </button>
          }
        </div>
      </div>
    }
  `,
})
export class BookmarkButtonComponent implements AfterViewInit {
  private service = inject(QuestionService);

  readonly questionId = input.required<string>();
  readonly bookmarkToggled = output<string>();

  @ViewChild('heartBtn') heartBtnRef!: ElementRef<HTMLElement>;
  @ViewChild('newColInput') newColInputRef?: ElementRef<HTMLInputElement>;

  protected bookmarked = signal(false);
  protected sheetOpen = signal(false);
  protected collections = signal<BookmarkCollection[]>([]);
  protected loadingCollections = signal(false);
  protected creatingNew = signal(false);
  protected newCollectionName = signal('');
  protected saving = signal(false);

  ngAfterViewInit(): void {}

  protected onTap(): void {
    const svg = this.heartBtnRef.nativeElement.querySelector('svg');
    if (svg) {
      gsap.timeline()
        .to(svg, { scale: 1.4, duration: 0.15, ease: 'power2.out' })
        .to(svg, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.4)' });
    }
    this.sheetOpen.set(true);
    this.loadCollections();
  }

  protected focusInput(): void {
    setTimeout(() => this.newColInputRef?.nativeElement.focus(), 50);
  }

  private loadCollections(): void {
    this.loadingCollections.set(true);
    this.service.getBookmarkCollections().subscribe({
      next: (res) => { this.collections.set(res.data); this.loadingCollections.set(false); },
      error: () => this.loadingCollections.set(false),
    });
  }

  protected saveToCollection(collectionId: string): void {
    this.service.addBookmarkItem(collectionId, this.questionId()).subscribe({
      next: () => {
        this.bookmarked.set(true);
        this.bookmarkToggled.emit(this.questionId());
        this.closeSheet();
      },
    });
  }

  protected confirmNewCollection(): void {
    const name = this.newCollectionName().trim();
    if (!name || this.saving()) return;
    this.saving.set(true);
    this.service.createBookmarkCollection(name).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.saveToCollection(res.data.id);
        this.creatingNew.set(false);
        this.newCollectionName.set('');
      },
      error: () => this.saving.set(false),
    });
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    this.creatingNew.set(false);
    this.newCollectionName.set('');
    this.saving.set(false);
  }
}
