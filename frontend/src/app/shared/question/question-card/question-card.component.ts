import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  effect,
  untracked,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
} from '@angular/core';
import { Observable } from 'rxjs';
import gsap from 'gsap';
import {
  QuestionWithoutAnswersDto,
  QuestionDetailDto,
  AnswerResult,
  MediaDto,
} from '../../../questions/question.models';
import { QuestionService } from '../../../questions/question.service';
import { ExplanationTabsComponent } from '../explanation-tabs/explanation-tabs.component';
import { BookmarkButtonComponent } from '../bookmark-button/bookmark-button.component';

type CardState = 'idle' | 'selected' | 'submitting' | 'revealed' | 'completed';

@Component({
  selector: 'app-question-card',
  imports: [ExplanationTabsComponent, BookmarkButtonComponent],
  template: `
    <div
      class="flex flex-col h-full bg-white"
      (touchstart)="onTouchStart($event)"
      (touchend)="onTouchEnd($event)"
      (dblclick)="onDoubleTap()"
    >
      <!-- Top bar -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div class="flex items-center gap-3">
          @if (mode() !== 'mock') {
            <button
              class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200"
              (click)="skipped.emit()"
              aria-label="Skip"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
          }
          <span class="text-sm font-semibold text-gray-600">
            Q{{ questionIndex() + 1 }} / {{ totalQuestions() }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          @if (question().subjectName) {
            <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
              {{ question().subjectName }}
            </span>
          }
          <!-- QA flag button — subtle in card, removable (QA feature) -->
          <button
            class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            [class.text-orange-400]="isReported()"
            [class.text-gray-300]="!isReported()"
            (click)="reportTap.emit()"
            aria-label="Report issue"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 01.707 1.707L13.414 9l3.293 3.293A1 1 0 0116 14H4a1 1 0 01-1-1V5zm0 0" clip-rule="evenodd"/>
              <path d="M3 5v9"/>
            </svg>
          </button>
          <app-bookmark-button
            [questionId]="question().id"
            (bookmarkToggled)="bookmarkToggled.emit($event)"
          />
        </div>
      </div>

      <!-- Scrollable area: media + question text -->
      <div class="flex-1 overflow-y-auto px-4 pt-4 pb-2">

        <!-- Question images (shown BEFORE answering) -->
        @if (questionMedia().length) {
          <div class="space-y-2 mb-4">
            @for (m of questionMedia(); track m.id) {
              @if (isHttpUrl(m.blobUrl)) {
                <figure class="rounded-xl overflow-hidden bg-gray-100">
                  <img
                    [src]="m.blobUrl"
                    [alt]="m.description ?? 'Question image'"
                    class="w-full object-contain max-h-52"
                    (error)="onImgError($event)"
                  />
                  @if (m.description) {
                    <figcaption class="text-xs text-gray-500 px-3 py-1.5 italic">{{ m.description }}</figcaption>
                  }
                </figure>
              } @else {
                <div class="rounded-xl bg-slate-100 border border-slate-200 px-3 py-2.5 flex items-center gap-2 text-sm text-slate-600">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  <span class="italic">{{ m.description ?? ('Figure, page ' + m.pageNumber) }}</span>
                </div>
              }
            }
          </div>
        } @else if (question().hasMedia && loadingMedia()) {
          <div class="rounded-xl bg-gray-100 animate-pulse h-36 mb-4"></div>
        }

        <!-- Question text -->
        <p class="text-base font-medium text-gray-900 leading-relaxed">
          {{ question().questionText }}
        </p>
      </div>

      <!-- Options -->
      <div class="px-4 space-y-2.5 pb-2 flex-shrink-0">
        @for (opt of OPTIONS; track opt) {
          <button
            #optionBtn
            class="w-full text-left px-4 py-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 font-medium text-sm"
            [class]="optionClass(opt)"
            [disabled]="cardState() === 'submitting' || cardState() === 'revealed' || cardState() === 'completed'"
            (click)="selectOption(opt)"
          >
            <span
              class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2"
              [class]="optionKeyClass(opt)"
            >{{ opt }}</span>
            <span class="flex-1">{{ getOptionText(opt) }}</span>

            @if (cardState() === 'revealed' || cardState() === 'completed') {
              @if (opt === result()?.correctOption) {
                <span #checkMark class="text-green-600 text-lg">✓</span>
              } @else if (opt === selectedOption() && opt !== result()?.correctOption) {
                <span class="text-red-500 text-lg">✗</span>
              }
            }
          </button>
        }
      </div>

      <!-- XP toast -->
      @if (showXpToast()) {
        <div #xpToast class="absolute left-1/2 -translate-x-1/2 bottom-28 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg opacity-0 pointer-events-none z-10">
          +XP 🎉
        </div>
      }

      <!-- Submit / Next button (hidden in mock mode — navigation handled by taker page) -->
      @if (mode() !== 'mock') {
        <div class="px-4 pb-6 pt-2 flex-shrink-0">
          <button
            class="w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200"
            [class]="submitBtnClass()"
            [disabled]="cardState() === 'idle' || cardState() === 'submitting' || cardState() === 'completed'"
            (click)="onSubmitOrNext()"
          >
            @if (cardState() === 'submitting') {
              Checking…
            } @else if (cardState() === 'revealed') {
              Next Question →
            } @else if (cardState() === 'completed') {
              Loading next…
            } @else {
              Check Answer
            }
          </button>
        </div>
      }
    </div>

    <!-- Explanation sheet -->
    @if (showExplanation()) {
      <app-explanation-tabs
        [explanation]="result()!.explanation"
        [questionId]="question().id"
        [explanationMedia]="explanationMedia()"
        (dismissed)="showExplanation.set(false)"
      />
    }
  `,
  host: { class: 'block relative h-full' },
})
export class QuestionCardComponent {
  private service = inject(QuestionService);

  readonly question = input.required<QuestionWithoutAnswersDto | QuestionDetailDto>();
  readonly mode = input<'hourly' | 'mock' | 'review'>('hourly');
  readonly questionIndex = input<number>(0);
  readonly totalQuestions = input<number>(1);
  readonly pendingQuestionId = input<string>('');
  readonly initialSelectedOption = input<string | null>(null);

  readonly isReported = input<boolean>(false);

  // When provided (review mode), used instead of the default hourly-questions submit
  readonly reviewSubmitFn = input<((opt: string) => Observable<AnswerResult>) | null>(null);

  readonly answered = output<{ selectedOption: string; result: AnswerResult }>();
  readonly skipped = output<void>();
  readonly bookmarkToggled = output<string>();
  readonly reportTap = output<void>();
  readonly mockAnswered = output<{ questionId: string; selectedOption: string }>();

  @ViewChildren('optionBtn') optionBtns!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('xpToast') xpToastRef?: ElementRef<HTMLElement>;

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;

  protected cardState = signal<CardState>('idle');
  protected selectedOption = signal<string | null>(null);
  protected result = signal<AnswerResult | null>(null);
  protected showXpToast = signal(false);
  protected showExplanation = signal(false);
  protected mediaItems = signal<MediaDto[]>([]);
  protected loadingMedia = signal(false);

  protected readonly questionMedia = computed(() => this.mediaItems().filter(m => !m.isExplanation));
  protected readonly explanationMedia = computed(() => this.mediaItems().filter(m => m.isExplanation));

  private touchStartX = 0;

  constructor() {
    // Reset state and reload media whenever the question changes
    effect(() => {
      const pqId = this.pendingQuestionId(); // reactive tracking

      // Kill any in-flight GSAP tweens BEFORE resetting signals.
      // GSAP writes inline styles (borderColor, scale, x) directly on DOM elements.
      // If we don't kill them here, tweens queued from the previous question's
      // runRevealAnimation() will fire on the new question's buttons and leave
      // green borders / scales on options the user never touched.
      untracked(() => {
        this.optionBtns?.forEach(ref => {
          gsap.killTweensOf(ref.nativeElement);
        });
      });

      this.cardState.set('idle');
      this.selectedOption.set(null);
      this.result.set(null);
      this.showExplanation.set(false);
      this.showXpToast.set(false);
      this.mediaItems.set([]);

      // Clear GSAP residual inline styles after Angular has updated the DOM.
      // (setTimeout(0) yields to the event loop so change detection completes first.)
      setTimeout(() => {
        this.optionBtns?.forEach(ref => {
          gsap.set(ref.nativeElement, { clearProps: 'borderColor,scale,x' });
        });
      }, 0);

      // In mock mode: restore the previously selected option when navigating back
      const mode = untracked(() => this.mode());
      const initSel = untracked(() => this.initialSelectedOption());
      if (mode === 'mock' && initSel) {
        this.selectedOption.set(initSel);
        this.cardState.set('selected');
      }

      const q = untracked(() => this.question());
      if (pqId && q?.hasMedia) {
        this.loadingMedia.set(true);
        this.service.getQuestionMediaOnly(q.id).subscribe({
          next: (res) => { this.mediaItems.set(res.data); this.loadingMedia.set(false); },
          error: () => this.loadingMedia.set(false),
        });
      } else {
        this.loadingMedia.set(false);
      }
    });
  }

  protected getOptionText(key: string): string {
    return (this.question() as any)[`option${key}`] ?? '';
  }

  protected optionClass(opt: string): string {
    const state = this.cardState();
    const sel = this.selectedOption();
    const res = this.result();

    if ((state === 'revealed' || state === 'completed') && res) {
      if (opt === res.correctOption) return 'bg-green-50 border-green-500 text-green-800';
      if (opt === sel && opt !== res.correctOption) return 'bg-red-50 border-red-400 text-red-800';
      return 'bg-white border-gray-200 text-gray-500 opacity-60';
    }
    if (opt === sel) return 'bg-indigo-50 border-primary text-gray-900 scale-[1.02]';
    return 'bg-white border-gray-200 text-gray-700 hover:border-gray-300';
  }

  protected optionKeyClass(opt: string): string {
    const state = this.cardState();
    const sel = this.selectedOption();
    const res = this.result();

    if ((state === 'revealed' || state === 'completed') && res) {
      if (opt === res.correctOption) return 'border-green-500 bg-green-500 text-white';
      if (opt === sel) return 'border-red-400 bg-red-400 text-white';
      return 'border-gray-300 text-gray-400';
    }
    if (opt === sel) return 'border-primary bg-primary text-white';
    return 'border-gray-300 text-gray-500';
  }

  protected submitBtnClass(): string {
    const state = this.cardState();
    if (state === 'idle') return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    if (state === 'submitting') return 'bg-primary/70 text-white cursor-wait';
    if (state === 'revealed') return 'bg-gray-900 text-white active:bg-gray-700';
    if (state === 'completed') return 'bg-gray-200 text-gray-400 cursor-not-allowed';
    return 'bg-primary text-white active:bg-primary/90 shadow-md';
  }

  protected selectOption(opt: string): void {
    if (this.cardState() !== 'idle' && this.cardState() !== 'selected') return;
    // Mock mode: tapping the already-selected option deselects it (NEET PG negative marking)
    if (this.mode() === 'mock' && this.selectedOption() === opt) {
      this.selectedOption.set(null);
      this.cardState.set('idle');
      this.mockAnswered.emit({ questionId: this.question().id, selectedOption: '' });
      return;
    }
    this.selectedOption.set(opt);
    this.cardState.set('selected');
    if (this.mode() === 'mock') {
      this.mockAnswered.emit({ questionId: this.question().id, selectedOption: opt });
    }
  }

  protected onSubmitOrNext(): void {
    if (this.mode() === 'mock') return;
    const state = this.cardState();
    if (state === 'selected') {
      this.submit();
    } else if (state === 'revealed') {
      // Mark completed immediately to prevent double-tap
      this.cardState.set('completed');
      this.answered.emit({ selectedOption: this.selectedOption()!, result: this.result()! });
    }
  }

  private submit(): void {
    const sel = this.selectedOption();
    if (!sel) return;
    this.cardState.set('submitting');

    const reviewFn = this.reviewSubmitFn();
    const obs: Observable<AnswerResult> = reviewFn
      ? reviewFn(sel)
      : this.service.submitAnswer(this.pendingQuestionId(), sel);

    obs.subscribe({
      next: (res) => {
        this.result.set(res);
        this.cardState.set('revealed');
        this.runRevealAnimation(res);
      },
      error: () => this.cardState.set('selected'),
    });
  }

  private runRevealAnimation(res: AnswerResult): void {
    const optEls = this.optionBtns.toArray();
    const selectedIdx = this.OPTIONS.indexOf(this.selectedOption() as any);
    const selectedEl = optEls[selectedIdx]?.nativeElement;
    if (!selectedEl) return;

    if (res.isCorrect) {
      gsap.timeline()
        .to(selectedEl, { scale: 1.05, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 })
        .call(() => this.glowCorrect(res.correctOption))
        .call(() => this.showXpFloat(), [], '+=0.1');
    } else {
      gsap.to(selectedEl, {
        keyframes: { x: [-5, 5, -5, 5, 0] },
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => this.glowCorrect(res.correctOption),
      });
    }

    setTimeout(() => this.showExplanation.set(true), 400);
  }

  private glowCorrect(correctOption: string): void {
    const idx = this.OPTIONS.indexOf(correctOption as any);
    const el = this.optionBtns.toArray()[idx]?.nativeElement;
    if (el) gsap.to(el, { borderColor: '#22C55E', duration: 0.3 });
  }

  private showXpFloat(): void {
    this.showXpToast.set(true);
    setTimeout(() => {
      const toast = this.xpToastRef?.nativeElement;
      if (toast) {
        gsap.timeline()
          .to(toast, { opacity: 1, y: -20, duration: 0.3 })
          .to(toast, { opacity: 0, y: -40, duration: 0.3, delay: 0.8 })
          .call(() => this.showXpToast.set(false));
      }
    });
  }

  protected isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }

  protected onImgError(e: Event): void {
    (e.target as HTMLElement).style.display = 'none';
  }

  protected onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
  }

  protected onTouchEnd(e: TouchEvent): void {
    const delta = e.changedTouches[0].clientX - this.touchStartX;
    if (delta < -80) this.skipped.emit();
  }

  protected onDoubleTap(): void {
    this.bookmarkToggled.emit(this.question().id);
  }
}
