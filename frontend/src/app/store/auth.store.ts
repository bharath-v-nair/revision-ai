import { signalStore, withState, withMethods, withHooks, patchState } from '@ngrx/signals';

interface AuthState {
  user: { id: string; email: string; displayName: string; avatarUrl?: string } | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    setTokens(accessToken: string, refreshToken: string): void {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      patchState(store, { accessToken, refreshToken, isAuthenticated: true });
    },
    clearSession(): void {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      patchState(store, { accessToken: null, refreshToken: null, isAuthenticated: false, user: null });
    },
  })),
  withHooks({
    onInit(store) {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken) {
        patchState(store, { accessToken, refreshToken, isAuthenticated: true });
      }
    },
  }),
);
