import { Component, input, viewChild, ElementRef, effect } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-xp-bar',
  imports: [],
  template: `
    <div class="flex-1 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="bg-primary text-white text-xs rounded-full px-2 py-0.5 font-medium">
          Lv. {{ level() }}
        </span>
        <span class="text-xs text-gray-500">
          {{ totalXp().toLocaleString() }} / {{ (totalXp() + xpToNextLevel()).toLocaleString() }} XP
        </span>
      </div>
      <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          #bar
          class="bg-gradient-to-r from-primary to-accent h-full rounded-full"
          style="width: 0%"
        ></div>
      </div>
    </div>
  `,
})
export class XpBarComponent {
  readonly totalXp = input.required<number>();
  readonly xpToNextLevel = input.required<number>();
  readonly level = input.required<number>();

  private barRef = viewChild<ElementRef<HTMLElement>>('bar');

  constructor() {
    // Re-run whenever totalXp, xpToNextLevel, or barRef (view init) change.
    effect(() => {
      const total = this.totalXp() + this.xpToNextLevel();
      const pct = total > 0 ? (this.totalXp() / total) * 100 : 0;
      const el = this.barRef()?.nativeElement;
      if (!el) return;
      gsap.to(el, { width: `${pct}%`, duration: 0.8, ease: 'power2.out' });
    });
  }
}
