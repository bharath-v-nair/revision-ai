import {
  Component,
  input,
  viewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-streak-flame',
  imports: [],
  template: `
    <div class="flex flex-col items-center gap-1 min-w-[72px]">
      <span
        class="text-3xl leading-none"
        [class.animate-flame]="!isAtRisk()"
        [class.grayscale]="isAtRisk()"
      >🔥</span>
      <span #counter class="text-2xl font-bold text-gray-800">0</span>
      <span class="text-xs text-gray-500 whitespace-nowrap">
        @if (isAtRisk()) {
          at risk ⚠️
        } @else {
          day streak
        }
      </span>
    </div>
  `,
})
export class StreakFlameComponent implements AfterViewInit {
  readonly streak = input.required<number>();
  readonly isAtRisk = input<boolean>(false);

  private counterRef = viewChild<ElementRef>('counter');

  ngAfterViewInit(): void {
    const el = this.counterRef()?.nativeElement;
    if (!el) return;
    const obj = { value: 0 };
    gsap.to(obj, {
      value: this.streak(),
      duration: 1,
      ease: 'power2.out',
      snap: { value: 1 },
      onUpdate: () => {
        el.textContent = Math.round(obj.value).toString();
      },
    });
  }
}
