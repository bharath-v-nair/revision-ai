import { Component, inject, signal, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import gsap from 'gsap';
import { AchievementDto } from '../../dashboard/dashboard.models';

const TYPE_EMOJI: Record<string, string> = {
  StreakMilestone: '🔥',
  AccuracyMilestone: '🎯',
  QuestionCount: '📚',
  MockCompletion: '🏆',
  SpeedDemon: '⚡',
};

@Component({
  selector: 'app-achievements',
  imports: [DatePipe],
  template: `
    <div class="flex flex-col min-h-full bg-gray-50">

      <!-- Header -->
      <div class="bg-white px-4 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3">
        <h1 class="text-xl font-bold text-gray-900">Achievements</h1>
        @if (loaded()) {
          <span class="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
            {{ unlockedCount() }} / {{ achievements().length }}
          </span>
        }
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-4 py-4">

        @if (!loaded()) {
          <!-- Skeleton -->
          <div class="grid grid-cols-2 gap-3">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="bg-white rounded-2xl p-4 border border-gray-100 h-36 animate-pulse"></div>
            }
          </div>
        } @else if (achievements().length === 0) {
          <div class="flex flex-col items-center justify-center py-20 text-center">
            <p class="text-5xl mb-3">🏆</p>
            <p class="text-gray-500 text-sm">No achievements yet. Keep studying!</p>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            @for (a of achievements(); track a.id) {
              <button
                class="bg-white rounded-2xl p-4 border border-gray-100 text-left flex flex-col gap-2 active:scale-[0.97] transition-transform relative overflow-hidden"
                [class.shadow-md]="a.isUnlocked"
                [class.opacity-60]="!a.isUnlocked"
                (click)="openDetail(a)"
              >
                <!-- Icon -->
                <div
                  class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  [class.bg-amber-100]="a.isUnlocked"
                  [class.bg-gray-100]="!a.isUnlocked"
                  [class.grayscale]="!a.isUnlocked"
                >
                  {{ typeEmoji(a.type) }}
                </div>

                <div class="flex-1">
                  <p class="text-xs font-bold text-gray-800 leading-tight line-clamp-2">{{ a.name }}</p>
                  @if (a.isUnlocked) {
                    <p class="text-xs text-green-600 mt-0.5">Unlocked {{ a.unlockedAt | date:'MMM d' }}</p>
                  } @else {
                    <div class="mt-1.5">
                      <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          class="h-full bg-primary rounded-full"
                          [style.width]="a.progressPercent + '%'"
                        ></div>
                      </div>
                      <p class="text-xs text-gray-400 mt-0.5">{{ a.progressPercent }}%</p>
                    </div>
                  }
                </div>

                <!-- Checkmark badge -->
                @if (a.isUnlocked) {
                  <span class="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
                    </svg>
                  </span>
                } @else {
                  <span class="absolute top-2 right-2 text-gray-300 text-sm">🔒</span>
                }
              </button>
            }
          </div>
        }
      </div>

      <!-- Detail sheet -->
      @if (selectedAchievement()) {
        <div
          class="fixed inset-0 z-40 bg-black/40"
          (click)="closeDetail()"
        ></div>
        <div
          #detailSheet
          class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 translate-y-full"
        >
          <div class="bg-white rounded-t-3xl shadow-2xl px-6 pt-6 pb-10">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center text-4xl flex-shrink-0"
                [class.grayscale]="!selectedAchievement()!.isUnlocked"
                [class.bg-gray-100]="!selectedAchievement()!.isUnlocked"
              >
                {{ typeEmoji(selectedAchievement()!.type) }}
              </div>
              <div class="flex-1">
                <h2 class="text-lg font-black text-gray-900">{{ selectedAchievement()!.name }}</h2>
                <p class="text-sm text-gray-500 mt-1">{{ selectedAchievement()!.description }}</p>
              </div>
            </div>

            @if (selectedAchievement()!.isUnlocked) {
              <div class="bg-green-50 rounded-xl px-4 py-3 flex items-center gap-2">
                <span class="text-green-600">✅</span>
                <p class="text-sm font-semibold text-green-700">
                  Unlocked on {{ selectedAchievement()!.unlockedAt | date:'MMMM d, y' }}
                </p>
              </div>
            } @else {
              <div class="bg-gray-50 rounded-xl px-4 py-3">
                <div class="flex justify-between mb-1">
                  <span class="text-xs font-semibold text-gray-500">Progress</span>
                  <span class="text-xs font-bold text-primary">{{ selectedAchievement()!.progressPercent }}%</span>
                </div>
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary rounded-full"
                    [style.width]="selectedAchievement()!.progressPercent + '%'"
                  ></div>
                </div>
                <p class="text-xs text-gray-400 mt-1">{{ selectedAchievement()!.progressPercent }}% complete</p>
              </div>
            }

            @if (loadingDetail()) {
              <p class="text-center text-xs text-gray-400 mt-4">Loading details…</p>
            }

            <button
              class="mt-5 w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-2xl text-sm"
              (click)="closeDetail()"
            >
              Close
            </button>
          </div>
        </div>
      }

    </div>
  `,
})
export default class AchievementsPage implements OnInit {
  private http = inject(HttpClient);

  protected achievements = signal<AchievementDto[]>([]);
  protected loaded = signal(false);
  protected selectedAchievement = signal<AchievementDto | null>(null);
  protected loadingDetail = signal(false);

  protected unlockedCount = () => this.achievements().filter((a) => a.isUnlocked).length;

  @ViewChild('detailSheet') detailSheetRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {
    this.http.get<AchievementDto[]>('/api/achievements').subscribe({
      next: (list) => {
        this.achievements.set(list);
        this.loaded.set(true);
      },
      error: () => this.loaded.set(true),
    });
  }

  protected typeEmoji(type: string): string {
    return TYPE_EMOJI[type] ?? '🎖';
  }

  protected openDetail(a: AchievementDto): void {
    this.selectedAchievement.set(a);
    this.loadingDetail.set(false);
    setTimeout(() => {
      const el = this.detailSheetRef?.nativeElement;
      if (el) gsap.fromTo(el, { y: '100%' }, { y: '0%', duration: 0.35, ease: 'power3.out' });
    }, 0);

    // Only fetch detail from API for unlocked achievements (they have a real Guid ID)
    const emptyGuid = '00000000-0000-0000-0000-000000000000';
    if (a.isUnlocked && a.id && a.id !== emptyGuid) {
      this.loadingDetail.set(true);
      this.http.get<AchievementDto>(`/api/achievements/${a.id}`).subscribe({
        next: (detail) => {
          this.selectedAchievement.set(detail);
          this.loadingDetail.set(false);
        },
        error: () => this.loadingDetail.set(false),
      });
    }
  }

  protected closeDetail(): void {
    const el = this.detailSheetRef?.nativeElement;
    if (el) {
      gsap.to(el, {
        y: '100%',
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => this.selectedAchievement.set(null),
      });
    } else {
      this.selectedAchievement.set(null);
    }
  }
}
