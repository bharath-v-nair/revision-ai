import { Routes } from '@angular/router';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  // Auth (no layout)
  { path: 'auth/login', loadComponent: () => import('./auth/login/login.page') },
  { path: 'auth/callback', loadComponent: () => import('./auth/callback/callback.page') },

  // Authenticated (AppLayout wraps all)
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard.page') },

      // Questions
      { path: 'questions', loadComponent: () => import('./questions/questions.page') },
      { path: 'questions/history', loadComponent: () => import('./questions/history/hourly-history.page') },

      // Daily Review (Spaced Repetition)
      { path: 'review', loadComponent: () => import('./review/review.page') },

      // Mocks
      { path: 'mock', loadComponent: () => import('./mock/builder/mock-builder.page') },
      { path: 'mock/history', loadComponent: () => import('./mock/history/mock-history.page') },
      { path: 'mock/:id', loadComponent: () => import('./mock/taker/mock-taker.page') },
      { path: 'mock/:id/results', loadComponent: () => import('./mock/results/mock-results.page') },

      // Bookmarks
      { path: 'bookmarks', loadComponent: () => import('./bookmarks/collections/bookmark-collections.page') },
      { path: 'bookmarks/:id', loadComponent: () => import('./bookmarks/items/bookmark-items.page') },

      // Stats
      { path: 'stats', loadComponent: () => import('./stats/analytics.page') },
      { path: 'stats/question/:id', loadComponent: () => import('./stats/question-history/question-history.page') },

      // Profile + Gamification
      { path: 'profile', loadComponent: () => import('./profile/profile.page') },
      { path: 'profile/achievements', loadComponent: () => import('./profile/achievements/achievements.page') },
      { path: 'profile/xp', loadComponent: () => import('./profile/xp-history/xp-history.page') },

      // Friends + Leaderboard
      { path: 'friends', loadComponent: () => import('./friends/friends.page') },
    ],
  },

  { path: '**', redirectTo: '/dashboard' },
];
