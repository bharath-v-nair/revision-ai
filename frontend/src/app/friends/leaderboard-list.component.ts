import { Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { AvatarComponent } from '../shared/ui/avatar/avatar.component';
import { LeaderboardEntry } from './friends.models';

/**
 * Shared ranked list used by all three leaderboard sub-tabs.
 * Top-3 rows get tier backgrounds; the current user's row is highlighted
 * with a "You" badge. `xpField` selects which XP value to display.
 */
@Component({
  selector: 'app-leaderboard-list',
  imports: [DecimalPipe, AvatarComponent],
  template: `
    @if (loading()) {
      <div class="py-16 flex justify-center">
        <svg class="w-6 h-6 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
      </div>
    } @else if (entries().length === 0) {
      <div class="py-16 px-6 text-center">
        <span class="text-4xl">🏁</span>
        <p class="mt-3 text-sm text-gray-500">{{ emptyMessage() }}</p>
      </div>
    } @else {
      <div class="space-y-2">
        @for (entry of entries(); track entry.userId) {
          <div
            class="flex items-center gap-3 rounded-2xl border px-3"
            [class]="rowClass(entry) + ' ' + (isTop3(entry) || isMe(entry) ? 'py-4' : 'py-3')"
          >
            <!-- Rank / medal -->
            <div class="w-7 flex-shrink-0 text-center">
              @if (medal(entry.rank)) {
                <span class="text-xl leading-none">{{ medal(entry.rank) }}</span>
              } @else {
                <span class="text-sm font-bold text-gray-400">{{ entry.rank }}</span>
              }
            </div>

            <app-avatar [url]="entry.avatarUrl" [name]="entry.displayName" size="sm" />

            <div class="flex-1 min-w-0 flex items-center gap-2">
              <span class="text-sm font-semibold text-gray-800 truncate">{{ entry.displayName }}</span>
              @if (isMe(entry)) {
                <span class="px-1.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold flex-shrink-0">You</span>
              }
            </div>

            <span class="flex-shrink-0 text-sm font-bold text-gray-900">
              {{ xpValue(entry) | number }}
              <span class="text-xs font-medium text-gray-400">XP</span>
            </span>
          </div>
        }
      </div>
    }
  `,
})
export class LeaderboardListComponent {
  readonly entries = input.required<LeaderboardEntry[]>();
  readonly xpField = input<'weeklyXp' | 'totalXp'>('weeklyXp');
  readonly currentUserId = input<string | null>(null);
  readonly loading = input(false);
  readonly emptyMessage = input('No rankings yet.');

  protected isMe(e: LeaderboardEntry): boolean {
    const id = this.currentUserId();
    return !!id && e.userId === id;
  }

  protected isTop3(e: LeaderboardEntry): boolean {
    return e.rank <= 3;
  }

  protected xpValue(e: LeaderboardEntry): number {
    return (this.xpField() === 'totalXp' ? e.totalXp : e.weeklyXp) ?? 0;
  }

  protected medal(rank: number): string {
    return rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
  }

  protected rowClass(e: LeaderboardEntry): string {
    // Current-user highlight wins over the medal tier colours.
    if (this.isMe(e)) return 'bg-indigo-50 border-indigo-200';
    switch (e.rank) {
      case 1:
        return 'bg-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gray-50 border-gray-200';
      case 3:
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-100';
    }
  }
}
