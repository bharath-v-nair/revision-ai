import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../../store/auth.store';
import { AuthService } from '../../auth/auth.service';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const authService = inject(AuthService);

  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = authStore.accessToken();
  const authedReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        return refreshSubject.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(t =>
            next(req.clone({ setHeaders: { Authorization: `Bearer ${t!}` } })),
          ),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      const rt = authStore.refreshToken();
      if (!rt) {
        isRefreshing = false;
        authService.logout();
        return throwError(() => error);
      }

      return authService.refreshToken(rt).pipe(
        switchMap(response => {
          isRefreshing = false;
          refreshSubject.next(response.accessToken);
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${response.accessToken}` } }),
          );
        }),
        catchError(refreshError => {
          isRefreshing = false;
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
