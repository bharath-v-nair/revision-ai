import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';
import { AuthUser, AuthResponse } from '../auth/auth.models';

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
  withMethods((store) => ({
    setSession(response: AuthResponse): void {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('expiresAt', response.expiresAt);
      patchState(store, {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
      });
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
      patchState(store, { ...initialState });
    },
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading });
    },
  })),
  withHooks({
    onInit(store) {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const expiresAt = localStorage.getItem('expiresAt');
      if (accessToken) {
        patchState(store, { accessToken, refreshToken, expiresAt, isAuthenticated: true });
      }
    },
  }),
);
