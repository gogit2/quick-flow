import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { PlanApi } from '../../core/api/plan-api.service';
import { PlanItemResponse, PlanResponse } from '../../core/models/plan';
import { NotificationService } from '../../core/notify/notification.service';
import { PlanStartWatcher } from '../../core/notify/plan-start-watcher.service';
import { confirmDialog } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { PlanCardComponent } from './plan-card.component';
import { PlanFormDialogComponent, PlanFormDialogData } from './plan-form-dialog.component';

@Component({
  selector: 'app-plans-page',
  imports: [DatePipe, PageHeaderComponent, EmptyStateComponent, PlanCardComponent, MatButtonModule, MatIconModule],
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
            <app-plan-card
              [plan]="p"
              [skewMs]="skewMs()"
              [started]="started().has(p.id)"
              [busy]="busy().has(p.id)"
              (toggleItem)="toggleItem(p, $event)"
              (edit)="openForm(p)"
              (remove)="remove(p)"
              (windowChange)="reload()"
            />
          } @empty {
            <p class="muted" data-testid="plans-group-active-empty">No active or upcoming plans.</p>
          }
        </section>
        <section class="group" data-testid="plans-group-completed">
          <h2>Completed <span class="count">({{ completed().length }})</span></h2>
          @for (p of completed(); track p.id) {
            <app-plan-card
              [plan]="p"
              [skewMs]="skewMs()"
              [busy]="busy().has(p.id)"
              (toggleItem)="toggleItem(p, $event)"
              (edit)="openForm(p)"
              (remove)="remove(p)"
              (windowChange)="reload()"
            />
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

      <section class="history" data-testid="plans-history">
        <h2>History</h2>
        @if (history().length) {
          <table>
            <thead>
              <tr><th scope="col">Plan</th><th scope="col">Ended</th><th scope="col">Completed</th></tr>
            </thead>
            <tbody>
              @for (h of history(); track h.id) {
                <tr [attr.data-testid]="'plan-history-row-' + h.id">
                  <td>{{ h.title }}</td>
                  <td>{{ h.endDateTime | date: 'MMM d, y, HH:mm' }}</td>
                  <td [attr.data-testid]="'plan-history-progress-' + h.id">{{ h.doneItems }} / {{ h.totalItems }} · {{ h.progressPercent }}%</td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="muted" data-testid="plans-history-empty">Completed plans will appear here with how much of each was done.</p>
        }
      </section>
    }
  `,
  styles: `
    .group { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; align-items: start; margin-bottom: 24px; }
    h2 { margin: 0; font-size: 18px; font-weight: 500; }
    .group h2 { grid-column: 1 / -1; }
    .count { color: #777; font-weight: 400; }
    .muted { grid-column: 1 / -1; color: #777; margin: 0; }
    .history { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    table { border-collapse: collapse; width: 100%; max-width: 720px; font-size: 14px; }
    th, td { text-align: left; padding: 6px 12px 6px 0; border-bottom: 1px solid #e0e0e0; }
    th { font-weight: 500; color: #555; }
  `,
})
export class PlansPageComponent {
  private readonly api = inject(PlanApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly watcher = inject(PlanStartWatcher);
  private readonly destroyRef = inject(DestroyRef);

  /** null until the first response, so the empty state does not flash. */
  readonly plans = signal<PlanResponse[] | null>(null);
  /** COMPLETED plans, most recent end first (D-49). */
  readonly history = signal<PlanResponse[]>([]);
  /** Server clock − client clock, from the last response (D-44). */
  readonly skewMs = signal(0);
  /** Plans with an item toggle in flight. */
  readonly busy = signal<ReadonlySet<number>>(new Set());
  /** Plans whose start notification fired in this session (highlighted). */
  readonly started = this.watcher.started;

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
    this.api
      .history()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.history.set(list), error: () => {} });
  }

  /** Item done/not done (A-09). Progress and status update from the returned plan; marking done may change the source (BR-13). */
  toggleItem(plan: PlanResponse, item: PlanItemResponse): void {
    if (this.busy().has(plan.id)) return;
    this.busy.update((s) => new Set(s).add(plan.id));
    const done = () => this.busy.update((s) => {
      const next = new Set(s);
      next.delete(plan.id);
      return next;
    });
    this.api
      .setItemDone(plan.id, item.id, !item.done)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          done();
          this.plans.update((list) => list && list.map((p) => (p.id === updated.id ? updated : p)));
          if (updated.status === 'COMPLETED' && plan.status !== 'COMPLETED') this.notify.info(`Plan '${updated.title}' completed`);
          // Re-read for the server's ordering and the history list.
          this.reload();
        },
        error: () => {
          done();
          this.reload();
        },
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
          this.watcher.refresh();
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
            this.watcher.refresh();
          },
          error: () => this.reload(),
        });
    });
  }
}
