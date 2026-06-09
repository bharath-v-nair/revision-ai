import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { ToastContainerComponent } from './shared/ui/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `,
})
export class App implements OnInit {
  // Stub — implemented fully in Phase 3.10
  private swUpdate = inject(SwUpdate, { optional: true });

  ngOnInit(): void {
    // PWA update handling wired in Phase 3.10
  }
}
