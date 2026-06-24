import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PyqService } from '../pyq.service';
import { PyqPaperDto } from '../pyq.models';
import { SkeletonLoaderComponent } from '../../shared/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-pyq-paper-list',
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="px-4 py-4 space-y-4">

      <!-- Header -->
      <div class="flex items-center gap-2 pt-2">
        <button
          class="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
          aria-label="Back"
          (click)="goBack()"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-800 capitalize">{{ subjectSlug() }}</h1>
          <p class="text-sm text-gray-500">Exam papers</p>
        </div>
      </div>

      @if (isLoading()) {
        <app-skeleton-loader type="card" [lines]="1" />
        <app-skeleton-loader type="card" [lines]="1" />
      } @else if (papers().length === 0) {
        <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span class="text-5xl">🗂️</span>
          <h2 class="text-lg font-bold text-gray-800">No papers found</h2>
          <p class="text-sm text-gray-500">There are no PYQ papers for this subject yet.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (paper of papers(); track paper.examName) {
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="font-semibold text-gray-800 truncate">{{ paper.examName }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ paper.examType }} · {{ paper.questionCount }} Qs
                </p>
              </div>
              <button
                class="flex-shrink-0 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold active:bg-primary/90 shadow-sm transition-colors"
                (click)="startMock(paper.examName)"
              >Start Mock</button>
            </div>
          }
        </div>
      }

    </div>
  `,
})
export default class PyqPaperListPage implements OnInit {
  private service = inject(PyqService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  protected isLoading = signal(true);
  protected papers = signal<PyqPaperDto[]>([]);
  protected subjectSlug = signal('');

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('subjectSlug') ?? '';
    this.subjectSlug.set(slug);
    this.service.getPapers(slug).subscribe({
      next: (res) => {
        this.papers.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected startMock(examName: string): void {
    // Pass the raw exam name — Angular Router URL-encodes the segment, and
    // paramMap decodes it back on the mock page.
    this.router.navigate(['/pyqs', this.subjectSlug(), examName, 'mock']);
  }

  protected goBack(): void {
    this.router.navigate(['/pyqs']);
  }
}
