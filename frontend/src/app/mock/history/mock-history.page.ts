import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import { MockHistoryDto } from '../mock.models';

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

@Component({
  selector: 'app-mock-history',
  imports: [RouterLink],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <a routerLink="/mock" class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200">
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </a>
        <h1 class="text-xl font-bold text-gray-800">Mock History</h1>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto">

        @if (isLoading() && items().length === 0) {
          <div class="flex items-center justify-center py-16">
            <p class="text-gray-400 text-sm">Loading history…</p>
          </div>
        } @else if (!isLoading() && items().length === 0) {
          <div class="flex flex-col items-center justify-center gap-4 p-10 text-center py-20">
            <span class="text-5xl">📋</span>
            <h2 class="text-lg font-semibold text-gray-700">No mocks yet</h2>
            <p class="text-sm text-gray-500">Build your first mock to start practicing!</p>
            <a
              routerLink="/mock"
              class="mt-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm"
            >Build a Mock</a>
          </div>
        } @else {
          <div class="px-4 py-3 space-y-2">
            @for (item of items(); track item.mockSessionId) {
              <a
                [routerLink]="['/mock', item.mockSessionId, 'results']"
                class="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 active:bg-gray-50"
              >
                <!-- Date + info -->
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-400">{{ formatDate(item.startedAt) }}</p>
                  <p class="text-sm font-semibold text-gray-800 mt-0.5">{{ item.questionCount }} questions</p>
                  <p class="text-xs text-gray-500 mt-0.5">
                    @if (item.completedAt) {
                      Time: {{ formatTime(item.timeTakenSeconds) }}
                    } @else {
                      <span class="text-orange-500 font-medium">In progress</span>
                    }
                  </p>
                </div>

                <!-- Score badge -->
                <div
                  class="flex-shrink-0 w-14 h-14 rounded-full flex items-center justify-center border-2"
                  [class]="scoreBadgeClass(scorePercent(item))"
                >
                  @if (item.score !== null) {
                    <div class="text-center">
                      <div class="text-sm font-bold leading-tight">{{ scorePercent(item).toFixed(0) }}%</div>
                    </div>
                  } @else {
                    <span class="text-gray-300 text-xs">—</span>
                  }
                </div>

                <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </a>
            }

            <!-- Infinite scroll sentinel -->
            @if (hasNext()) {
              <div #sentinel class="h-12 flex items-center justify-center">
                @if (isLoading()) {
                  <p class="text-gray-400 text-xs">Loading more…</p>
                }
              </div>
            }
          </div>
        }

        <!-- Always-rendered sentinel for intersection observer (when items exist) -->
        @if (items().length > 0 && !hasNext()) {
          <div class="py-6 text-center">
            <p class="text-xs text-gray-300">All caught up</p>
          </div>
        }

      </div>
    </div>
  `,
})
export default class MockHistoryPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('sentinel') sentinelRef?: ElementRef;

  private service = inject(QuestionService);

  protected items = signal<MockHistoryDto[]>([]);
  protected isLoading = signal(false);
  protected hasNext = signal(true);

  private page = 1;
  private observer?: IntersectionObserver;

  ngOnInit(): void {
    this.loadPage();
  }

  ngAfterViewInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupObserver(): void {
    if (!this.sentinelRef) return;
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !this.isLoading() && this.hasNext()) {
          this.loadPage();
        }
      },
      { threshold: 0.1 },
    );
    this.observer.observe(this.sentinelRef.nativeElement);
  }

  private loadPage(): void {
    if (this.isLoading() || !this.hasNext()) return;
    this.isLoading.set(true);
    this.service.getMockHistory(this.page, 20).subscribe({
      next: (res) => {
        this.items.update(prev => [...prev, ...res.data]);
        this.hasNext.set(res.meta.hasNext);
        this.page++;
        this.isLoading.set(false);
        // Re-check the sentinel after new items are rendered
        setTimeout(() => this.setupObserver(), 100);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected scorePercent(item: MockHistoryDto): number {
    if (item.score === null || !item.questionCount) return 0;
    return (item.score / item.questionCount) * 100;
  }

  protected scoreBadgeClass(pct: number | null): string {
    if (pct === null) return 'border-gray-200 text-gray-400';
    if (pct >= 70) return 'border-green-300 text-green-600 bg-green-50';
    if (pct >= 50) return 'border-yellow-300 text-yellow-600 bg-yellow-50';
    return 'border-red-300 text-red-600 bg-red-50';
  }

  protected formatDate = formatDate;
  protected formatTime = formatTime;
}
