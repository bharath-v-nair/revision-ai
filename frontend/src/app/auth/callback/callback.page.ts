import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-callback',
  imports: [],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-white">
      <div class="flex flex-col items-center gap-4">
        <div class="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-500 text-sm">Signing you in...</p>
      </div>
    </div>
  `,
})
export default class CallbackPage implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  ngOnInit(): void {
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const idToken = params.get('id_token');

    if (!idToken) {
      this.handleError();
      return;
    }

    this.authService.loginWithGoogle(idToken).subscribe({
      next: () => this.handleSuccess(),
      error: () => this.handleError(),
    });
  }

  private handleSuccess(): void {
    if (window.opener) {
      window.opener.postMessage({ type: 'AUTH_SUCCESS' }, window.location.origin);
      window.close();
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private handleError(): void {
    if (window.opener) {
      window.opener.postMessage({ type: 'AUTH_ERROR', error: 'oauth_failed' }, window.location.origin);
      window.close();
    } else {
      this.router.navigate(['/auth/login'], { queryParams: { error: 'oauth_failed' } });
    }
  }
}
