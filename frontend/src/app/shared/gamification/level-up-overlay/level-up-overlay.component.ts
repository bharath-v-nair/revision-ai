import { Component, inject, effect, ViewChild, ElementRef } from '@angular/core';
import gsap from 'gsap';
import { GamificationStore } from '../../../store/gamification.store';

const CONFETTI_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#F8C8D4', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E9', '#82E0AA',
];

@Component({
  selector: 'app-level-up-overlay',
  imports: [],
  template: `
    @if (gamStore.showLevelUp()) {
      <div
        #overlay
        class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm"
        (click)="dismiss()"
      >
        <div #levelText class="text-center px-8 scale-0">
          <p class="text-6xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-primary bg-clip-text text-transparent select-none">
            LEVEL UP!
          </p>
          <p class="text-white text-xl font-semibold mt-3 opacity-90">
            Level {{ gamStore.levelUpFrom() }} → Level {{ gamStore.levelUpTo() }}
          </p>

          <!-- XP bar -->
          <div class="mt-6 w-64 mx-auto h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              #xpBar
              class="h-full bg-gradient-to-r from-yellow-400 to-primary rounded-full"
              style="width: 0%"
            ></div>
          </div>
          <p class="text-white/60 text-xs mt-2">XP Bar Filled!</p>
        </div>

        <p class="absolute bottom-12 text-white/50 text-sm">Tap anywhere to continue</p>
      </div>
    }
  `,
})
export class LevelUpOverlayComponent {
  protected gamStore = inject(GamificationStore);

  @ViewChild('overlay') overlayRef?: ElementRef<HTMLElement>;
  @ViewChild('levelText') textRef?: ElementRef<HTMLElement>;
  @ViewChild('xpBar') xpBarRef?: ElementRef<HTMLElement>;

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private prevShowLevelUp = false;

  constructor() {
    effect(() => {
      const showing = this.gamStore.showLevelUp();
      if (showing && !this.prevShowLevelUp) {
        this.prevShowLevelUp = true;
        setTimeout(() => this.animate(), 0);
      } else if (!showing) {
        this.prevShowLevelUp = false;
      }
    });
  }

  private animate(): void {
    const text = this.textRef?.nativeElement;
    const xpBar = this.xpBarRef?.nativeElement;
    const overlay = this.overlayRef?.nativeElement;
    if (!text || !overlay) return;

    this.spawnConfetti(overlay);

    gsap
      .timeline()
      .fromTo(text, { scale: 0 }, { scale: 1.3, duration: 0.4, ease: 'back.out(2)' })
      .to(text, { scale: 1, duration: 0.2, ease: 'power2.out' });

    if (xpBar) {
      gsap.fromTo(xpBar, { width: '0%' }, { width: '100%', duration: 1.2, ease: 'power2.out', delay: 0.3 });
    }

    clearTimeout(this.dismissTimer);
    this.dismissTimer = setTimeout(() => this.gamStore.dismissLevelUp(), 3000);
  }

  protected dismiss(): void {
    clearTimeout(this.dismissTimer);
    this.gamStore.dismissLevelUp();
  }

  private spawnConfetti(container: HTMLElement): void {
    for (let i = 0; i < 80; i++) {
      const el = document.createElement('div');
      const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
      const size = 6 + Math.random() * 8;
      el.style.cssText = `
        position:absolute;
        top:0;
        left:${Math.random() * 100}%;
        width:${size}px;
        height:${size * 1.6}px;
        background:${color};
        border-radius:2px;
        pointer-events:none;
        transform:rotate(${Math.random() * 360}deg);
      `;
      container.appendChild(el);
      gsap.to(el, {
        y: window.innerHeight + 100,
        x: (Math.random() - 0.5) * 300,
        rotation: Math.random() * 720 - 360,
        opacity: 0,
        duration: 1.5 + Math.random() * 1.5,
        delay: Math.random() * 1.2,
        ease: 'power2.in',
        onComplete: () => el.remove(),
      });
    }
  }
}
