import { inject, computed } from '@angular/core';
import {
  signalStore,
  withState,
  withMethods,
  withComputed,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { forkJoin } from 'rxjs';
import { FriendsService } from '../friends/friends.service';
import {
  FriendDto,
  FriendRequestDto,
  LeaderboardEntry,
  UserSearchResult,
  SentRequest,
} from '../friends/friends.models';

const LS_SENT_KEY = 'social_sent_requests';
const SENT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface SocialState {
  friends: FriendDto[];
  friendRequests: FriendRequestDto[];
  outgoingRequests: SentRequest[];
  friendsLeaderboard: LeaderboardEntry[];
  globalLeaderboard: LeaderboardEntry[];
  weeklyLeaderboard: LeaderboardEntry[];
  searchResults: UserSearchResult[];
  isSearching: boolean;
  isLoading: boolean;
  // Friends LB: never cached — always re-fetched when the tab opens
  // (friendship changes are frequent so staleness is a bad UX trade)
  friendsLbLoading: boolean;
  globalLbLoaded: boolean;
  weeklyLbLoaded: boolean;
  globalLbLoading: boolean;
  weeklyLbLoading: boolean;
}

const initialState: SocialState = {
  friends: [],
  friendRequests: [],
  outgoingRequests: [],
  friendsLeaderboard: [],
  globalLeaderboard: [],
  weeklyLeaderboard: [],
  searchResults: [],
  isSearching: false,
  isLoading: false,
  friendsLbLoading: false,
  globalLbLoaded: false,
  weeklyLbLoaded: false,
  globalLbLoading: false,
  weeklyLbLoading: false,
};

function saveSentRequests(list: SentRequest[]): void {
  try {
    localStorage.setItem(LS_SENT_KEY, JSON.stringify(list));
  } catch { /* storage full or SSR */ }
}

export const SocialStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    pendingCount: computed(() => store.friendRequests().length),
  })),
  withMethods((store, service = inject(FriendsService)) => ({
    // ─── Page load ────────────────────────────────────────────────────
    load(): void {
      patchState(store, { isLoading: true });
      forkJoin({
        friends: service.getFriends(),
        requests: service.getRequests(),
      }).subscribe({
        next: ({ friends, requests }) =>
          patchState(store, { friends, friendRequests: requests, isLoading: false }),
        error: () => patchState(store, { isLoading: false }),
      });
    },

    /** Re-fetch the friends list and auto-clear any sent-invite that was accepted. */
    reloadFriends(): void {
      service.getFriends().subscribe({
        next: (friends) => {
          patchState(store, { friends });
          // Auto-dismiss outgoing requests for users who are now friends.
          // Match by displayName (FriendDto exposes no userId).
          const friendNames = new Set(friends.map((f) => f.displayName.trim().toLowerCase()));
          const remaining = store
            .outgoingRequests()
            .filter((r) => !friendNames.has(r.displayName.trim().toLowerCase()));
          if (remaining.length !== store.outgoingRequests().length) {
            patchState(store, { outgoingRequests: remaining });
            saveSentRequests(remaining);
          }
        },
      });
    },

    removeRequest(id: string): void {
      patchState(store, {
        friendRequests: store.friendRequests().filter((r) => r.id !== id),
      });
    },

    removeFriend(id: string): void {
      patchState(store, {
        friends: store.friends().filter((f) => f.id !== id),
      });
    },

    // ─── Outgoing (sent) request persistence ──────────────────────────
    markRequestSent(entry: SentRequest): void {
      if (store.outgoingRequests().some((r) => r.userId === entry.userId)) return;
      const updated = [...store.outgoingRequests(), entry];
      patchState(store, { outgoingRequests: updated });
      saveSentRequests(updated);
    },

    dismissOutgoingRequest(userId: string): void {
      const updated = store.outgoingRequests().filter((r) => r.userId !== userId);
      patchState(store, { outgoingRequests: updated });
      saveSentRequests(updated);
    },

    // ─── Leaderboards ─────────────────────────────────────────────────
    /**
     * Friends leaderboard: always fetches fresh (no "already loaded" guard)
     * because friend membership changes invalidate it immediately.
     */
    loadFriendsLeaderboard(): void {
      if (store.friendsLbLoading()) return;
      patchState(store, { friendsLbLoading: true });
      service.getFriendsLeaderboard().subscribe({
        next: (data) =>
          patchState(store, { friendsLeaderboard: data, friendsLbLoading: false }),
        error: () => patchState(store, { friendsLbLoading: false }),
      });
    },

    loadGlobalLeaderboard(force = false): void {
      if (store.globalLbLoading() || (store.globalLbLoaded() && !force)) return;
      patchState(store, { globalLbLoading: true });
      service.getGlobalLeaderboard().subscribe({
        next: (data) =>
          patchState(store, {
            globalLeaderboard: data,
            globalLbLoading: false,
            globalLbLoaded: true,
          }),
        error: () => patchState(store, { globalLbLoading: false }),
      });
    },

    loadWeeklyLeaderboard(force = false): void {
      if (store.weeklyLbLoading() || (store.weeklyLbLoaded() && !force)) return;
      patchState(store, { weeklyLbLoading: true });
      service.getWeeklyLeaderboard().subscribe({
        next: (data) =>
          patchState(store, {
            weeklyLeaderboard: data,
            weeklyLbLoading: false,
            weeklyLbLoaded: true,
          }),
        error: () => patchState(store, { weeklyLbLoading: false }),
      });
    },

    // ─── User search ──────────────────────────────────────────────────
    search(term: string): void {
      patchState(store, { isSearching: true });
      service.searchUsers(term).subscribe({
        next: (results) => patchState(store, { searchResults: results, isSearching: false }),
        error: () => patchState(store, { searchResults: [], isSearching: false }),
      });
    },

    clearSearch(): void {
      patchState(store, { searchResults: [], isSearching: false });
    },
  })),
  withHooks({
    onInit(store) {
      try {
        const raw = localStorage.getItem(LS_SENT_KEY);
        if (raw) {
          const cutoff = Date.now() - SENT_TTL_MS;
          const fresh = (JSON.parse(raw) as SentRequest[]).filter(
            (r) => new Date(r.sentAt).getTime() > cutoff,
          );
          patchState(store, { outgoingRequests: fresh });
        }
      } catch { /* ignore */ }
    },
  }),
);
