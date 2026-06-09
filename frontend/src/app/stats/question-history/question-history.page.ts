import { Component } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-question-history',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <span class="text-5xl">📊</span>
      <h2 class="text-lg font-bold text-gray-800">Question Analytics</h2>
      <p class="text-sm text-gray-500">
        Detailed attempt history for this question is coming in Phase 3.7 (Analytics).
      </p>
      <a routerLink="/questions/history"
         class="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold">
        ← Back to History
      </a>
    </div>
  `,
})
export default class QuestionHistoryPage {}
