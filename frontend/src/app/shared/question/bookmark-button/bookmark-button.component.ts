import {
  Component,
  input,
  output,
  signal,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnInit,
  inject,
} from '@angular/core';
import gsap from 'gsap';
import { QuestionService } from '../../../questions/question.service';
import { BookmarkCollection } from '../../../questions/question.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bookmark-button',
  imports: [FormsModule],
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
      <div class="fixed inset-0 z-50 flex items-end" (click)="closeSheet()">
        <div
          class="w-full bg-white rounded-t-3xl shadow-2xl p-4 pb-8 max-h-[70vh] flex flex-col"
          (click)="$event.stopPropagation()"
        >
          <div class="flex justify-center mb-3">
            <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
          <h3 class="text-base font-semibold text-gray-800 mb-3">Save to Collection</h3>

          @if (loadingCollections()) {
            <p class="text-sm text-gray-400 text-center py-8">Loading…</p>
          } @else {
            <div class="flex-1 overflow-y-auto space-y-2">
              @for (col of collections(); track col.id) {
                <button
                  class="w-full text-left px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-between"
                  (click)="saveToCollection(col.id)"
                >
                  <span class="text-sm font-medium text-gray-700">{{ col.name }}</span>
                  <span class="text-xs text-gray-400">{{ col.itemCount }} items</span>
                </button>
              }

              <!-- New collection inline -->
              @if (creatingNew()) {
                <div class="flex gap-2 pt-1">
                  <input
                    class="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Collection name"
                    [(ngModel)]="newCollectionName"
                    (keyup.enter)="confirmNewCollection()"
                    autofocus
                  />
                  <button
                    class="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
                    (click)="confirmNewCollection()"
                  >Create</button>
                </div>
              } @else {
                <button
                  class="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                  (click)="creatingNew.set(true)"
                >
                  + New Collection
                </button>
              }
            </div>
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

  protected bookmarked = signal(false);
  protected sheetOpen = signal(false);
  protected collections = signal<BookmarkCollection[]>([]);
  protected loadingCollections = signal(false);
  protected creatingNew = signal(false);
  protected newCollectionName = '';

  ngAfterViewInit(): void {}

  protected onTap(): void {
    const el = this.heartBtnRef.nativeElement.querySelector('svg')!;
    gsap.timeline()
      .to(el, { scale: 1.4, duration: 0.15, ease: 'power2.out' })
      .to(el, { scale: 1, duration: 0.2, ease: 'elastic.out(1, 0.4)' });

    this.sheetOpen.set(true);
    this.loadCollections();
  }

  private loadCollections(): void {
    this.loadingCollections.set(true);
    this.service.getBookmarkCollections().subscribe({
      next: (res) => {
        this.collections.set(res.data);
        this.loadingCollections.set(false);
      },
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
    const name = this.newCollectionName.trim();
    if (!name) return;
    this.service.createBookmarkCollection(name).subscribe({
      next: (res) => {
        this.saveToCollection(res.data.id);
        this.creatingNew.set(false);
        this.newCollectionName = '';
      },
    });
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    this.creatingNew.set(false);
    this.newCollectionName = '';
  }
}
