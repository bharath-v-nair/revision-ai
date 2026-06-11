import { Component, inject, effect } from '@angular/core';
import gsap from 'gsap';
import { GamificationStore } from '../../../store/gamification.store';

const REASON_LABELS: Record<string, string> = {
  CorrectAnswer: '✅ Correct Answer',
  StreakBonus: '🔥 Streak Bonus',
  SpeedBonus: '⚡ Speed Bonus',
  MockCompletion: '🏆 Mock Complete',
  AchievementUnlocked: '🎖 Achievement Unlocked',
};

@Component({
  selector: 'app-xp-toast',
  imports: [],
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      @for (toast of gamStore.xpToastQueue(); track toast.id) {
        <div
          [class]="'xp-toast-' + toast.id"
          class="flex flex-col items-end bg-gradient-to-r from-indigo-600 to-primary text-white px-4 py-2.5 rounded-2xl shadow-lg min-w-[140px] opacity-0"
        >
          <span class="text-lg font-black tracking-tight">+{{ toast.delta }} XP</span>
          <span class="text-xs font-medium opacity-90">{{ reasonLabel(toast.reason) }}</span>
        </div>
      }
    </div>
  `,
})
export class XpToastComponent {
  protected gamStore = inject(GamificationStore);
  private animatedIds = new Set<number>();

  constructor() {
    effect(() => {
      const queue = this.gamStore.xpToastQueue();
      queue.forEach((toast) => {
        if (!this.animatedIds.has(toast.id)) {
          this.animatedIds.add(toast.id);
          this.animateToast(toast.id);
        }
      });
    });
  }

  protected reasonLabel(reason: string): string {
    return REASON_LABELS[reason] ?? reason;
  }

  private animateToast(id: number): void {
    setTimeout(() => {
      const el = document.querySelector(`.xp-toast-${id}`) as HTMLElement | null;
      if (!el) return;
      gsap
        .timeline()
        .fromTo(el, { x: 80, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power2.out' })
        .to(el, { y: -6, duration: 0.8, ease: 'power1.inOut', delay: 1.0 })
        .to(el, {
          opacity: 0,
          y: -20,
          duration: 0.4,
          ease: 'power2.in',
          onComplete: () => this.gamStore.dismissXpToast(id),
        });
    }, 0);
  }
}
