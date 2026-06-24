import {
  Component,
  inject,
  signal,
  computed,
  output,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import gsap from 'gsap';
import { SocialStore } from '../store/social.store';
import { AuthStore } from '../store/auth.store';
import { FriendsService } from './friends.service';
import { UserSearchResult } from './friends.models';
import { AvatarComponent } from '../shared/ui/avatar/avatar.component';
import { ToastService } from '../shared/ui/toast-container/toast.service';

@Component({
  selector: 'app-user-search-sheet',
  imports: [AvatarComponent],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 z-[51] bg-black/40" (click)="close()"></div>

    <!-- Sheet -->
    <div
      #sheet
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[52] bg-white rounded-t-3xl shadow-2xl h-[80vh] flex flex-col"
    >
      <!-- Handle -->
      <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <div class="flex items-center px-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <h2 class="text-base font-bold text-gray-900 flex-1">Add a Friend</h2>
        <button
          class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          (click)="close()"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Search bar -->
      <div class="px-5 py-3 flex-shrink-0">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            #searchInput
            type="text"
            inputmode="search"
            autocomplete="off"
            placeholder="Search by name or email"
            class="w-full pl-9 pr-3 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            [value]="term()"
            (input)="onInput($any($event.target).value)"
          />
        </div>
      </div>

      <!-- Results -->
      <div class="flex-1 overflow-y-auto px-5 pb-6">
        @if (store.isSearching()) {
          <div class="py-12 flex justify-center">
            <svg class="w-6 h-6 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
        } @else if (term().trim().length === 0) {
          <div class="py-12 text-center">
            <span class="text-4xl">🔎</span>
            <p class="mt-3 text-sm text-gray-400">Search by name or email</p>
          </div>
        } @else if (results().length === 0) {
          <div class="py-12 text-center">
            <span class="text-4xl">🤷</span>
            <p class="mt-3 text-sm text-gray-400">No users found for "{{ term().trim() }}"</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (user of results(); track user.id) {
              <div class="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                <app-avatar [name]="user.displayName" size="sm" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ user.displayName }}</p>
                  <p class="text-xs text-gray-400 truncate">Lv. {{ user.level }} · {{ user.email }}</p>
                </div>

                @switch (buttonState(user)) {
                  @case ('friends') {
                    <span class="flex-shrink-0 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                      Friends ✓
                    </span>
                  }
                  @case ('sent') {
                    <span class="flex-shrink-0 px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">
                      Pending ⏳
                    </span>
                  }
                  @default {
                    <button
                      class="flex-shrink-0 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                      [disabled]="sending().has(user.id)"
                      (click)="sendRequest(user)"
                    >
                      @if (sending().has(user.id)) { Sending… } @else { Add Friend }
                    </button>
                  }
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
})
export class UserSearchSheetComponent implements AfterViewInit {
  protected store = inject(SocialStore);
  private auth = inject(AuthStore);
  private service = inject(FriendsService);
  private toast = inject(ToastService);

  readonly closed = output<void>();

  @ViewChild('sheet') sheetRef?: ElementRef<HTMLElement>;
  @ViewChild('searchInput') inputRef?: ElementRef<HTMLInputElement>;

  protected term = signal('');
  /** Tracks which user IDs have an in-flight request (for the Sending… label). */
  protected sending = signal<Set<string>>(new Set());

  private searchInput$ = new Subject<string>();

  /** Filter the current user out of their own results. */
  protected results = computed(() => {
    const myId = this.auth.user()?.id;
    return this.store.searchResults().filter((u) => u.id !== myId);
  });

  constructor() {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((value) => {
        const t = value.trim();
        if (t.length === 0) {
          this.store.clearSearch();
        } else {
          this.store.search(t);
        }
      });
  }

  ngAfterViewInit(): void {
    if (this.sheetRef) {
      gsap.from(this.sheetRef.nativeElement, { y: '100%', duration: 0.3, ease: 'power2.out' });
    }
    setTimeout(() => this.inputRef?.nativeElement.focus(), 250);
  }

  protected onInput(value: string): void {
    this.term.set(value);
    this.searchInput$.next(value);
  }

  /**
   * Friends matching is by display name because FriendDto exposes no user ID
   * (only the friendship-record ID used for DELETE).
   */
  protected buttonState(user: UserSearchResult): 'add' | 'sent' | 'friends' {
    const lc = user.displayName.trim().toLowerCase();
    if (this.store.friends().some((f) => f.displayName.trim().toLowerCase() === lc)) {
      return 'friends';
    }
    if (this.store.outgoingRequests().some((r) => r.userId === user.id)) {
      return 'sent';
    }
    return 'add';
  }

  protected sendRequest(user: UserSearchResult): void {
    if (this.sending().has(user.id)) return;
    this.sending.update((s) => new Set(s).add(user.id));

    this.service.sendRequest(user.email).subscribe({
      next: () => {
        // Persist in store → localStorage so the Pending badge survives navigation
        this.store.markRequestSent({
          userId: user.id,
          displayName: user.displayName,
          email: user.email,
          sentAt: new Date().toISOString(),
        });
        this.sending.update((s) => {
          const n = new Set(s);
          n.delete(user.id);
          return n;
        });
      },
      error: (err) => {
        this.sending.update((s) => {
          const n = new Set(s);
          n.delete(user.id);
          return n;
        });
        const msg = err?.error?.message ?? err?.error?.title ?? 'Could not send request. Try again.';
        this.toast.show(msg, 'error');
      },
    });
  }

  protected close(): void {
    const el = this.sheetRef?.nativeElement;
    if (el) {
      gsap.to(el, {
        y: '100%',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => this.finishClose(),
      });
    } else {
      this.finishClose();
    }
  }

  private finishClose(): void {
    this.store.clearSearch();
    this.closed.emit();
  }
}
