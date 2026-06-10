import {
  Component,
  OnInit,
  inject,
  signal,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import { BookmarkCollection } from '../../questions/question.models';

@Component({
  selector: 'app-bookmark-collections',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <h1 class="text-xl font-bold text-gray-800">Bookmarks</h1>
        <button
          class="text-primary font-semibold text-sm px-3 py-1.5 hover:bg-primary/10 active:bg-primary/20 rounded-xl"
          (click)="openCreateSheet()"
        >+ New</button>
      </div>

      <!-- Body -->
      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <p class="text-gray-400 text-sm">Loading collections…</p>
        </div>
      } @else if (collections().length === 0) {
        <div class="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
          <span class="text-5xl">📚</span>
          <h2 class="text-lg font-semibold text-gray-700">No collections yet</h2>
          <p class="text-sm text-gray-500">Bookmark questions while answering to get started</p>
          <button
            class="mt-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
            (click)="openCreateSheet()"
          >Create Collection</button>
        </div>
      } @else {
        <div class="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          @for (col of collections(); track col.id) {
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              <!-- Main row -->
              <div class="flex items-center px-4 py-3.5">
                <!-- Tappable area → navigate into collection -->
                <a
                  class="flex items-center flex-1 min-w-0 cursor-pointer active:opacity-80"
                  [routerLink]="['/bookmarks', col.id]"
                >
                  <span class="text-2xl mr-3 flex-shrink-0">{{ col.icon ?? '📚' }}</span>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 text-sm truncate">{{ col.name }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ col.itemCount }} questions</p>
                  </div>
                </a>

                <!-- ⋮ menu button — always visible -->
                <button
                  class="ml-2 p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 text-gray-400 flex-shrink-0"
                  (click)="toggleMenu(col.id)"
                  aria-label="Collection options"
                >
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                </button>
              </div>

              <!-- Context actions (visible when menu is open) -->
              @if (activeMenuId() === col.id) {
                <div class="flex border-t border-gray-100">
                  <button
                    class="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 active:bg-gray-100 flex items-center justify-center gap-1.5"
                    (click)="startRename(col)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                    </svg>
                    Rename
                  </button>
                  <div class="w-px bg-gray-100"></div>
                  <button
                    class="flex-1 py-3 text-sm font-medium text-red-500 hover:bg-red-50 active:bg-red-100 flex items-center justify-center gap-1.5"
                    (click)="deleteCollection(col.id)"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

    </div>

    <!-- Create/Rename sheet overlay -->
    @if (sheetOpen()) {
      <div class="fixed inset-0 z-50 bg-black/30" (click)="closeSheet()"></div>
      <div class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl px-4 pb-8 pt-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">
          {{ renameTarget() ? 'Rename Collection' : 'New Collection' }}
        </h3>
        <input
          #nameInput
          class="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Collection name…"
          [value]="inputName()"
          (input)="inputName.set($any($event.target).value)"
          (keyup.enter)="confirmSheet()"
        />
        <div class="flex gap-2 mt-4">
          <button
            class="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            [disabled]="!inputName().trim() || saving()"
            (click)="confirmSheet()"
          >{{ saving() ? '…' : (renameTarget() ? 'Rename' : 'Create') }}</button>
          <button
            class="px-4 py-3 text-gray-500 text-sm rounded-xl hover:bg-gray-100"
            (click)="closeSheet()"
          >Cancel</button>
        </div>
      </div>
    }
  `,
})
export default class BookmarkCollectionsPage implements OnInit {
  private service = inject(QuestionService);

  @ViewChild('nameInput') nameInputRef?: ElementRef<HTMLInputElement>;

  protected collections = signal<BookmarkCollection[]>([]);
  protected loading = signal(false);
  protected activeMenuId = signal<string | null>(null);
  protected sheetOpen = signal(false);
  protected inputName = signal('');
  protected saving = signal(false);
  protected renameTarget = signal<BookmarkCollection | null>(null);

  ngOnInit(): void {
    this.loadCollections();
  }

  private loadCollections(): void {
    this.loading.set(true);
    this.service.getBookmarkCollections().subscribe({
      next: (cols) => { this.collections.set(cols); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  protected toggleMenu(id: string): void {
    this.activeMenuId.set(this.activeMenuId() === id ? null : id);
  }

  protected openCreateSheet(): void {
    this.renameTarget.set(null);
    this.inputName.set('');
    this.sheetOpen.set(true);
    setTimeout(() => this.nameInputRef?.nativeElement.focus(), 50);
  }

  protected startRename(col: BookmarkCollection): void {
    this.renameTarget.set(col);
    this.inputName.set(col.name);
    this.activeMenuId.set(null);
    this.sheetOpen.set(true);
    setTimeout(() => this.nameInputRef?.nativeElement.focus(), 50);
  }

  protected confirmSheet(): void {
    const name = this.inputName().trim();
    if (!name || this.saving()) return;
    this.saving.set(true);

    const target = this.renameTarget();
    if (target) {
      this.service.renameBookmarkCollection(target.id, name).subscribe({
        next: () => {
          this.collections.update(cs =>
            cs.map(c => c.id === target.id ? { ...c, name } : c),
          );
          this.saving.set(false);
          this.closeSheet();
        },
        error: () => this.saving.set(false),
      });
    } else {
      this.service.createBookmarkCollection(name).subscribe({
        next: (col) => {
          this.collections.update(cs => [col, ...cs]);
          this.saving.set(false);
          this.closeSheet();
        },
        error: () => this.saving.set(false),
      });
    }
  }

  protected deleteCollection(id: string): void {
    this.activeMenuId.set(null);
    this.service.deleteBookmarkCollection(id).subscribe({
      next: () => this.collections.update(cs => cs.filter(c => c.id !== id)),
    });
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    this.inputName.set('');
    this.saving.set(false);
    this.renameTarget.set(null);
  }
}
