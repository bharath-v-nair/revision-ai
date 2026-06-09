import { ApplicationConfig, APP_INITIALIZER, inject, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthStore } from './store/auth.store';
import { AuthService } from './auth/auth.service';

function initializeAuth(): () => Promise<void> | void {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  return () => {
    const expiresAt = authStore.expiresAt();
    const refreshToken = authStore.refreshToken();

    if (!expiresAt || !refreshToken) return;

    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();

    if (expiry > now) {
      authService.scheduleTokenRefresh(expiresAt);
      return;
    }

    // Token expired — attempt refresh before app boots
    return new Promise<void>(resolve => {
      authService.refreshToken(refreshToken).subscribe({
        next: () => resolve(),
        error: () => {
          authStore.clearSession();
          resolve();
        },
      });
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      multi: true,
    },
    isDevMode()
      ? provideServiceWorker('ngsw-worker.js', { enabled: false })
      : provideServiceWorker('ngsw-worker.js', { registrationStrategy: 'registerWhenStable:30000' }),
  ],
};
