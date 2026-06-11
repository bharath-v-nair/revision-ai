import { Component, inject, computed, effect, ViewChild, ElementRef } from '@angular/core';
import gsap from 'gsap';
import { GamificationStore } from '../../../store/gamification.store';
import { AchievementDto } from '../../../dashboard/dashboard.models';

const TYPE_EMOJI: Record<string, string> = {
  StreakMilestone: '🔥',
  AccuracyMilestone: '🎯',
  QuestionCount: '📚',
  MockCompletion: '🏆',
  SpeedDemon: '⚡',
};

@Component({
  selector: 'app-achievement-toast',
  imports: [],
  template: `
    @if (current()) {
      <div
        #sheet
        class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 translate-y-full"
      >
        <div class="bg-white rounded-t-3xl shadow-2xl px-6 pt-6 pb-10 min-h-[280px] flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-4xl mb-3">
            {{ iconFor(current()!) }}
          </div>
          <p class="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Achievement Unlocked!</p>
          <h2 class="text-xl font-black text-gray-900 mb-1">{{ current()!.name }}</h2>
          <p class="text-sm text-gray-500 leading-relaxed">{{ current()!.description }}</p>
          <button
            class="mt-6 px-6 py-2 bg-primary text-white rounded-full text-sm font-semibold"
            (click)="dismiss()"
          >
            Awesome!
          </button>
        </div>
      </div>
    }
  `,
})
export class AchievementToastComponent {
  protected gamStore = inject(GamificationStore);
  protected current = computed(() => this.gamStore.achievementToastQueue()[0] ?? null);

  @ViewChild('sheet') sheetRef?: ElementRef<HTMLElement>;

  private dismissTimer?: ReturnType<typeof setTimeout>;
  private lastShownId: string | null = null;

  constructor() {
    effect(() => {
      const achievement = this.current();
      if (achievement && achievement.id !== this.lastShownId) {
        this.lastShownId = achievement.id;
        clearTimeout(this.dismissTimer);
        setTimeout(() => this.animateIn(), 0);
        this.dismissTimer = setTimeout(() => this.dismiss(), 4000);
      }
    });
  }

  protected iconFor(a: AchievementDto): string {
    if (a.iconUrl) return '';
    return TYPE_EMOJI[a.type] ?? '🎖';
  }

  private animateIn(): void {
    const el = this.sheetRef?.nativeElement;
    if (!el) return;
    gsap.fromTo(el, { y: '100%' }, { y: '0%', duration: 0.4, ease: 'power3.out' });
  }

  protected dismiss(): void {
    clearTimeout(this.dismissTimer);
    const el = this.sheetRef?.nativeElement;
    if (el) {
      gsap.to(el, {
        y: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => this.gamStore.dismissAchievementToast(),
      });
    } else {
      this.gamStore.dismissAchievementToast();
    }
  }
}
