import { Component, input, inject } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  template: `
    <header class="h-14 px-4 flex items-center bg-white border-b border-gray-100">
      @if (showBack()) {
        <button (click)="goBack()" class="mr-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600 hover:text-gray-900 -ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </button>
      }
      <h1 class="text-lg font-semibold text-gray-900 flex-1">{{ title() }}</h1>
      @if (actionIcon() && actionRoute()) {
        <a [routerLink]="actionRoute()" class="min-h-[44px] min-w-[44px] flex items-center justify-center text-gray-600">
          {{ actionIcon() }}
        </a>
      }
    </header>
  `,
})
export class HeaderComponent {
  readonly title = input<string>('');
  readonly showBack = input<boolean>(false);
  readonly actionIcon = input<string | undefined>(undefined);
  readonly actionRoute = input<string | undefined>(undefined);

  private location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
