import {
  Component,
  input,
  output,
  AfterViewInit,
  ElementRef,
  ViewChild,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import gsap from 'gsap';
import { QuestionService } from '../../../questions/question.service';
import { MediaDto } from '../../../questions/question.models';

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

@Component({
  selector: 'app-explanation-tabs',
  imports: [],
  template: `
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-black/30 z-40"
      (click)="dismiss()"
    ></div>

    <!-- Sheet -->
    <div
      #sheet
      class="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1">
        <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <!-- Tab bar -->
      <div class="flex border-b border-gray-100 px-4">
        @for (tab of tabs; track tab.id) {
          <button
            class="py-3 px-4 text-sm font-medium border-b-2 transition-colors"
            [class.border-primary]="activeTab() === tab.id"
            [class.text-primary]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-gray-500]="activeTab() !== tab.id"
            (click)="activeTab.set(tab.id)"
          >
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-4">
        @if (activeTab() === 'explanation') {
          <!-- Explanation images -->
          @if (explanationMedia().length) {
            <div class="space-y-2 mb-4">
              @for (m of explanationMedia(); track m.id) {
                @if (isHttpUrl(m.blobUrl)) {
                  <figure class="rounded-xl overflow-hidden bg-gray-100">
                    <img
                      [src]="m.blobUrl"
                      [alt]="m.description ?? 'Explanation image'"
                      class="w-full object-contain max-h-52"
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
          }
          <p class="prose text-sm text-gray-700 leading-relaxed">{{ explanation() }}</p>
        } @else if (activeTab() === 'ai-tutor') {
          <div class="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <span class="text-4xl">🤖</span>
            <p class="text-gray-500 text-sm">AI Tutor available with Pro subscription</p>
          </div>
        } @else if (activeTab() === 'notes') {
          @if (loadingNotes()) {
            <p class="text-sm text-gray-400 text-center py-8">Loading notes…</p>
          } @else if (notes().length) {
            <div class="space-y-3">
              @for (note of notes(); track note.id) {
                <div class="bg-gray-50 rounded-xl p-3">
                  <p class="text-sm text-gray-700">{{ note.content }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDate(note.createdAt) }}</p>
                </div>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span class="text-3xl">📝</span>
              <p class="text-gray-500 text-sm">No notes yet. Add notes in Phase 3.5.</p>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class ExplanationTabsComponent implements AfterViewInit, OnDestroy {
  private service = inject(QuestionService);

  readonly explanation = input.required<string>();
  readonly questionId = input.required<string>();
  readonly explanationMedia = input<MediaDto[]>([]);
  readonly dismissed = output<void>();

  @ViewChild('sheet') sheetRef!: ElementRef<HTMLElement>;

  protected activeTab = signal<'explanation' | 'ai-tutor' | 'notes'>('explanation');
  protected notes = signal<Note[]>([]);
  protected loadingNotes = signal(false);

  protected tabs = [
    { id: 'explanation' as const, label: 'Explanation' },
    { id: 'ai-tutor' as const, label: 'AI Tutor' },
    { id: 'notes' as const, label: 'My Notes' },
  ];

  private touchStartY = 0;
  private currentY = 0;

  ngAfterViewInit(): void {
    gsap.from(this.sheetRef.nativeElement, {
      y: '100%',
      duration: 0.3,
      ease: 'power2.out',
    });

    this.loadNotes();
  }

  ngOnDestroy(): void {}

  private loadNotes(): void {
    this.loadingNotes.set(true);
    this.service.getNotes(this.questionId()).subscribe({
      next: (res) => {
        this.notes.set(res.data);
        this.loadingNotes.set(false);
      },
      error: () => this.loadingNotes.set(false),
    });
  }

  protected dismiss(): void {
    gsap.to(this.sheetRef.nativeElement, {
      y: '100%',
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => this.dismissed.emit(),
    });
  }

  protected onTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY;
    this.currentY = 0;
  }

  protected onTouchMove(e: TouchEvent): void {
    this.currentY = e.touches[0].clientY - this.touchStartY;
    if (this.currentY > 0) {
      gsap.set(this.sheetRef.nativeElement, { y: this.currentY });
    }
  }

  protected onTouchEnd(): void {
    if (this.currentY > 120) {
      this.dismiss();
    } else {
      gsap.to(this.sheetRef.nativeElement, { y: 0, duration: 0.2, ease: 'power2.out' });
    }
  }

  protected isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
  }
}
