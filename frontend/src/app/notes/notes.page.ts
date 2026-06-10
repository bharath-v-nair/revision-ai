import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { QuestionService } from '../questions/question.service';
import { NoteDto, SubjectDto, ChapterDto } from '../questions/question.models';

@Component({
  selector: 'app-notes',
  imports: [],
  template: `
    <div class="flex flex-col h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button
          class="p-1.5 -ml-1 rounded-full text-gray-500 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          (click)="goBack()"
          aria-label="Back"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-lg font-bold text-gray-900 flex-1 ml-2">My Notes</h1>
        <button
          class="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
          (click)="openUploadSheet()"
          aria-label="Upload note"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
        </button>
      </div>

      <!-- Subject filter chips -->
      @if (subjects().length > 0) {
        <div class="bg-white border-b border-gray-100 flex-shrink-0">
          <div class="flex gap-2 overflow-x-auto px-4 py-2.5 scrollbar-hide">
            <button
              class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              [class]="selectedSubjectId() === null
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
              (click)="selectSubject(null)"
            >All</button>
            @for (subject of subjects(); track subject.id) {
              <button
                class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                [class]="selectedSubjectId() === subject.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                (click)="selectSubject(subject.id)"
              >{{ subject.name }}</button>
            }
          </div>

          <!-- Chapter sub-chips (shown when subject selected) -->
          @if (selectedSubjectId() !== null && chapters().length > 0) {
            <div class="flex gap-2 overflow-x-auto px-4 pb-2.5 scrollbar-hide">
              <button
                class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                [class]="selectedChapterId() === null
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'"
                (click)="selectChapter(null)"
              >All chapters</button>
              @for (chapter of chapters(); track chapter.id) {
                <button
                  class="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                  [class]="selectedChapterId() === chapter.id
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'"
                  (click)="selectChapter(chapter.id)"
                >Ch {{ chapter.chapterNumber }}</button>
              }
            </div>
          }
        </div>
      }

      <!-- Notes list -->
      <div class="flex-1 overflow-y-auto px-4 py-4">
        @if (isLoading()) {
          <div class="flex items-center justify-center py-20">
            <svg class="w-6 h-6 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
          </div>
        } @else if (notes().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span class="text-5xl">📝</span>
            <p class="text-gray-600 font-semibold">No notes yet</p>
            <p class="text-sm text-gray-400">Upload your first study material above</p>
          </div>
        } @else if (filteredNotes().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <span class="text-4xl">🔍</span>
            <p class="text-gray-500 text-sm">No notes for this chapter</p>
          </div>
        } @else {
          <div class="space-y-3">
            @for (note of filteredNotes(); track note.id) {
              <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-start gap-3">

                <!-- Thumbnail -->
                <button
                  class="flex-shrink-0"
                  (click)="openNote(note)"
                >
                  @if (isPdf(note)) {
                    <div class="w-14 h-14 rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-0.5">
                      <span class="text-xl leading-none">📄</span>
                      <span class="text-[9px] font-bold text-red-500 uppercase tracking-wide">PDF</span>
                    </div>
                  } @else {
                    <img
                      [src]="note.blobUrl"
                      class="w-14 h-14 object-cover rounded-xl bg-gray-100"
                      alt="Note thumbnail"
                    />
                  }
                </button>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-700 truncate leading-snug">
                    {{ note.subjectName }} › Ch {{ note.chapterNumber }}. {{ note.chapterTitle }}
                  </p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    @if (note.questionId) {
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">Q-specific</span>
                    }
                    <span class="text-xs text-gray-400">{{ formatDate(note.createdAt) }}</span>
                  </div>
                </div>

                <!-- Delete -->
                <button
                  class="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors"
                  [disabled]="deletingId() === note.id"
                  (click)="deleteNote(note.id)"
                  aria-label="Delete note"
                >
                  @if (deletingId() === note.id) {
                    <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  }
                </button>
              </div>
            }
          </div>
        }
      </div>

    </div>

    <!-- Upload sheet backdrop -->
    @if (uploadSheetOpen()) {
      <div
        class="fixed inset-0 bg-black/40 z-[51]"
        (click)="closeUploadSheet()"
      ></div>

      <!-- Upload sheet -->
      <div
        #uploadSheet
        class="fixed bottom-0 left-0 right-0 z-[52] bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
      >
        <!-- Handle -->
        <div class="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div class="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        <div class="flex items-center px-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 class="text-base font-bold text-gray-900 flex-1">Upload Study Material</h2>
          <button
            class="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            (click)="closeUploadSheet()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          <!-- Step 1: Subject -->
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Subject</p>
            <div class="flex flex-wrap gap-2">
              @for (subject of subjects(); track subject.id) {
                <button
                  class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  [class]="uploadSubjectId() === subject.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                  (click)="selectUploadSubject(subject.id)"
                >{{ subject.name }}</button>
              }
            </div>
          </div>

          <!-- Step 2: Chapter (shown after subject selected) -->
          @if (uploadSubjectId() && uploadChapters().length > 0) {
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Chapter</p>
              <div class="flex flex-wrap gap-2">
                @for (chapter of uploadChapters(); track chapter.id) {
                  <button
                    class="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    [class]="uploadChapterId() === chapter.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
                    (click)="uploadChapterId.set(chapter.id)"
                  >Ch {{ chapter.chapterNumber }}. {{ chapter.title }}</button>
                }
              </div>
            </div>
          }

          <!-- Step 3: File picker (shown after chapter selected) -->
          @if (uploadChapterId()) {
            <div>
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File</p>
              <input
                #uploadFileInput
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                class="hidden"
                (change)="onUploadFileSelected($event)"
              />
              @if (!uploadPendingFile()) {
                <button
                  class="w-full py-8 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors font-medium flex flex-col items-center justify-center gap-2"
                  (click)="uploadFileInput.click()"
                >
                  <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                  </svg>
                  Upload image or PDF (≤20 MB)
                </button>
              } @else {
                <div class="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                  @if (uploadPendingIsPdf()) {
                    <div class="w-12 h-12 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center flex-shrink-0">
                      <span class="text-xl">📄</span>
                    </div>
                  } @else {
                    <img [src]="uploadPreviewUrl()!" class="w-12 h-12 object-cover rounded-lg flex-shrink-0" alt="Preview"/>
                  }
                  <div class="flex-1 min-w-0">
                    <p class="text-xs text-gray-700 font-medium truncate">{{ uploadPendingFile()?.name }}</p>
                    <p class="text-xs text-gray-400">{{ formatFileSize(uploadPendingFile()?.size ?? 0) }}</p>
                  </div>
                  <button class="text-gray-400 hover:text-gray-600 p-1" (click)="clearUploadPending()">
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
          }

        </div>

        <!-- Upload button -->
        @if (uploadChapterId() && uploadPendingFile()) {
          <div class="px-5 pb-6 pt-3 border-t border-gray-100 flex-shrink-0">
            <button
              class="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60"
              [disabled]="isUploading()"
              (click)="submitUpload()"
            >
              @if (isUploading()) {
                <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Uploading…
              } @else {
                Upload Note
              }
            </button>
          </div>
        }

      </div>
    }

    <!-- Full-screen image viewer -->
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
export default class NotesPage implements OnInit {
  private service = inject(QuestionService);
  private router = inject(Router);

  @ViewChild('uploadSheet') uploadSheetRef?: ElementRef<HTMLElement>;

  protected notes = signal<NoteDto[]>([]);
  protected isLoading = signal(false);
  protected subjects = signal<SubjectDto[]>([]);
  protected selectedSubjectId = signal<string | null>(null);
  protected chapters = signal<ChapterDto[]>([]);
  protected selectedChapterId = signal<string | null>(null);
  protected uploadSheetOpen = signal(false);
  protected deletingId = signal<string | null>(null);
  protected viewerNote = signal<NoteDto | null>(null);

  // Upload sheet state
  protected uploadSubjectId = signal<string | null>(null);
  protected uploadChapterId = signal<string | null>(null);
  protected uploadChapters = signal<ChapterDto[]>([]);
  protected uploadPendingFile = signal<File | null>(null);
  protected uploadPendingIsPdf = signal(false);
  protected uploadPreviewUrl = signal<string | null>(null);
  protected uploadError = signal<string | null>(null);
  protected isUploading = signal(false);

  protected filteredNotes = computed(() => {
    const all = this.notes();
    const sid = this.selectedSubjectId();
    const cid = this.selectedChapterId();
    if (cid) return all.filter(n => n.chapterId === cid);
    if (sid) return all.filter(n => n.subjectId === sid);
    return all;
  });

  ngOnInit(): void {
    this.loadNotes();
    this.loadSubjects();
  }

  private loadNotes(): void {
    this.isLoading.set(true);
    this.service.getUserNotes().subscribe({
      next: (notes) => { this.notes.set(notes); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  private loadSubjects(): void {
    this.service.getSubjects().subscribe({
      next: (res) => this.subjects.set(res.data),
      error: () => {},
    });
  }

  protected selectSubject(subjectId: string | null): void {
    this.selectedSubjectId.set(subjectId);
    this.selectedChapterId.set(null);
    this.chapters.set([]);

    if (subjectId) {
      const subject = this.subjects().find(s => s.id === subjectId);
      if (subject) {
        this.service.getChapters(subject.slug).subscribe({
          next: (res) => this.chapters.set(res.data),
          error: () => {},
        });
      }
    }
  }

  protected selectChapter(chapterId: string | null): void {
    this.selectedChapterId.set(chapterId);
  }

  protected openUploadSheet(): void {
    this.uploadSheetOpen.set(true);
    // Animate in after view renders
    setTimeout(() => {
      if (this.uploadSheetRef) {
        gsap.from(this.uploadSheetRef.nativeElement, {
          y: '100%',
          duration: 0.3,
          ease: 'power2.out',
        });
      }
    }, 0);
  }

  protected closeUploadSheet(): void {
    if (this.uploadSheetRef) {
      gsap.to(this.uploadSheetRef.nativeElement, {
        y: '100%',
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => {
          this.uploadSheetOpen.set(false);
          this.resetUploadState();
        },
      });
    } else {
      this.uploadSheetOpen.set(false);
      this.resetUploadState();
    }
  }

  protected selectUploadSubject(subjectId: string): void {
    this.uploadSubjectId.set(subjectId);
    this.uploadChapterId.set(null);
    this.uploadChapters.set([]);
    this.clearUploadPending();

    const subject = this.subjects().find(s => s.id === subjectId);
    if (subject) {
      this.service.getChapters(subject.slug).subscribe({
        next: (res) => this.uploadChapters.set(res.data),
        error: () => {},
      });
    }
  }

  protected onUploadFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError.set(null);

    if (file.size > 20 * 1024 * 1024) {
      this.uploadError.set('File exceeds the 20 MB limit.');
      input.value = '';
      return;
    }

    const isPdf = file.type === 'application/pdf';
    this.uploadPendingFile.set(file);
    this.uploadPendingIsPdf.set(isPdf);

    if (isPdf) {
      this.uploadPreviewUrl.set('pdf');
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => this.uploadPreviewUrl.set(ev.target?.result as string);
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  protected clearUploadPending(): void {
    this.uploadPendingFile.set(null);
    this.uploadPendingIsPdf.set(false);
    this.uploadPreviewUrl.set(null);
    this.uploadError.set(null);
  }

  protected submitUpload(): void {
    const file = this.uploadPendingFile();
    const chapterId = this.uploadChapterId();
    if (!file || !chapterId) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.service.createNoteForChapter(file, chapterId).subscribe({
      next: (note) => {
        this.notes.update(ns => [note, ...ns]);
        this.isUploading.set(false);
        this.closeUploadSheet();
      },
      error: (err) => {
        const msg =
          err?.error?.errors?.File?.[0] ??
          err?.error?.title ??
          err?.error?.message ??
          'Upload failed. Please try again.';
        this.uploadError.set(msg);
        this.isUploading.set(false);
      },
    });
  }

  protected deleteNote(id: string): void {
    this.deletingId.set(id);
    this.service.deleteNote(id).subscribe({
      next: () => {
        this.notes.update(ns => ns.filter(n => n.id !== id));
        this.deletingId.set(null);
      },
      error: () => this.deletingId.set(null),
    });
  }

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

  protected goBack(): void {
    this.router.navigate(['/profile']);
  }

  private resetUploadState(): void {
    this.uploadSubjectId.set(null);
    this.uploadChapterId.set(null);
    this.uploadChapters.set([]);
    this.clearUploadPending();
  }
}
