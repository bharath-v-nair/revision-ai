import {
  Component,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  output,
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { AnalyticsStore } from '../../../store/analytics.store';

@Component({
  selector: 'app-batch-analysis-popup',
  imports: [],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/40 z-40"
      (click)="dismiss()"
    ></div>

    <!-- Panel -->
    <div
      #panel
      class="fixed bottom-0 left-0 right-0 mx-auto z-50 bg-white rounded-t-3xl p-6 overflow-y-auto"
      style="max-width: 480px; max-height: 70vh;"
    >
      <!-- Drag handle -->
      <div class="flex justify-center mb-5">
        <div class="w-10 h-1 bg-gray-200 rounded-full"></div>
      </div>

      <h2 class="text-lg font-bold text-gray-900 mb-1">Your last 5 questions</h2>
      <div class="h-px bg-gray-100 mb-5"></div>

      @if (!analyticsStore.batchResult()) {
        <div class="flex flex-col items-center gap-3 py-8">
          <div class="w-8 h-8 border-[3px] border-primary border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-gray-400">Analysing…</p>
        </div>
      } @else {
        <!-- Big accuracy number -->
        <div class="text-center mb-6">
          <div
            class="text-6xl font-black leading-none"
            [style.color]="accuracyColor(analyticsStore.batchResult()!.accuracyPercentage)"
          >
            {{ analyticsStore.batchResult()!.accuracyPercentage.toFixed(0) }}%
          </div>
          <p class="text-sm text-gray-500 mt-1">accuracy</p>
        </div>

        <!-- Sub-stats -->
        <div class="flex gap-4 justify-center mb-6">
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">
              {{ analyticsStore.batchResult()!.correctCount }}/{{ analyticsStore.batchResult()!.totalQuestions }}
            </div>
            <div class="text-xs text-gray-500">correct</div>
          </div>
          <div class="w-px bg-gray-200"></div>
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-800">
              {{ (analyticsStore.batchResult()!.averageTimeMs / 1000).toFixed(1) }}s
            </div>
            <div class="text-xs text-gray-500">avg time</div>
          </div>
        </div>

        <!-- Tip box -->
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <p class="text-sm text-amber-800">
            💡 {{ tipText(analyticsStore.batchResult()!.accuracyPercentage) }}
          </p>
        </div>
      }

      <!-- Actions -->
      <div class="flex flex-col gap-3">
        <button
          class="w-full py-3.5 bg-primary text-white rounded-2xl font-semibold text-sm active:opacity-90"
          (click)="goToMock()"
        >Start Targeted Mock</button>
        <button
          class="w-full py-3.5 border-2 border-gray-200 text-gray-700 rounded-2xl font-semibold text-sm active:bg-gray-50"
          (click)="dismiss()"
        >Dismiss</button>
      </div>
    </div>
  `,
})
export class BatchAnalysisPopupComponent implements AfterViewInit {
  @ViewChild('panel') panelRef!: ElementRef<HTMLDivElement>;

  protected analyticsStore = inject(AnalyticsStore);
  private router = inject(Router);

  readonly dismissed = output<void>();

  ngAfterViewInit(): void {
    gsap.from(this.panelRef.nativeElement, {
      y: '100%',
      duration: 0.4,
      ease: 'power2.out',
    });
  }

  protected accuracyColor(pct: number): string {
    if (pct >= 70) return '#22c55e';
    if (pct >= 50) return '#eab308';
    return '#ef4444';
  }

  protected tipText(pct: number): string {
    if (pct >= 80) return 'Great session! Keep up the momentum.';
    if (pct >= 50) return 'Good effort. Review your wrong answers.';
    return 'Tough set. Consider reviewing this topic.';
  }

  protected goToMock(): void {
    this.animateOut(() => this.router.navigate(['/mock']));
  }

  protected dismiss(): void {
    localStorage.setItem('batch_popup_last_shown', Date.now().toString());
    this.animateOut();
  }

  private animateOut(onComplete?: () => void): void {
    gsap.to(this.panelRef.nativeElement, {
      y: '100%',
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.analyticsStore.closePopup();
        this.dismissed.emit();
        onComplete?.();
      },
    });
  }
}
