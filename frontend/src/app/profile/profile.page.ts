import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  template: `
    <div class="p-4 space-y-4">
      <p class="text-gray-600">Profile stub</p>

      <!-- QA / dev tools section — remove when content is stable -->
      <div class="border-t border-dashed border-gray-200 pt-4">
        <p class="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-2">Dev Tools</p>
        <a
          routerLink="/admin/reports"
          class="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100 transition-colors"
        >
          <span class="text-amber-500">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 01.707 1.707L13.414 9l3.293 3.293A1 1 0 0116 14H4a1 1 0 01-1-1V5z" clip-rule="evenodd"/>
              <path d="M3 5v9"/>
            </svg>
          </span>
          <div>
            <p class="text-sm font-semibold text-amber-800">QA Reports</p>
            <p class="text-xs text-amber-600">View and export flagged question issues</p>
          </div>
        </a>
      </div>
    </div>
  `,
})
export default class ProfilePage {}
