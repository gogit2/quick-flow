import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { LearningApi } from '../../core/api/learning-api.service';
import { LearningCardResponse } from '../../core/models/learning';
import { NotificationService } from '../../core/notify/notification.service';
import { confirmDialog } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadStateComponent } from '../../shared/load-state/load-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { LearningCardComponent } from './learning-card.component';
import { LearningFormDialogComponent, LearningFormDialogData } from './learning-form-dialog.component';

@Component({
  selector: 'app-learning-page',
  imports: [PageHeaderComponent, LoadStateComponent, EmptyStateComponent, LearningCardComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header heading="Learning Resources" testid="learning-title">
      <button mat-flat-button type="button" data-testid="learning-add-btn" (click)="openForm(null)">
        <mat-icon>add</mat-icon> Add Learning Card
      </button>
    </app-page-header>

    @if (cards(); as list) {
      @if (list.length) {
        <div class="card-grid" data-testid="learning-list">
          @for (c of list; track c.id) {
            <app-learning-card [card]="c" (changed)="replace($event)" (edit)="openForm(c)" (remove)="remove(c)" />
          }
        </div>
      } @else {
        <app-empty-state
          testid="empty-state-learning"
          icon="school"
          message="No learning cards yet. Add a course, book or topic to start tracking it."
          actionLabel="Add Learning Card"
          (action)="openForm(null)"
        />
      }
    } @else {
      <app-load-state testid="learning" what="learning cards" [failed]="loadFailed()" (retry)="reload()" />
    }
  `,
  styles: `
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; align-items: start; }
  `,
})
export class LearningPageComponent {
  private readonly api = inject(LearningApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** null until the first response, so the empty state does not flash. */
  readonly cards = signal<LearningCardResponse[] | null>(null);
  readonly loadFailed = signal(false);

  constructor() {
    this.reload();
  }

  openForm(card: LearningCardResponse | null): void {
    this.dialog
      .open<LearningFormDialogComponent, LearningFormDialogData, LearningCardResponse>(LearningFormDialogComponent, { data: { card }, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify.info(card ? 'Learning card updated' : 'Learning card added');
          this.reload();
        }
      });
  }

  /** Milestone/note/status changes return the updated card: swap it in place (keeps other cards' UI state). */
  replace(card: LearningCardResponse): void {
    this.cards.update((list) => list && list.map((c) => (c.id === card.id ? card : c)));
  }

  remove(card: LearningCardResponse): void {
    confirmDialog(this.dialog, {
      title: 'Delete learning card?',
      message: `"${card.title}" and its milestones and notes will be permanently deleted.`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) return;
      this.api
        .delete(card.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notify.info('Learning card deleted');
            this.reload();
          },
          error: () => this.reload(),
        });
    });
  }

  reload(): void {
    this.loadFailed.set(false);
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.cards.set(list), error: () => this.loadFailed.set(true) });
  }
}
