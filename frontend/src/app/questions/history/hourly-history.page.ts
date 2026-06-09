import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuestionService } from '../question.service';
import { HourlyHistoryDto, PaginatedMeta } from '../question.models';

@Component({
  selector: 'app-hourly-history',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col h-full">

      <!-- Header -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white sticky top-0 z-10">
        <a routerLink="/questions" class="p-1.5 rounded-full hover:bg-gray-100">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-base font-bold text-gray-800">Hourly History</h1>
      </div>

      <!-- List -->
      <div
        class="flex-1 overflow-y-auto divide-y divide-gray-100"
        (scroll)="onScroll($event)"
      >
        @if (loading() && items().length === 0) {
          <div class="flex items-center justify-center py-20">
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (!items().length) {
          <div class="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
            <span class="text-5xl">📋</span>
            <p class="text-gray-600 font-semibold">No history yet</p>
            <p class="text-gray-400 text-sm">Answer hourly questions to build your history.</p>
          </div>
        } @else {
          @for (item of items(); track item.pendingQuestionId) {
            <a
              [routerLink]="['/stats/question', item.question.id]"
              class="block px-4 py-4 hover:bg-gray-50 active:bg-gray-100"
            >
              <div class="flex items-start gap-3">
                <!-- Status badge -->
                <div class="flex-shrink-0 mt-0.5">
                  @if (item.isAnswered) {
                    @if (item.userAnswer === item.question.questionText) {
                      <span class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm">✓</span>
                    } @else {
                      <span class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">📝</span>
                    }
                  } @else if (isExpired(item.expiresAt)) {
                    <span class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">⏰</span>
                  } @else {
                    <span class="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm">⌛</span>
                  }
                </div>

                <div class="flex-1 min-w-0">
                  <!-- Question text -->
                  <p class="text-sm text-gray-800 leading-snug">
                    {{ truncate(item.question.questionText, 100) }}
                  </p>

                  <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                    <!-- Date -->
                    <span class="text-xs text-gray-400">{{ formatDate(item.expiresAt) }}</span>

                    <!-- Status label -->
                    @if (item.isAnswered) {
                      <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Answered
                      </span>
                      @if (item.userAnswer) {
                        <span class="text-xs text-gray-500">Your answer: <strong>{{ item.userAnswer }}</strong></span>
                      }
                    } @else if (isExpired(item.expiresAt)) {
                      <span class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">
                        Expired
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                        Pending
                      </span>
                    }

                    @if (item.question.subjectName) {
                      <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {{ item.question.subjectName }}
                      </span>
                    }
                  </div>
                </div>

                <svg class="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </a>
          }

          @if (loading()) {
            <div class="flex justify-center py-6">
              <div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          }

          @if (!hasMore() && items().length) {
            <p class="text-center text-xs text-gray-400 py-6">No more history</p>
          }
        }
      </div>
    </div>
  `,
})
export default class HourlyHistoryPage implements OnInit {
  private service = inject(QuestionService);

  protected items = signal<HourlyHistoryDto[]>([]);
  protected loading = signal(false);
  protected hasMore = signal(true);
  private page = 1;
  private scrollEl?: HTMLElement;

  ngOnInit(): void {
    this.loadPage(1);
  }

  private loadPage(page: number): void {
    this.loading.set(true);
    this.service.getHourlyHistory(page).subscribe({
      next: (res) => {
        if (page === 1) this.items.set(res.data);
        else this.items.update(all => [...all, ...res.data]);
        this.hasMore.set(res.meta.hasNext);
        this.page = res.meta.page;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected onScroll(e: Event): void {
    const el = e.target as HTMLElement;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom && !this.loading() && this.hasMore()) {
      this.loadPage(this.page + 1);
    }
  }

  protected isExpired(expiresAt: string): boolean {
    return new Date(expiresAt).getTime() < Date.now();
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  protected truncate(text: string, len: number): string {
    return text.length > len ? text.slice(0, len) + '…' : text;
  }
}
