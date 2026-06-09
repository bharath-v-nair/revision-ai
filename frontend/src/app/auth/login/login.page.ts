import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { environment } from '../../../environments/environment';

type LoginStep = 'input' | 'otp-sent' | 'verifying';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex flex-col items-center justify-center bg-white px-6 py-12">
      <div class="w-full max-w-sm">

        <!-- Header -->
        <div class="text-center mb-10">
          <h1 class="text-primary font-bold text-3xl mb-2">RevisionAI</h1>
          <p class="text-gray-800 font-semibold text-lg mb-1">Ace NEET PG. One question at a time.</p>
          <p class="text-gray-500 text-sm">2 questions every hour. Track streaks. Beat friends.</p>
        </div>

        <!-- Google Sign-In -->
        <button
          (click)="loginWithGoogle()"
          [disabled]="isGoogleLoading() || step() !== 'input'"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mb-6">
          @if (isGoogleLoading()) {
            <div class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          } @else {
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.705 17.64 9.2z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
            </svg>
          }
          <span class="text-gray-700 font-medium">Continue with Google</span>
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 mb-6">
          <div class="flex-1 h-px bg-gray-200"></div>
          <span class="text-gray-400 text-sm">or</span>
          <div class="flex-1 h-px bg-gray-200"></div>
        </div>

        <!-- Email OTP Section -->
        @if (step() === 'input') {
          <div class="flex flex-col gap-3">
            <input
              type="email"
              [(ngModel)]="emailValue"
              placeholder="Enter your email"
              [disabled]="isEmailLoading()"
              (keydown.enter)="sendOtp()"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60" />
            <button
              (click)="sendOtp()"
              [disabled]="isEmailLoading() || !emailValue"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
              @if (isEmailLoading()) {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else {
                Send OTP
              }
            </button>
          </div>
        }

        @if (step() === 'otp-sent' || step() === 'verifying') {
          <div>
            <p class="text-center text-gray-600 text-sm mb-4">
              We sent a 6-digit code to <strong class="text-gray-800">{{ emailValue }}</strong>
            </p>
            <div class="flex gap-2 justify-center mb-4">
              @for (i of digitIndices; track i) {
                <input
                  #digitInput
                  type="text"
                  inputmode="numeric"
                  maxlength="1"
                  [value]="otpDigits()[i]"
                  [disabled]="step() === 'verifying'"
                  (input)="onDigitInput(i, $event)"
                  (keydown)="onDigitKeydown(i, $event)"
                  (paste)="onOtpPaste($event)"
                  class="w-10 h-12 text-center border border-gray-200 rounded-lg text-lg font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-60 disabled:bg-gray-50" />
              }
            </div>
            <button
              (click)="verifyOtp()"
              [disabled]="step() === 'verifying' || otpDigits().join('').length < 6"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary-dark active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-3">
              @if (step() === 'verifying') {
                <div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              } @else {
                Verify OTP
              }
            </button>
            <button
              (click)="backToEmail()"
              [disabled]="step() === 'verifying'"
              class="w-full text-center text-sm text-primary hover:underline disabled:opacity-40">
              Back to email
            </button>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <p class="text-red-500 text-sm mt-3 text-center">{{ error() }}</p>
        }

        <!-- Terms -->
        <p class="text-gray-400 text-xs text-center mt-10">
          By continuing, you agree to our
          <span class="underline cursor-pointer">Terms of Service</span>
          and
          <span class="underline cursor-pointer">Privacy Policy</span>
        </p>

      </div>
    </div>
  `,
})
export default class LoginPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private messageListener: ((e: MessageEvent) => void) | null = null;

  readonly digitIndices = [0, 1, 2, 3, 4, 5];

  step = signal<LoginStep>('input');
  emailValue = '';
  otpDigits = signal<string[]>(['', '', '', '', '', '']);
  isGoogleLoading = signal(false);
  isEmailLoading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['error'] === 'oauth_failed') {
        this.error.set('Google sign-in failed. Please try again.');
      }
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  loginWithGoogle(): void {
    this.error.set(null);
    this.isGoogleLoading.set(true);

    const nonce = this.generateNonce();
    const redirectUri = `${window.location.origin}/auth/callback`;
    const params = new URLSearchParams({
      client_id: environment.googleClientId,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      nonce,
      prompt: 'select_account',
    });
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const popup = window.open(oauthUrl, 'google-oauth', 'width=500,height=600,left=200,top=100');

    if (!popup) {
      this.isGoogleLoading.set(false);
      this.error.set('Popup was blocked. Please allow popups for this site.');
      return;
    }

    this.messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'AUTH_SUCCESS') {
        this.isGoogleLoading.set(false);
        this.router.navigate(['/dashboard']);
      } else if (event.data?.type === 'AUTH_ERROR') {
        this.isGoogleLoading.set(false);
        this.error.set('Google sign-in failed. Please try again.');
      }
      if (this.messageListener) {
        window.removeEventListener('message', this.messageListener);
        this.messageListener = null;
      }
    };
    window.addEventListener('message', this.messageListener);

    // Detect popup closed without completing auth
    const pollClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollClosed);
        if (this.isGoogleLoading()) {
          this.isGoogleLoading.set(false);
          if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
          }
        }
      }
    }, 500);
  }

  sendOtp(): void {
    const email = this.emailValue.trim();
    if (!email) return;
    this.error.set(null);
    this.isEmailLoading.set(true);

    this.authService.sendOtp(email).subscribe({
      next: () => {
        this.isEmailLoading.set(false);
        this.step.set('otp-sent');
        this.otpDigits.set(['', '', '', '', '', '']);
        setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 50);
      },
      error: (err) => {
        this.isEmailLoading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to send OTP. Please try again.');
      },
    });
  }

  onDigitInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, '');
    const digit = raw.slice(-1);
    input.value = digit;

    const digits = [...this.otpDigits()];
    digits[index] = digit;
    this.otpDigits.set(digits);

    if (digit && index < 5) {
      this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
    }

    if (digits.every(d => d !== '') && this.step() === 'otp-sent') {
      this.verifyOtp();
    }
  }

  onDigitKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace' && !this.otpDigits()[index] && index > 0) {
      this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    event.preventDefault();
    const filled = [...digits, '', '', '', '', '', ''].slice(0, 6);
    this.otpDigits.set(filled);

    // Sync input DOM values
    this.digitInputs.toArray().forEach((ref, i) => {
      ref.nativeElement.value = filled[i];
    });

    const focusIndex = Math.min(digits.length, 5);
    this.digitInputs.toArray()[focusIndex]?.nativeElement.focus();

    if (filled.every(d => d !== '') && this.step() === 'otp-sent') {
      this.verifyOtp();
    }
  }

  verifyOtp(): void {
    const otp = this.otpDigits().join('');
    if (otp.length < 6) return;
    this.error.set(null);
    this.step.set('verifying');

    this.authService.verifyOtp(this.emailValue.trim(), otp).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.step.set('otp-sent');
        this.error.set(err?.error?.message ?? 'Invalid OTP. Please try again.');
        this.otpDigits.set(['', '', '', '', '', '']);
        setTimeout(() => this.digitInputs.first?.nativeElement.focus(), 50);
      },
    });
  }

  backToEmail(): void {
    this.step.set('input');
    this.otpDigits.set(['', '', '', '', '', '']);
    this.error.set(null);
  }

  private generateNonce(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
