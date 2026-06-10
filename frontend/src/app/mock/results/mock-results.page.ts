import {
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuestionService } from '../../questions/question.service';
import { MockResultsResponse, MockResultQuestionDto } from '../mock.models';
import { MediaDto } from '../../questions/question.models';
import { ExplanationTabsComponent } from '../../shared/question/explanation-tabs/explanation-tabs.component';

const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

@Component({
  selector: 'app-mock-results',
  imports: [RouterLink, ExplanationTabsComponent],
  template: `
    <div class="flex flex-col min-h-full bg-gray-50">

      @if (isLoading()) {
        <div class="flex-1 flex items-center justify-center py-20">
          <p class="text-gray-400 text-sm">Loading results…</p>
        </div>
      } @else if (error()) {
        <div class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <span class="text-5xl">⚠️</span>
          <p class="text-gray-600 text-sm">{{ error() }}</p>
          <button routerLink="/mock" class="px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm">
            Back to Mocks
          </button>
        </div>
      } @else if (results(); as r) {

        <!-- Score hero -->
        <div class="bg-white px-6 py-8 flex flex-col items-center border-b border-gray-100">
          <svg width="130" height="130" viewBox="0 0 120 120" class="mb-3">
            <!-- Background ring -->
            <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" stroke-width="10"/>
            <!-- Progress ring -->
            <circle
              cx="60" cy="60" r="45" fill="none"
              [attr.stroke]="ringColor(accuracyPercent(r))"
              stroke-width="10"
              stroke-linecap="round"
              [attr.stroke-dasharray]="ringCircumference"
              [attr.stroke-dashoffset]="ringOffset(accuracyPercent(r))"
              transform="rotate(-90 60 60)"
            />
            <!-- Center label -->
            <text x="60" y="54" text-anchor="middle" font-size="18" font-weight="bold" fill="#111827">
              {{ r.correctCount }}/{{ r.totalQuestions }}
            </text>
            <text x="60" y="71" text-anchor="middle" font-size="10" fill="#9ca3af">correct</text>
          </svg>
          <p class="text-lg font-bold" [class]="scoreTextClass(accuracyPercent(r))">
            {{ accuracyPercent(r).toFixed(1) }}% accuracy
          </p>
        </div>

        <!-- Quick stats -->
        <div class="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div class="grid grid-cols-4 gap-1 text-center">
            <div class="py-2">
              <div class="text-lg">✅</div>
              <div class="text-base font-bold text-gray-800">{{ r.correctCount }}</div>
              <div class="text-xs text-gray-400">Correct</div>
            </div>
            <div class="py-2">
              <div class="text-lg">❌</div>
              <div class="text-base font-bold text-gray-800">{{ r.incorrectCount }}</div>
              <div class="text-xs text-gray-400">Wrong</div>
            </div>
            <div class="py-2">
              <div class="text-lg">⏭</div>
              <div class="text-base font-bold text-gray-800">{{ r.skippedCount }}</div>
              <div class="text-xs text-gray-400">Skipped</div>
            </div>
            <div class="py-2">
              <div class="text-lg">⏱</div>
              <div class="text-base font-bold text-gray-800">{{ formatTime(r.timeTakenSeconds) }}</div>
              <div class="text-xs text-gray-400">Time</div>
            </div>
          </div>
        </div>

        <!-- Per-question breakdown -->
        <div class="px-4 mt-4 space-y-2">
          @for (q of r.questions; track q.questionId) {
            <div
              class="bg-white rounded-2xl border-2 overflow-hidden"
              [class]="questionBorderClass(q)"
            >
              <!-- Summary row (tappable) -->
              <button
                class="w-full text-left px-4 py-3"
                (click)="toggleExpanded(q)"
              >
                <div class="flex items-start gap-2">
                  <div class="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                    <span class="text-xs font-bold text-gray-400">Q{{ q.displayOrder }}</span>
                    @if (q.isCorrect === true) {
                      <span class="text-green-500 text-sm font-bold">✓</span>
                    } @else if (q.isCorrect === false) {
                      <span class="text-red-500 text-sm font-bold">✗</span>
                    } @else {
                      <span class="text-gray-300 text-sm font-bold">–</span>
                    }
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm text-gray-700 line-clamp-2">
                      {{ q.questionText.length > 100 ? q.questionText.slice(0, 100) + '…' : q.questionText }}
                    </p>
                    <div class="flex gap-3 mt-1 text-xs">
                      @if (q.selectedOption) {
                        <span [class]="q.isCorrect ? 'text-green-600 font-medium' : 'text-red-500 font-medium'">
                          Your answer: {{ q.selectedOption }}
                        </span>
                      } @else {
                        <span class="text-gray-400 italic">Skipped</span>
                      }
                      <span class="text-gray-400">Correct: {{ q.correctOption }}</span>
                    </div>
                  </div>
                  <span class="text-gray-300 text-xs flex-shrink-0 pt-1">
                    {{ expandedQuestions().has(q.questionId) ? '▲' : '▼' }}
                  </span>
                </div>
              </button>

              <!-- Expanded detail -->
              @if (expandedQuestions().has(q.questionId)) {
                <div class="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
                  <!-- Question images -->
                  @if (q.hasMedia) {
                    @if (questionMediaFor(q.questionId).length) {
                      <div class="space-y-2 mb-1">
                        @for (m of questionMediaFor(q.questionId); track m.id) {
                          <figure class="rounded-xl overflow-hidden bg-gray-200">
                            <img
                              [src]="m.blobUrl"
                              [alt]="m.description ?? 'Question image'"
                              class="w-full object-contain max-h-56"
                            />
                            @if (m.description) {
                              <figcaption class="text-xs text-gray-500 px-3 py-1.5 italic">{{ m.description }}</figcaption>
                            }
                          </figure>
                        }
                      </div>
                    } @else {
                      <div class="rounded-xl bg-gray-200 h-8 animate-pulse"></div>
                    }
                  }
                  <p class="text-sm text-gray-800 font-medium leading-relaxed">{{ q.questionText }}</p>
                  <div class="space-y-1.5">
                    @for (opt of OPTIONS; track opt) {
                      <div
                        class="text-sm px-3 py-2 rounded-xl border"
                        [class]="expandedOptionClass(q, opt)"
                      >
                        <span class="font-bold">{{ opt }}.</span> {{ getOptionText(q, opt) }}
                      </div>
                    }
                  </div>
                  @if (q.explanation) {
                    <div class="mt-3 pt-3 border-t border-gray-200">
                      <p class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Explanation</p>
                      <p class="text-sm text-gray-700 leading-relaxed">{{ q.explanation }}</p>
                      <!-- Quick-access to AI Tutor and Notes -->
                      <div class="flex gap-2 mt-3">
                        <button
                          class="flex-1 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
                          (click)="openExplainSheet(q, 'ai-tutor'); $event.stopPropagation()"
                        >🤖 AI Tutor</button>
                        <button
                          class="flex-1 py-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold hover:bg-gray-100 active:bg-gray-200 transition-colors"
                          (click)="openExplainSheet(q, 'notes'); $event.stopPropagation()"
                        >📝 My Notes</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Actions -->
        <div class="px-4 mt-4 pb-6 space-y-3">
          @if (r.incorrectCount > 0) {
            <button
              class="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all shadow-sm"
              [class]="isRetaking() ? 'bg-orange-400 text-white cursor-wait' : 'bg-orange-500 text-white active:bg-orange-600'"
              [disabled]="isRetaking()"
              (click)="retakeIncorrect(r.mockSessionId)"
            >
              @if (isRetaking()) { Starting… } @else { 🔁 Retake Incorrect ({{ r.incorrectCount }}) }
            </button>
          }
          <button
            routerLink="/stats"
            class="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100"
          >📊 View Full Stats</button>
          <button
            routerLink="/dashboard"
            class="w-full py-3.5 rounded-2xl border-2 border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 active:bg-gray-100"
          >← Back to Dashboard</button>
        </div>

      }

      <!-- Explanation / AI Tutor / Notes sheet for selected question -->
      @if (explainQuestion()) {
        <app-explanation-tabs
          [explanation]="explainQuestion()!.explanation"
          [questionId]="explainQuestion()!.questionId"
          [explanationMedia]="explanationMediaFor(explainQuestion()!.questionId)"
          [initialTab]="explainTab()"
          (dismissed)="explainQuestion.set(null)"
        />
      }

    </div>
  `,
})
export default class MockResultsPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(QuestionService);

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;
  protected readonly ringCircumference = RING_CIRCUMFERENCE;

  protected results = signal<MockResultsResponse | null>(null);
  protected isLoading = signal(true);
  protected error = signal<string | null>(null);
  protected isRetaking = signal(false);
  protected expandedQuestions = signal<Set<string>>(new Set());
  protected explainQuestion = signal<MockResultQuestionDto | null>(null);
  protected explainTab = signal<'explanation' | 'ai-tutor' | 'notes'>('explanation');
  // Media cache: questionId → {question: MediaDto[], explanation: MediaDto[]}
  protected mediaCache = signal<Record<string, { question: MediaDto[]; explanation: MediaDto[] }>>({});

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.service.getMockResults(id).subscribe({
      next: (res) => { this.results.set(res); this.isLoading.set(false); },
      error: () => {
        this.error.set('Results not available yet. The mock may not have been completed.');
        this.isLoading.set(false);
      },
    });
  }

  protected accuracyPercent(r: MockResultsResponse): number {
    if (!r.totalQuestions) return 0;
    return (r.correctCount / r.totalQuestions) * 100;
  }

  protected ringColor(score: number): string {
    if (score >= 70) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  }

  protected ringOffset(score: number): number {
    return RING_CIRCUMFERENCE * (1 - score / 100);
  }

  protected scoreTextClass(score: number): string {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }

  protected questionBorderClass(q: MockResultQuestionDto): string {
    if (q.isCorrect === true) return 'border-green-200';
    if (q.isCorrect === false) return 'border-red-200';
    return 'border-gray-200';
  }

  protected expandedOptionClass(q: MockResultQuestionDto, opt: string): string {
    if (opt === q.correctOption) return 'bg-green-50 border-green-200 text-green-800';
    if (opt === q.selectedOption && opt !== q.correctOption) return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-white border-gray-100 text-gray-600';
  }

  protected getOptionText(q: MockResultQuestionDto, opt: string): string {
    return (q as any)[`option${opt}`] ?? '';
  }

  protected toggleExpanded(q: MockResultQuestionDto): void {
    const questionId = q.questionId;
    this.expandedQuestions.update(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) { next.delete(questionId); return next; }
      next.add(questionId);
      return next;
    });
    // Load media on first expand (if not already cached)
    if (q.hasMedia && !this.mediaCache()[questionId]) {
      this.service.getQuestionMediaOnly(questionId).subscribe({
        next: (res) => {
          this.mediaCache.update(cache => ({
            ...cache,
            [questionId]: {
              question: res.data.filter(m => !m.isExplanation),
              explanation: res.data.filter(m => m.isExplanation),
            },
          }));
        },
      });
    }
  }

  protected questionMediaFor(questionId: string): MediaDto[] {
    return this.mediaCache()[questionId]?.question ?? [];
  }

  protected explanationMediaFor(questionId: string): MediaDto[] {
    return this.mediaCache()[questionId]?.explanation ?? [];
  }

  protected openExplainSheet(
    q: MockResultQuestionDto,
    tab: 'explanation' | 'ai-tutor' | 'notes',
  ): void {
    this.explainTab.set(tab);
    this.explainQuestion.set(q);
  }

  protected retakeIncorrect(mockSessionId: string): void {
    if (this.isRetaking()) return;
    this.isRetaking.set(true);
    this.service.retakeIncorrect(mockSessionId).subscribe({
      next: (res) => this.router.navigate(['/mock', res.mockSessionId]),
      error: () => this.isRetaking.set(false),
    });
  }

  protected formatTime = formatTime;
}
