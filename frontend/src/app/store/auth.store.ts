import { inject } from '@angular/core';
import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';
import { AuthUser, AuthResponse } from '../auth/auth.models';
import { GamificationStore } from './gamification.store';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  isAuthenticated: false,
  isLoading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, gamStore = inject(GamificationStore)) => ({
    setSession(response: AuthResponse): void {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('expiresAt', response.expiresAt);
      localStorage.setItem('user', JSON.stringify(response.user));
      patchState(store, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
      gamStore.loadGamificationData();
    },
    setTokens(accessToken: string, refreshToken: string): void {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      patchState(store, { accessToken, refreshToken, isAuthenticated: true });
    },
    clearSession(): void {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('expiresAt');
      localStorage.removeItem('user');
      patchState(store, { ...initialState });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
  })),
  withHooks({
    onInit(store, gamStore = inject(GamificationStore)) {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const expiresAt = localStorage.getItem('expiresAt');
      const userJson = localStorage.getItem('user');
      if (accessToken) {
        const user = userJson ? JSON.parse(userJson) : null;
        patchState(store, { accessToken, refreshToken, expiresAt, user, isAuthenticated: true });
        gamStore.loadGamificationData();
      }
    },
  }),
);
