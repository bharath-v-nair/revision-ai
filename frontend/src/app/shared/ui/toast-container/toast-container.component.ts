import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  imports: [NgClass],
  template: `
    <div class="fixed top-4 right-4 left-4 z-50 flex flex-col gap-2 pointer-events-none" style="max-width: 480px; margin: 0 auto; left: 0; right: 0;">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto px-4 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center justify-between gap-3"
          [ngClass]="{
            'bg-green-500': toast.type === 'success',
            'bg-red-500': toast.type === 'error',
            'bg-indigo-500': toast.type === 'info'
          }"
        >
          <span>{{ toast.message }}</span>
          <button (click)="toastService.dismiss(toast.id)" class="opacity-70 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected toastService = inject(ToastService);
}
