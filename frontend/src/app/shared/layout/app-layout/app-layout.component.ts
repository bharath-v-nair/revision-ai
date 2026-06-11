import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';
import { BatchAnalysisPopupComponent } from '../../analytics/batch-analysis-popup/batch-analysis-popup.component';
import { XpToastComponent } from '../../gamification/xp-toast/xp-toast.component';
import { AchievementToastComponent } from '../../gamification/achievement-toast/achievement-toast.component';
import { LevelUpOverlayComponent } from '../../gamification/level-up-overlay/level-up-overlay.component';
import { AnalyticsStore } from '../../../store/analytics.store';
import { QuestionStore } from '../../../store/question.store';

const BATCH_COOLDOWN_MS = 2 * 60 * 60 * 1000;

@Component({
  selector: 'app-layout',
  imports: [
    RouterOutlet,
    BottomNavComponent,
    BatchAnalysisPopupComponent,
    XpToastComponent,
    AchievementToastComponent,
    LevelUpOverlayComponent,
  ],
  template: `
    <div class="max-w-[480px] mx-auto min-h-screen bg-surface relative">
      <main class="pb-20 min-h-screen">
        <router-outlet />
      </main>
      <app-bottom-nav />
      @if (analyticsStore.showBatchPopup()) {
        <app-batch-analysis-popup />
      }
      <app-xp-toast />
      <app-achievement-toast />
      <app-level-up-overlay />
    </div>
  `,
})
export class AppLayoutComponent {
  protected analyticsStore = inject(AnalyticsStore);
  private questionStore = inject(QuestionStore);

  constructor() {
    effect(() => {
      const count = this.questionStore.answeredCountSinceLastBatch();
      if (count < 5) return;

      const lastShown = localStorage.getItem('batch_popup_last_shown');
      if (lastShown && Date.now() - parseInt(lastShown, 10) < BATCH_COOLDOWN_MS) {
        this.questionStore.resetBatchCount();
        return;
      }

      const ids = this.questionStore.recentAnsweredIds();
      const subjects = this.questionStore.recentAnsweredSubjectNames();
      this.questionStore.resetBatchCount();
      this.analyticsStore.triggerBatchPopup(ids, subjects);
    });
  }
}
