import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { DecimalPipe, Location } from '@angular/common';
import gsap from 'gsap';
import { SocialStore } from '../store/social.store';
import { AuthStore } from '../store/auth.store';
import { FriendsService } from './friends.service';
import { FriendDto, FriendRequestDto } from './friends.models';
import { AvatarComponent } from '../shared/ui/avatar/avatar.component';
import { EmptyStateComponent } from '../shared/ui/empty-state/empty-state.component';
import { LeaderboardListComponent } from './leaderboard-list.component';
import { UserSearchSheetComponent } from './user-search-sheet.component';

type TopTab = 'friends' | 'leaderboard';
type LbTab = 'friends' | 'global' | 'weekly';

@Component({
  selector: 'app-friends',
  imports: [
    DecimalPipe,
    AvatarComponent,
    EmptyStateComponent,
    LeaderboardListComponent,
    UserSearchSheetComponent,
  ],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- ═══════════ Header + top tabs ═══════════ -->
      <div class="bg-white border-b border-gray-100 sticky top-0 z-10 flex-shrink-0">
        <div class="px-4 pt-4">
          <div class="flex items-center mb-3">
            <button
              class="p-1.5 -ml-1 mr-1 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              (click)="goBack()"
              aria-label="Back"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 class="text-xl font-bold text-gray-900 flex-1">Friends</h1>

            @if (topTab() === 'friends') {
              <!-- Incoming requests bell (shown only when there are pending requests) -->
              @if (store.pendingCount() > 0) {
                <button
                  class="relative mr-2 w-9 h-9 flex items-center justify-center rounded-full transition-colors"
                  [class]="requestsExpanded() ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'"
                  (click)="requestsExpanded.set(!requestsExpanded())"
                  aria-label="Pending friend requests"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                    {{ store.pendingCount() }}
                  </span>
                </button>
              }
              <button
                class="px-3.5 py-1.5 bg-primary text-white rounded-full text-sm font-semibold shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
                (click)="openAddFriend()"
              >+ Add</button>
            }

            @if (topTab() === 'leaderboard') {
              <!-- Refresh button for leaderboard -->
              <button
                class="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                [class.animate-spin]="isRefreshing()"
                (click)="refreshLeaderboard()"
                aria-label="Refresh leaderboard"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            }
          </div>

          <!-- Top tabs -->
          <div class="flex">
            <button
              class="flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors"
              [class]="topTab() === 'friends' ? 'border-primary text-primary' : 'border-transparent text-gray-400'"
              (click)="setTopTab('friends')"
            >Friends</button>
            <button
              class="flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors"
              [class]="topTab() === 'leaderboard' ? 'border-primary text-primary' : 'border-transparent text-gray-400'"
              (click)="setTopTab('leaderboard')"
            >Leaderboard</button>
          </div>
        </div>
      </div>

      <!-- ═══════════ Tab body ═══════════ -->
      <div class="flex-1 overflow-y-auto">

        @switch (topTab()) {

          <!-- ─────────── FRIENDS TAB ─────────── -->
          @case ('friends') {
            <div class="px-4 py-4">

              <!-- Incoming requests (expanded from header bell) -->
              @if (requestsExpanded() && store.friendRequests().length > 0) {
                <div class="mb-5">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    Pending requests
                  </p>
                  <div class="space-y-2">
                    @for (req of store.friendRequests(); track req.id) {
                      <div
                        #reqCard
                        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3"
                      >
                        <app-avatar [name]="req.requesterName" size="sm" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ req.requesterName }}</p>
                          <p class="text-xs text-gray-400 truncate">{{ req.requesterEmail }}</p>
                        </div>
                        <div class="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            class="w-9 h-9 rounded-full bg-green-100 text-green-700 flex items-center justify-center hover:bg-green-200 active:scale-95 transition-all disabled:opacity-50"
                            [disabled]="busyRequestId() === req.id"
                            (click)="acceptRequest(req, reqCard)"
                            aria-label="Accept"
                          >✅</button>
                          <button
                            class="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 active:scale-95 transition-all disabled:opacity-50"
                            [disabled]="busyRequestId() === req.id"
                            (click)="declineRequest(req, reqCard)"
                            aria-label="Decline"
                          >❌</button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Sent (outgoing) invites — persisted in localStorage -->
              @if (store.outgoingRequests().length > 0) {
                <div class="mb-5">
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    Sent invites
                  </p>
                  <div class="space-y-2">
                    @for (req of store.outgoingRequests(); track req.userId) {
                      <div class="bg-white rounded-2xl border border-gray-100 p-3 flex items-center gap-3">
                        <app-avatar [name]="req.displayName" size="sm" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ req.displayName }}</p>
                          <p class="text-xs text-gray-400 truncate">{{ req.email }}</p>
                        </div>
                        <span class="flex-shrink-0 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-semibold rounded-full border border-amber-200">
                          Pending
                        </span>
                        <button
                          class="flex-shrink-0 w-7 h-7 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg leading-none"
                          (click)="store.dismissOutgoingRequest(req.userId)"
                          aria-label="Dismiss"
                        >×</button>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Friends list -->
              @if (store.isLoading()) {
                <div class="py-16 flex justify-center">
                  <svg class="w-6 h-6 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              } @else if (store.friends().length === 0) {
                <app-empty-state
                  icon="👥"
                  title="No friends yet"
                  subtitle="Add friends to compete on leaderboards!"
                  ctaLabel="Add a friend"
                  (ctaClick)="openAddFriend()"
                />
              } @else {
                @if (store.outgoingRequests().length === 0 && store.friendRequests().length === 0) {
                  <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-2">
                    Friends ({{ store.friends().length }})
                  </p>
                }
                <div class="space-y-2.5">
                  @for (friend of store.friends(); track friend.id) {
                    <!-- Swipe container -->
                    <div #fcard class="relative overflow-hidden rounded-2xl">
                      <button
                        class="absolute inset-y-0 right-0 w-[88px] bg-red-500 text-white text-sm font-semibold flex items-center justify-center active:bg-red-600"
                        (click)="confirmUnfriend(friend, fcard)"
                      >Unfriend</button>

                      <!-- Draggable inner card -->
                      <div
                        class="relative bg-white border border-gray-100 p-3 flex items-center gap-3 touch-pan-y select-none cursor-pointer"
                        [style.transform]="'translateX(' + translateFor(friend.id) + 'px)'"
                        [style.transition]="draggingId() === friend.id ? 'none' : 'transform 0.2s ease'"
                        (pointerdown)="onPointerDown($event, friend.id)"
                        (pointermove)="onPointerMove($event, friend.id)"
                        (pointerup)="onPointerUp($event, friend.id)"
                        (pointercancel)="onPointerCancel(friend.id)"
                      >
                        <app-avatar [url]="friend.avatarUrl" [name]="friend.displayName" size="md" />
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-semibold text-gray-800 truncate">{{ friend.displayName }}</p>
                          <p class="text-xs text-gray-400 mt-0.5">{{ friend.totalXp | number }} XP total</p>
                        </div>
                        <span class="flex-shrink-0 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                          Lv. {{ friend.level }}
                        </span>
                        <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                      </div>
                    </div>
                  }
                </div>
                <p class="text-center text-[11px] text-gray-300 mt-4">Tap to view · Swipe left to unfriend</p>
              }
            </div>
          }

          <!-- ─────────── LEADERBOARD TAB ─────────── -->
          @case ('leaderboard') {
            <div class="px-4 py-4">

              <!-- Sub-tabs pill selector -->
              <div class="flex gap-1.5 mb-4 bg-gray-100 rounded-xl p-1">
                @for (t of lbTabs; track t.key) {
                  <button
                    class="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                    [class]="lbTab() === t.key ? 'bg-white text-primary shadow-sm' : 'text-gray-500'"
                    (click)="setLbTab(t.key)"
                  >{{ t.label }}</button>
                }
              </div>

              @switch (lbTab()) {
                @case ('friends') {
                  @if (store.friends().length === 0 && !store.friendsLbLoading()) {
                    <div class="py-16 px-6 text-center">
                      <span class="text-4xl">🏆</span>
                      <p class="mt-3 text-sm text-gray-500">Add friends to see how you compare!</p>
                    </div>
                  } @else {
                    <app-leaderboard-list
                      [entries]="store.friendsLeaderboard()"
                      xpField="weeklyXp"
                      [currentUserId]="myId()"
                      [loading]="store.friendsLbLoading()"
                      emptyMessage="No weekly XP yet — answer some questions!"
                    />
                  }
                }
                @case ('global') {
                  <app-leaderboard-list
                    [entries]="store.globalLeaderboard()"
                    xpField="totalXp"
                    [currentUserId]="myId()"
                    [loading]="store.globalLbLoading()"
                    emptyMessage="No global rankings yet."
                  />
                }
                @case ('weekly') {
                  <app-leaderboard-list
                    [entries]="store.weeklyLeaderboard()"
                    xpField="weeklyXp"
                    [currentUserId]="myId()"
                    [loading]="store.weeklyLbLoading()"
                    emptyMessage="No rankings this week yet — answer some questions!"
                  />
                }
              }

              <!-- Footer note for weekly-XP-based tabs -->
              @if (lbTab() !== 'global') {
                <p class="text-center text-[11px] text-gray-300 mt-5">
                  Ranked by XP earned this week · resets every Monday
                </p>
              }
            </div>
          }
        }
      </div>
    </div>

    <!-- ═══════════ Add-friend sheet ═══════════ -->
    @if (addSheetOpen()) {
      <app-user-search-sheet (closed)="addSheetOpen.set(false)" />
    }

    <!-- ═══════════ Friend profile mini-sheet ═══════════ -->
    @if (friendProfile(); as fp) {
      <div class="fixed inset-0 z-[60] bg-black/40" (click)="closeProfile()"></div>
      <div
        #profileSheet
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[61] bg-white rounded-t-3xl shadow-2xl"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-2">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div class="flex flex-col items-center text-center gap-2 px-6 pb-4 pt-2">
          <app-avatar [url]="fp.avatarUrl" [name]="fp.displayName" size="lg" />
          <h2 class="text-xl font-bold text-gray-900 mt-2">{{ fp.displayName }}</h2>
          <div class="flex items-center gap-3 mt-0.5">
            <span class="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-bold rounded-full">
              Level {{ fp.level }}
            </span>
            <span class="text-sm text-gray-500 font-medium">{{ fp.totalXp | number }} XP</span>
          </div>
        </div>

        <div class="px-5 pb-8 pt-2 space-y-2.5">
          <button
            class="w-full py-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-semibold text-indigo-700 hover:bg-indigo-100 active:scale-[0.98] transition-all"
            (click)="viewOnLeaderboard()"
          >See on Leaderboard →</button>
          <button
            class="w-full py-3 bg-gray-100 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-200"
            (click)="closeProfile()"
          >Close</button>
        </div>
      </div>
    }

    <!-- ═══════════ Unfriend confirmation ═══════════ -->
    @if (unfriendTarget(); as target) {
      <div
        class="fixed inset-0 z-[62] bg-black/40 flex items-center justify-center p-6"
        (click)="cancelUnfriend()"
      >
        <div
          class="bg-white rounded-3xl shadow-2xl w-full max-w-xs p-5 text-center"
          (click)="$event.stopPropagation()"
        >
          <div class="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-2xl mb-3">🗑️</div>
          <h3 class="text-base font-bold text-gray-900 mb-1">Remove friend?</h3>
          <p class="text-sm text-gray-500 mb-5">
            Remove <strong>{{ target.friend.displayName }}</strong> from friends?
          </p>
          <div class="flex gap-2">
            <button
              class="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200"
              (click)="cancelUnfriend()"
            >Cancel</button>
            <button
              class="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-[0.98] transition-all disabled:opacity-60"
              [disabled]="unfriending()"
              (click)="doUnfriend()"
            >{{ unfriending() ? 'Removing…' : 'Unfriend' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export default class FriendsPage implements OnInit {
  protected store = inject(SocialStore);
  private auth = inject(AuthStore);
  private service = inject(FriendsService);
  private location = inject(Location);

  @ViewChild('profileSheet') profileSheetRef?: ElementRef<HTMLElement>;

  protected readonly lbTabs: { key: LbTab; label: string }[] = [
    { key: 'friends', label: 'Friends' },
    { key: 'global', label: 'Global' },
    { key: 'weekly', label: 'Weekly' },
  ];

  protected topTab = signal<TopTab>('friends');
  protected lbTab = signal<LbTab>('friends');
  protected requestsExpanded = signal(false);
  protected addSheetOpen = signal(false);
  protected busyRequestId = signal<string | null>(null);
  protected friendProfile = signal<FriendDto | null>(null);
  protected isRefreshing = signal(false);

  // Unfriend confirmation
  protected unfriendTarget = signal<{ friend: FriendDto; el: HTMLElement } | null>(null);
  protected unfriending = signal(false);

  // Swipe gesture state
  protected draggingId = signal<string | null>(null);
  protected dragX = signal(0);
  protected openId = signal<string | null>(null);
  private startX = 0;
  private startY = 0;
  private pointerDownTime = 0;
  private axis: 'undecided' | 'horizontal' | 'vertical' = 'undecided';

  protected myId = computed<string | null>(() => this.auth.user()?.id ?? null);

  ngOnInit(): void {
    // load() fetches friends + requests; reloadFriends() auto-clears accepted sent-invites
    this.store.load();
    this.store.reloadFriends();
  }

  protected goBack(): void {
    this.location.back();
  }

  // ─── Tab navigation ───────────────────────────────────────────────
  protected setTopTab(tab: TopTab): void {
    this.topTab.set(tab);
    if (tab === 'leaderboard') {
      // Friends lb always fresh (membership changes invalidate it)
      this.store.loadFriendsLeaderboard();
      if (this.lbTab() !== 'friends') this.ensureLbLoaded(this.lbTab());
    }
  }

  protected setLbTab(tab: LbTab): void {
    this.lbTab.set(tab);
    if (tab === 'friends') {
      this.store.loadFriendsLeaderboard();
    } else {
      this.ensureLbLoaded(tab);
    }
  }

  private ensureLbLoaded(tab: LbTab): void {
    if (tab === 'global') this.store.loadGlobalLeaderboard();
    else if (tab === 'weekly') this.store.loadWeeklyLeaderboard();
  }

  protected refreshLeaderboard(): void {
    this.isRefreshing.set(true);
    if (this.lbTab() === 'friends') this.store.loadFriendsLeaderboard();
    else if (this.lbTab() === 'global') this.store.loadGlobalLeaderboard(true);
    else this.store.loadWeeklyLeaderboard(true);
    setTimeout(() => this.isRefreshing.set(false), 800);
  }

  // ─── Add friend ──────────────────────────────────────────────────
  protected openAddFriend(): void {
    this.addSheetOpen.set(true);
  }

  // ─── Friend profile sheet ────────────────────────────────────────
  protected openProfile(friend: FriendDto): void {
    this.friendProfile.set(friend);
    setTimeout(() => {
      const el = this.profileSheetRef?.nativeElement;
      if (el) gsap.from(el, { y: '100%', duration: 0.3, ease: 'power2.out' });
    }, 0);
  }

  protected closeProfile(): void {
    const el = this.profileSheetRef?.nativeElement;
    if (el) {
      gsap.to(el, {
        y: '100%',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => this.friendProfile.set(null),
      });
    } else {
      this.friendProfile.set(null);
    }
  }

  protected viewOnLeaderboard(): void {
    this.closeProfile();
    setTimeout(() => {
      this.topTab.set('leaderboard');
      this.lbTab.set('friends');
      this.store.loadFriendsLeaderboard();
    }, 300);
  }

  // ─── Incoming friend requests ─────────────────────────────────────
  protected acceptRequest(req: FriendRequestDto, el: HTMLElement): void {
    if (this.busyRequestId()) return;
    this.busyRequestId.set(req.id);
    this.service.acceptRequest(req.id).subscribe({
      next: () => {
        this.slideOut(el, () => {
          this.store.removeRequest(req.id);
          this.busyRequestId.set(null);
          // reloadFriends auto-clears outgoing invites for names now in the friend list
          this.store.reloadFriends();
        });
      },
      error: () => this.busyRequestId.set(null),
    });
  }

  protected declineRequest(req: FriendRequestDto, el: HTMLElement): void {
    if (this.busyRequestId()) return;
    this.busyRequestId.set(req.id);
    this.service.declineRequest(req.id).subscribe({
      next: () => {
        this.slideOut(el, () => {
          this.store.removeRequest(req.id);
          this.busyRequestId.set(null);
        });
      },
      error: () => this.busyRequestId.set(null),
    });
  }

  private slideOut(el: HTMLElement, done: () => void): void {
    gsap
      .timeline({ onComplete: done })
      .to(el, { x: '-100%', opacity: 0, duration: 0.3, ease: 'power2.in' })
      .to(el, { height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0, duration: 0.2 });
  }

  // ─── Unfriend ─────────────────────────────────────────────────────
  protected confirmUnfriend(friend: FriendDto, el: HTMLElement): void {
    this.unfriendTarget.set({ friend, el });
  }

  protected cancelUnfriend(): void {
    if (this.unfriending()) return;
    this.openId.set(null);
    this.unfriendTarget.set(null);
  }

  protected doUnfriend(): void {
    const target = this.unfriendTarget();
    if (!target) return;
    this.unfriending.set(true);
    this.service.unfriend(target.friend.id).subscribe({
      next: () => {
        this.slideOut(target.el, () => {
          this.openId.set(null);
          this.store.removeFriend(target.friend.id);
          this.unfriending.set(false);
          this.unfriendTarget.set(null);
        });
      },
      error: () => {
        this.openId.set(null);
        this.unfriending.set(false);
        this.unfriendTarget.set(null);
      },
    });
  }

  // ─── Swipe + tap gesture (pointer events, mouse + touch) ──────────
  protected translateFor(id: string): number {
    if (this.draggingId() === id) return this.dragX();
    return this.openId() === id ? -88 : 0;
  }

  protected onPointerDown(e: PointerEvent, id: string): void {
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.pointerDownTime = Date.now();
    this.axis = 'undecided';
    this.draggingId.set(id);
    this.dragX.set(this.openId() === id ? -88 : 0);
    if (this.openId() && this.openId() !== id) this.openId.set(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  protected onPointerMove(e: PointerEvent, id: string): void {
    if (this.draggingId() !== id) return;
    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    if (this.axis === 'undecided') {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        this.axis = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
    }
    if (this.axis !== 'horizontal') return;

    const base = this.openId() === id ? -88 : 0;
    this.dragX.set(Math.max(-96, Math.min(0, base + dx)));
  }

  protected onPointerUp(e: PointerEvent, id: string): void {
    if (this.draggingId() !== id) return;
    const elapsed = Date.now() - this.pointerDownTime;

    if (this.axis === 'horizontal') {
      this.openId.set(this.dragX() < -44 ? id : null);
    } else if (this.axis === 'undecided' && elapsed < 300) {
      if (this.openId() === id) {
        this.openId.set(null);
      } else {
        const friend = this.store.friends().find((f) => f.id === id) ?? null;
        if (friend) this.openProfile(friend);
      }
    }

    this.draggingId.set(null);
    this.axis = 'undecided';
  }

  protected onPointerCancel(id: string): void {
    if (this.draggingId() !== id) return;
    this.openId.set(null);
    this.draggingId.set(null);
    this.axis = 'undecided';
  }
}
