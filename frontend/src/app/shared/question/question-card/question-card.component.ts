import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
  ViewChildren,
  QueryList,
  HostListener,
} from '@angular/core';
import gsap from 'gsap';
import { QuestionWithoutAnswersDto, QuestionDetailDto, AnswerResult } from '../../../questions/question.models';
import { QuestionService } from '../../../questions/question.service';
import { ExplanationTabsComponent } from '../explanation-tabs/explanation-tabs.component';
import { BookmarkButtonComponent } from '../bookmark-button/bookmark-button.component';

type CardState = 'idle' | 'selected' | 'submitting' | 'revealed';

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
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <button
            class="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200"
            (click)="skipped.emit()"
            aria-label="Back"
          >
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
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
          <app-bookmark-button
            [questionId]="question().id"
            (bookmarkToggled)="bookmarkToggled.emit($event)"
          />
        </div>
      </div>

      <!-- Question text -->
      <div class="flex-1 overflow-y-auto px-4 pt-5 pb-3">
        <p class="text-base font-medium text-gray-900 leading-relaxed">
          {{ question().questionText }}
        </p>
      </div>

      <!-- Options -->
      <div class="px-4 space-y-2.5 pb-3">
        @for (opt of OPTIONS; track opt) {
          <button
            #optionBtn
            class="w-full text-left px-4 py-3.5 rounded-2xl border-2 flex items-center gap-3 transition-all duration-200 font-medium text-sm"
            [class]="optionClass(opt)"
            [disabled]="cardState() === 'submitting' || cardState() === 'revealed'"
            (click)="selectOption(opt)"
          >
            <span
              class="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2"
              [class]="optionKeyClass(opt)"
            >{{ opt }}</span>
            <span class="flex-1">{{ getOptionText(opt) }}</span>

            <!-- Correct/wrong icon after reveal -->
            @if (cardState() === 'revealed') {
              @if (opt === result()?.correctOption) {
                <span #checkMark class="text-green-600 text-lg opacity-0">✓</span>
              } @else if (opt === selectedOption() && opt !== result()?.correctOption) {
                <span class="text-red-500 text-lg">✗</span>
              }
            }
          </button>
        }
      </div>

      <!-- XP toast (appears after correct answer) -->
      @if (showXpToast()) {
        <div #xpToast class="absolute left-1/2 -translate-x-1/2 bottom-32 bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg opacity-0 pointer-events-none">
          +XP 🎉
        </div>
      }

      <!-- Submit / Next button -->
      <div class="px-4 pb-6 pt-2">
        <button
          class="w-full py-4 rounded-2xl font-semibold text-sm transition-all duration-200"
          [class]="submitBtnClass()"
          [disabled]="cardState() === 'idle' || cardState() === 'submitting'"
          (click)="onSubmitOrNext()"
        >
          @if (cardState() === 'submitting') {
            Checking…
          } @else if (cardState() === 'revealed') {
            Next Question →
          } @else {
            Check Answer
          }
        </button>
      </div>
    </div>

    <!-- Explanation sheet -->
    @if (showExplanation()) {
      <app-explanation-tabs
        [explanation]="result()!.explanation"
        [questionId]="question().id"
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

  readonly answered = output<{ selectedOption: string; result: AnswerResult }>();
  readonly skipped = output<void>();
  readonly bookmarkToggled = output<string>();

  @ViewChildren('optionBtn') optionBtns!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('xpToast') xpToastRef?: ElementRef<HTMLElement>;

  protected readonly OPTIONS = ['A', 'B', 'C', 'D'] as const;

  protected cardState = signal<CardState>('idle');
  protected selectedOption = signal<string | null>(null);
  protected result = signal<AnswerResult | null>(null);
  protected showXpToast = signal(false);
  protected showExplanation = signal(false);

  private touchStartX = 0;

  protected getOptionText(key: string): string {
    const q = this.question() as any;
    return q[`option${key}`] ?? '';
  }

  protected optionClass(opt: string): string {
    const state = this.cardState();
    const sel = this.selectedOption();
    const res = this.result();

    if (state === 'revealed' && res) {
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

    if (state === 'revealed' && res) {
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
    return 'bg-primary text-white active:bg-primary/90 shadow-md';
  }

  protected selectOption(opt: string): void {
    if (this.cardState() !== 'idle' && this.cardState() !== 'selected') return;
    this.selectedOption.set(opt);
    this.cardState.set('selected');
  }

  protected onSubmitOrNext(): void {
    const state = this.cardState();

    if (state === 'selected') {
      this.submit();
    } else if (state === 'revealed') {
      this.answered.emit({ selectedOption: this.selectedOption()!, result: this.result()! });
    }
  }

  private submit(): void {
    const sel = this.selectedOption();
    if (!sel) return;

    this.cardState.set('submitting');

    this.service.submitAnswer(this.pendingQuestionId(), sel).subscribe({
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
        .call(() => this.animateCheckmark(res.correctOption))
        .call(() => this.showXpFloat(), [], '+=0.1');
    } else {
      gsap.to(selectedEl, {
        keyframes: { x: [-5, 5, -5, 5, 0] },
        duration: 0.4,
        ease: 'power2.inOut',
        onComplete: () => this.glowCorrect(res.correctOption),
      });
    }

    // Explanation slides up after 400ms
    setTimeout(() => this.showExplanation.set(true), 400);
  }

  private animateCheckmark(correctOption: string): void {
    const idx = this.OPTIONS.indexOf(correctOption as any);
    const el = this.optionBtns.toArray()[idx]?.nativeElement;
    const check = el?.querySelector('[\\#checkMark]') ?? el?.querySelector('span:last-child');
    if (check) {
      gsap.fromTo(check, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3 });
    }
  }

  private glowCorrect(correctOption: string): void {
    const idx = this.OPTIONS.indexOf(correctOption as any);
    const el = this.optionBtns.toArray()[idx]?.nativeElement;
    if (el) {
      gsap.to(el, { borderColor: '#22C55E', duration: 0.3 });
    }
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
