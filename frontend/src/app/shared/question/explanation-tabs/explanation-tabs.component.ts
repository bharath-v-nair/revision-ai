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
import { MediaDto, NoteDto } from '../../../questions/question.models';

@Component({
  selector: 'app-explanation-tabs',
  imports: [],
  template: `
    <!-- Backdrop — z-[51] so it sits above the detail sheet (z-50), making clicks register correctly -->
    <div
      class="fixed inset-0 bg-black/30 z-[51]"
      (click)="dismiss()"
    ></div>

    <!-- Sheet -->
    <div
      #sheet
      class="fixed bottom-0 left-0 right-0 z-[52] bg-white rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      <!-- Drag handle -->
      <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
        <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
      </div>

      <!-- Tab bar -->
      <div class="flex items-center border-b border-gray-100 px-4 flex-shrink-0">
        @for (tab of tabs; track tab.id) {
          <button
            class="py-3 px-4 text-sm font-medium border-b-2 transition-colors"
            [class.border-primary]="activeTab() === tab.id"
            [class.text-primary]="activeTab() === tab.id"
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-gray-500]="activeTab() !== tab.id"
            (click)="activeTab.set(tab.id)"
          >{{ tab.label }}</button>
        }
        <!-- Close button -->
        <button
          class="ml-auto p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          (click)="dismiss()"
          aria-label="Close"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-4">

        <!-- ── EXPLANATION ── -->
        @if (activeTab() === 'explanation') {
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

        <!-- ── AI TUTOR ── -->
        } @else if (activeTab() === 'ai-tutor') {
          <div class="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <span class="text-4xl">🤖</span>
            <p class="text-gray-500 text-sm">AI Tutor available with Pro subscription</p>
          </div>

        <!-- ── MY NOTES ── -->
        } @else if (activeTab() === 'notes') {
          <!-- Upload button -->
          <div class="mb-4">
            <input
              #fileInput
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              class="hidden"
              (change)="onFileSelected($event)"
            />
            <button
              class="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium flex items-center justify-center gap-2"
              [disabled]="uploadingNote()"
              (click)="fileInput.click()"
            >
              @if (uploadingNote()) {
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Uploading…
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
                Upload Note (image or PDF, up to 20 MB)
              }
            </button>

            <!-- Preview before upload (image only) -->
            @if (previewUrl()) {
              <div class="mt-3 bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                @if (pendingIsPdf()) {
                  <div class="w-14 h-14 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                    <span class="text-2xl">📄</span>
                  </div>
                } @else {
                  <img [src]="previewUrl()!" class="w-14 h-14 object-cover rounded-lg flex-shrink-0" alt="Preview"/>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-gray-600 truncate">{{ pendingFile()?.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatFileSize(pendingFile()?.size ?? 0) }}</p>
                </div>
                <button class="text-gray-400 hover:text-gray-600 p-1" (click)="clearPending()">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            }

            @if (uploadError()) {
              <p class="mt-2 text-xs text-red-500">{{ uploadError() }}</p>
            }
          </div>

          <!-- Notes list -->
          @if (loadingNotes()) {
            <p class="text-sm text-gray-400 text-center py-8">Loading notes…</p>
          } @else if (notes().length) {
            <div class="space-y-3">
              @for (note of notes(); track note.id) {
                <div class="relative overflow-hidden rounded-xl">
                  <!-- Note content -->
                  <div
                    class="bg-gray-50 rounded-xl p-3 flex items-start gap-3 transition-transform duration-200"
                    [style.transform]="revealedNoteId() === note.id ? 'translateX(-72px)' : 'translateX(0)'"
                    (touchstart)="onNoteTouchStart($event, note.id)"
                    (touchmove)="onNoteTouchMove($event)"
                    (touchend)="onNoteTouchEnd($event, note.id)"
                  >
                    <!-- Thumbnail / PDF icon -->
                    <button
                      class="flex-shrink-0"
                      (click)="openNote(note)"
                    >
                      @if (isPdf(note)) {
                        <div class="w-14 h-14 rounded-lg bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-0.5">
                          <span class="text-xl leading-none">📄</span>
                          <span class="text-[9px] font-bold text-red-500 uppercase tracking-wide">PDF</span>
                        </div>
                      } @else {
                        <img
                          [src]="note.blobUrl"
                          class="w-14 h-14 object-cover rounded-lg bg-gray-200"
                          alt="Note thumbnail"
                        />
                      }
                    </button>
                    <div class="flex-1 min-w-0">
                      <span class="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                            [class]="isPdf(note) ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'">
                        {{ isPdf(note) ? 'PDF' : (note.noteType || 'Note') }}
                      </span>
                      <p class="text-xs text-gray-400 mt-1">{{ formatDate(note.createdAt) }}</p>
                    </div>
                  </div>
                  <!-- Delete button (revealed on swipe) -->
                  <button
                    class="absolute right-0 top-0 bottom-0 w-[72px] bg-red-500 text-white text-xs font-medium rounded-r-xl flex items-center justify-center"
                    (click)="deleteNote(note.id)"
                  >Delete</button>
                </div>
              }
            </div>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <span class="text-3xl">📝</span>
              <p class="text-gray-500 text-sm">No notes for this question or chapter yet — visit My Notes to upload study material.</p>
            </div>
          }
        }

      </div>
    </div>

    <!-- Full-screen image viewer (images only; PDFs open in new tab via openNote) -->
    @if (viewerNote()) {
      <div
        class="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center"
        (click)="viewerNote.set(null)"
      >
        <img
          [src]="viewerNote()!.blobUrl"
          class="max-w-full max-h-full object-contain"
          alt="Note full view"
          (click)="$event.stopPropagation()"
        />
        <button
          class="absolute top-4 right-4 p-2 text-white/70 hover:text-white"
          (click)="viewerNote.set(null)"
        >
          <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    }
  `,
})
export class ExplanationTabsComponent implements AfterViewInit, OnDestroy {
  private service = inject(QuestionService);

  readonly explanation = input.required<string>();
  readonly questionId = input.required<string>();
  readonly explanationMedia = input<MediaDto[]>([]);
  readonly initialTab = input<'explanation' | 'ai-tutor' | 'notes'>('explanation');
  readonly dismissed = output<void>();

  @ViewChild('sheet') sheetRef!: ElementRef<HTMLElement>;

  protected activeTab = signal<'explanation' | 'ai-tutor' | 'notes'>('explanation');
  protected notes = signal<NoteDto[]>([]);
  protected loadingNotes = signal(false);

  protected uploadingNote = signal(false);
  protected pendingFile = signal<File | null>(null);
  protected pendingIsPdf = signal(false);
  protected previewUrl = signal<string | null>(null);
  protected uploadError = signal<string | null>(null);
  protected viewerNote = signal<NoteDto | null>(null);
  protected revealedNoteId = signal<string | null>(null);

  protected tabs = [
    { id: 'explanation' as const, label: 'Explanation' },
    { id: 'ai-tutor' as const, label: 'AI Tutor' },
    { id: 'notes' as const, label: 'My Notes' },
  ];

  private touchStartY = 0;
  private currentY = 0;
  private noteTouchStartX = 0;
  private noteTouchStartY = 0;
  private noteGestureDirection: 'horizontal' | 'vertical' | null = null;

  ngAfterViewInit(): void {
    // Honour the initialTab input
    this.activeTab.set(this.initialTab());

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
      next: (notes) => { this.notes.set(notes); this.loadingNotes.set(false); },
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

  // Note swipe-to-delete gesture
  protected onNoteTouchStart(e: TouchEvent, _noteId: string): void {
    this.noteTouchStartX = e.touches[0].clientX;
    this.noteTouchStartY = e.touches[0].clientY;
    this.noteGestureDirection = null;
    e.stopPropagation();
  }

  protected onNoteTouchMove(e: TouchEvent): void {
    e.stopPropagation();
    const dx = e.touches[0].clientX - this.noteTouchStartX;
    const dy = e.touches[0].clientY - this.noteTouchStartY;
    if (!this.noteGestureDirection) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        this.noteGestureDirection = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical';
      }
    }
  }

  protected onNoteTouchEnd(e: TouchEvent, noteId: string): void {
    e.stopPropagation();
    if (this.noteGestureDirection === 'horizontal') {
      const dx = e.changedTouches[0].clientX - this.noteTouchStartX;
      if (dx < -50) {
        this.revealedNoteId.set(noteId);
      } else if (dx > 30) {
        this.revealedNoteId.set(null);
      }
    }
    this.noteGestureDirection = null;
  }

  protected deleteNote(id: string): void {
    this.service.deleteNote(id).subscribe({
      next: () => {
        this.notes.update(ns => ns.filter(n => n.id !== id));
        this.revealedNoteId.set(null);
      },
    });
  }

  /** Open a note — PDFs go to a new browser tab, images go to the full-screen viewer */
  protected openNote(note: NoteDto): void {
    if (this.isPdf(note)) {
      window.open(note.blobUrl, '_blank', 'noopener,noreferrer');
    } else {
      this.viewerNote.set(note);
    }
  }

  protected isPdf(note: NoteDto): boolean {
    return (
      note.noteType === 'PDF' ||
      note.blobUrl.toLowerCase().endsWith('.pdf')
    );
  }

  protected onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError.set(null);
    const isPdf = file.type === 'application/pdf';

    if (file.size > 20 * 1024 * 1024) {
      this.uploadError.set('File exceeds the 20 MB limit.');
      input.value = '';
      return;
    }

    this.pendingFile.set(file);
    this.pendingIsPdf.set(isPdf);

    if (isPdf) {
      // Show a sentinel so the template uses the PDF icon card
      this.previewUrl.set('pdf');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => this.previewUrl.set(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    const noteType = isPdf ? 'PDF' : 'Digital';
    this.uploadingNote.set(true);
    this.service.uploadNote(this.questionId(), file, noteType).subscribe({
      next: (note) => {
        this.notes.update(ns => [note, ...ns]);
        this.uploadingNote.set(false);
        this.clearPending();
        // Reset file input so the same file can be re-uploaded
        input.value = '';
      },
      error: (err) => {
        const msg =
          err?.error?.errors?.File?.[0] ??
          err?.error?.title ??
          err?.error?.message ??
          'Upload failed. Please try again.';
        this.uploadError.set(msg);
        this.uploadingNote.set(false);
        input.value = '';
      },
    });
  }

  protected clearPending(): void {
    this.pendingFile.set(null);
    this.pendingIsPdf.set(false);
    this.previewUrl.set(null);
    this.uploadError.set(null);
  }

  protected isHttpUrl(url: string): boolean {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  }

  protected formatDate(iso: string): string {
    return new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  }

  protected formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
