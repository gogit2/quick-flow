import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PlanApi } from '../../core/api/plan-api.service';
import { PlanResponse } from '../../core/models/plan';
import { NotificationService } from '../../core/notify/notification.service';
import { confirmDialog } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { PlanCardComponent } from './plan-card.component';
import { PlanFormDialogComponent, PlanFormDialogData } from './plan-form-dialog.component';

@Component({
  selector: 'app-plans-page',
  imports: [PageHeaderComponent, EmptyStateComponent, PlanCardComponent, MatButtonModule, MatIconModule],
  template: `
    <app-page-header heading="Todo Plans" testid="plans-title">
      <button mat-flat-button type="button" data-testid="plan-add-btn" (click)="openForm(null)">
        <mat-icon>add</mat-icon> Create Plan
      </button>
    </app-page-header>

    @if (plans(); as list) {
      @if (list.length) {
        <section class="group" data-testid="plans-group-active">
          <h2>Active &amp; upcoming <span class="count">({{ active().length }})</span></h2>
          @for (p of active(); track p.id) {
            <app-plan-card [plan]="p" [skewMs]="skewMs()" (edit)="openForm(p)" (remove)="remove(p)" (windowChange)="reload()" />
          } @empty {
            <p class="muted" data-testid="plans-group-active-empty">No active or upcoming plans.</p>
          }
        </section>
        <section class="group" data-testid="plans-group-completed">
          <h2>Completed <span class="count">({{ completed().length }})</span></h2>
          @for (p of completed(); track p.id) {
            <app-plan-card [plan]="p" [skewMs]="skewMs()" (edit)="openForm(p)" (remove)="remove(p)" (windowChange)="reload()" />
          } @empty {
            <p class="muted" data-testid="plans-group-completed-empty">No completed plans yet.</p>
          }
        </section>
      } @else {
        <app-empty-state
          testid="empty-state-plans"
          icon="event_note"
          message="No plans yet. Create a plan from your tasks, habits and learning cards."
          actionLabel="Create Plan"
          (action)="openForm(null)"
        />
      }
    }
  `,
  styles: `
    .group { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; align-items: start; margin-bottom: 24px; }
    .group h2 { grid-column: 1 / -1; margin: 0; font-size: 18px; font-weight: 500; }
    .count { color: #777; font-weight: 400; }
    .muted { grid-column: 1 / -1; color: #777; margin: 0; }
  `,
})
export class PlansPageComponent {
  private readonly api = inject(PlanApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  /** null until the first response, so the empty state does not flash. */
  readonly plans = signal<PlanResponse[] | null>(null);
  /** Server clock − client clock, from the last response (D-44). */
  readonly skewMs = signal(0);

  // The API already sorts by status group, priority, start (D-41); keep that order within each group.
  readonly active = computed(() => (this.plans() ?? []).filter((p) => p.status !== 'COMPLETED'));
  readonly completed = computed(() => (this.plans() ?? []).filter((p) => p.status === 'COMPLETED'));

  constructor() {
    this.reload();
  }

  reload(): void {
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          if (list.length) this.skewMs.set(Date.parse(list[0].serverTime) - Date.now());
          this.plans.set(list);
        },
        error: () => this.plans.update((l) => l ?? []),
      });
  }

  openForm(plan: PlanResponse | null): void {
    this.dialog
      .open<PlanFormDialogComponent, PlanFormDialogData, PlanResponse>(PlanFormDialogComponent, {
        data: { plan },
        autoFocus: 'first-tabbable',
        maxHeight: '90vh',
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify.info(plan ? 'Plan updated' : 'Plan created');
          this.reload();
        }
      });
  }

  remove(plan: PlanResponse): void {
    confirmDialog(this.dialog, {
      title: 'Delete plan?',
      message: `"${plan.title}" will be permanently deleted. Its tasks, habits and learning cards are kept.`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (!ok) return;
      this.api
        .delete(plan.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.notify.info('Plan deleted');
            this.reload();
          },
          error: () => this.reload(),
        });
    });
  }
}
