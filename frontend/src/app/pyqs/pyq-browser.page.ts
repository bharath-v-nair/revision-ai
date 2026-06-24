import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PyqService } from './pyq.service';
import { PyqSubjectDto } from './pyq.models';
import { SkeletonLoaderComponent } from '../shared/ui/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-pyq-browser',
  imports: [SkeletonLoaderComponent],
  template: `
    <div class="px-4 py-4 space-y-4">

      <div class="pt-2">
        <h1 class="text-xl font-bold text-gray-800">Previous Year Questions</h1>
        <p class="text-sm text-gray-500">Take a full mock from a real exam paper</p>
      </div>

      @if (isLoading()) {
        <app-skeleton-loader type="card" [lines]="2" />
        <app-skeleton-loader type="card" [lines]="2" />
      } @else if (subjects().length === 0) {
        <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span class="text-5xl">📚</span>
          <h2 class="text-lg font-bold text-gray-800">No PYQ papers yet</h2>
          <p class="text-sm text-gray-500">Previous-year papers will appear here as they're added.</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (subject of subjects(); track subject.subjectId) {
            <button
              class="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
              (click)="openSubject(subject.subjectSlug)"
            >
              <span class="flex-shrink-0 w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl">
                📝
              </span>
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-gray-800 truncate">{{ subject.subjectName }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  {{ subject.totalPapers }} {{ subject.totalPapers === 1 ? 'paper' : 'papers' }}
                  · {{ subject.totalQuestions }} questions
                </p>
              </div>
              <span class="text-gray-300 text-lg">→</span>
            </button>
          }
        </div>
      }

    </div>
  `,
})
export default class PyqBrowserPage implements OnInit {
  private service = inject(PyqService);
  private router = inject(Router);

  protected isLoading = signal(true);
  protected subjects = signal<PyqSubjectDto[]>([]);

  ngOnInit(): void {
    this.service.getSubjects().subscribe({
      next: (res) => {
        this.subjects.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  protected openSubject(slug: string): void {
    this.router.navigate(['/pyqs', slug]);
  }
}
