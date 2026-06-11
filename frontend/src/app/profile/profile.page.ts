import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../store/auth.store';

interface ProfileLink {
  label: string;
  sublabel: string;
  route: string;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col h-full bg-gray-50 overflow-y-auto pb-6">

      <!-- User header card -->
      <div class="bg-white px-4 pt-6 pb-5 border-b border-gray-100">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="relative flex-shrink-0">
            @if (user()?.avatarUrl) {
              <img
                [src]="user()!.avatarUrl"
                class="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20"
                alt="Avatar"
              />
            } @else {
              <div class="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-primary/20">
                {{ initials() }}
              </div>
            }
            <!-- Online dot -->
            <span class="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white"></span>
          </div>

          <!-- Name & email -->
          <div class="flex-1 min-w-0">
            <h1 class="text-lg font-bold text-gray-900 truncate">{{ user()?.displayName ?? 'Student' }}</h1>
            <p class="text-sm text-gray-500 truncate">{{ user()?.email ?? '' }}</p>
            <span class="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              🎓 NEET PG Aspirant
            </span>
          </div>

          <!-- Edit button -->
          <button class="p-2 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0" aria-label="Edit profile">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- My Content section -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">My Content</p>
        <div class="grid grid-cols-2 gap-3">
          @for (link of contentLinks; track link.route) {
            <a
              [routerLink]="link.route"
              class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md active:scale-[0.98] transition-all flex flex-col gap-2"
            >
              <span class="text-3xl">{{ link.emoji }}</span>
              <div>
                <p class="text-sm font-semibold text-gray-800">{{ link.label }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ link.sublabel }}</p>
              </div>
            </a>
          }
        </div>
      </div>

      <!-- Social section -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Social</p>
        <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
          @for (link of socialLinks; track link.route) {
            <a
              [routerLink]="link.route"
              class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <span class="text-xl w-8 text-center flex-shrink-0">{{ link.emoji }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800">{{ link.label }}</p>
                <p class="text-xs text-gray-400">{{ link.sublabel }}</p>
              </div>
              <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </a>
          }
        </div>
      </div>

      <!-- App section -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">App</p>
        <div class="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
          <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
            <span class="text-xl w-8 text-center flex-shrink-0">🔔</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">Notifications</p>
              <p class="text-xs text-gray-400">Reminders & alerts</p>
            </div>
            <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          <div class="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
            <span class="text-xl w-8 text-center flex-shrink-0">ℹ️</span>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">About RevisionAI</p>
              <p class="text-xs text-gray-400">Version 0.1.0 (beta)</p>
            </div>
            <svg class="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
          <!-- Sign out -->
          <button
            class="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 active:bg-red-100 transition-colors"
            (click)="signOut()"
          >
            <span class="text-xl w-8 text-center flex-shrink-0">🚪</span>
            <p class="text-sm font-semibold text-red-500">Sign Out</p>
          </button>
        </div>
      </div>

      <!-- Dev tools — remove when stable -->
      <div class="px-4 pt-5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dev Tools</p>
        <a
          routerLink="/admin/reports"
          class="flex items-center gap-3 px-4 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 active:bg-amber-200 transition-colors"
        >
          <span class="text-xl w-8 text-center flex-shrink-0">🚩</span>
          <div>
            <p class="text-sm font-semibold text-amber-800">QA Reports</p>
            <p class="text-xs text-amber-600">Flagged question issues</p>
          </div>
        </a>
      </div>

    </div>
  `,
})
export default class ProfilePage {
  private authStore = inject(AuthStore);
  private router = inject(Router);

  protected user = this.authStore.user;

  protected readonly contentLinks: ProfileLink[] = [
    {
      label: 'My Notes',
      sublabel: 'Your study library',
      route: '/notes',
      emoji: '📝',
      color: 'green',
    },
    {
      label: 'Bookmarks',
      sublabel: 'Saved questions',
      route: '/bookmarks',
      emoji: '🔖',
      color: 'indigo',
    },
    {
      label: 'Achievements',
      sublabel: 'Badges & milestones',
      route: '/profile/achievements',
      emoji: '🏆',
      color: 'amber',
    },
    {
      label: 'XP History',
      sublabel: 'Points & streaks',
      route: '/profile/xp',
      emoji: '⚡',
      color: 'yellow',
    },
  ];

  protected readonly socialLinks: ProfileLink[] = [
    {
      label: 'Friends',
      sublabel: 'Study together',
      route: '/friends',
      emoji: '👥',
      color: 'blue',
    },
    {
      label: 'Leaderboard',
      sublabel: 'Top performers',
      route: '/friends',
      emoji: '🏅',
      color: 'orange',
    },
  ];

  protected initials(): string {
    const name = this.user()?.displayName ?? this.user()?.email ?? 'S';
    return name
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  protected signOut(): void {
    this.authStore.clearSession();
    this.router.navigate(['/auth/login']);
  }
}
