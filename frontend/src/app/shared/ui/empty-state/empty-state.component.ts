import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center gap-4 py-16 px-6 text-center">
      <span class="text-5xl">{{ icon() }}</span>
      <h3 class="text-lg font-semibold text-gray-900">{{ title() }}</h3>
      <p class="text-sm text-gray-500">{{ subtitle() }}</p>
      @if (ctaLabel() && ctaRoute()) {
        <a [routerLink]="ctaRoute()"
           class="mt-2 px-6 py-2 bg-primary text-white rounded-full text-sm font-medium">
          {{ ctaLabel() }}
        </a>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input<string>('📭');
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly ctaLabel = input<string | undefined>(undefined);
  readonly ctaRoute = input<string | undefined>(undefined);
}
