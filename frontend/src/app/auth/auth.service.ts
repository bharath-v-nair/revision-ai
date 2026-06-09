import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthStore } from '../store/auth.store';
import { AuthResponse } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private authStore = inject(AuthStore);
  private router = inject(Router);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  loginWithGoogle(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/google', { idToken }).pipe(
      tap(response => {
        this.authStore.setSession(response);
        this.scheduleTokenRefresh(response.expiresAt);
      }),
    );
  }

  sendOtp(email: string): Observable<void> {
    return this.http.post<void>('/api/auth/email/send-otp', { email });
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/email/verify-otp', { email, otp }).pipe(
      tap(response => {
        this.authStore.setSession(response);
        this.scheduleTokenRefresh(response.expiresAt);
      }),
    );
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }).pipe(
      tap(response => {
        this.authStore.setSession(response);
        this.scheduleTokenRefresh(response.expiresAt);
      }),
    );
  }

  logout(): void {
    const rt = this.authStore.refreshToken();
    if (rt) {
      this.http.post('/api/auth/logout', { refreshToken: rt }).subscribe({ error: () => {} });
    }
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.authStore.clearSession();
    this.router.navigate(['/auth/login']);
  }

  scheduleTokenRefresh(expiresAt: string): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const refreshAt = new Date(expiresAt).getTime() - 60_000 - Date.now();
    if (refreshAt > 0) {
      this.refreshTimer = setTimeout(() => {
        const rt = this.authStore.refreshToken();
        if (rt) {
          this.refreshToken(rt).subscribe({ error: () => this.logout() });
        }
      }, refreshAt);
    }
  }
}
