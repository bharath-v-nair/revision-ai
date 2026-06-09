import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, BottomNavComponent],
  template: `
    <div class="max-w-[480px] mx-auto min-h-screen bg-surface relative">
      <main class="pb-20 min-h-screen">
        <router-outlet />
      </main>
      <app-bottom-nav />
    </div>
  `,
})
export class AppLayoutComponent {}
