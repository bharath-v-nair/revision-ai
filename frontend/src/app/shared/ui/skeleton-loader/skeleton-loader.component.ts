import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  imports: [NgClass],
  template: `
    @if (type() === 'circle') {
      <div class="rounded-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse"
           style="width: 48px; height: 48px;"></div>
    } @else if (type() === 'card') {
      <div class="rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse h-32 w-full"></div>
    } @else {
      <div class="flex flex-col gap-2">
        @for (line of linesArray(); track $index) {
          <div class="rounded bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] animate-pulse h-4"
               [ngClass]="$last ? 'w-3/4' : 'w-full'"></div>
        }
      </div>
    }
  `,
})
export class SkeletonLoaderComponent {
  readonly lines = input<number>(3);
  readonly type = input<'text' | 'card' | 'circle'>('text');

  protected linesArray() {
    return Array(this.lines()).fill(0);
  }
}
