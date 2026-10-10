import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, finalize } from 'rxjs';
import { HabitApi } from '../../core/api/habit-api.service';
import { HABIT_FREQUENCY_LABELS, HabitResponse } from '../../core/models/habit';
import { NotificationService } from '../../core/notify/notification.service';
import { confirmDialog } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { HabitFormDialogComponent, HabitFormDialogData } from './habit-form-dialog.component';

@Component({
  selector: 'app-habits-page',
  imports: [PageHeaderComponent, EmptyStateComponent, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <app-page-header heading="Habits" testid="habits-title">
      <button mat-flat-button type="button" data-testid="habit-add-btn" (click)="openForm(null)">
        <mat-icon>add</mat-icon> Add Habit
      </button>
    </app-page-header>

    @if (sorted(); as list) {
      @if (list.length) {
        <div class="habit-grid" data-testid="habit-list">
          @for (h of list; track h.id) {
            <article class="habit-card" [class.inactive]="!h.active" [class.done]="h.doneToday" [attr.data-testid]="'habit-card-' + h.id">
              <header>
                <h2 class="name" [attr.data-testid]="'habit-name-' + h.id">{{ h.name }}</h2>
                <span class="chip frequency" [attr.data-testid]="'habit-frequency-' + h.id">{{ frequencyLabels[h.frequency] }}</span>
                @if (!h.active) {
                  <span class="chip inactive-chip" [attr.data-testid]="'habit-inactive-' + h.id">Inactive</span>
                }
              </header>
              @if (h.description) {
                <p class="description">{{ h.description }}</p>
              }

              <div class="stats">
                <span class="streak" [attr.data-testid]="'habit-streak-' + h.id">
                  <mat-icon aria-hidden="true">local_fire_department</mat-icon>
                  {{ h.currentStreak }} {{ streakUnit(h) }} streak
                </span>
                @if (h.frequency === 'WEEKLY' && h.doneThisPeriod) {
                  <span class="chip done-chip" [attr.data-testid]="'habit-done-period-' + h.id">Done this week</span>
                }
              </div>
              <div class="progress">
                <mat-progress-bar mode="determinate" [value]="h.progressPercent" [attr.aria-label]="'Progress of ' + h.name" />
                <span [attr.data-testid]="'habit-progress-' + h.id">{{ h.progressPercent }}% {{ progressWindow(h) }}</span>
              </div>

              <footer>
                @if (h.active) {
                  <button
                    [attr.data-testid]="'habit-toggle-' + h.id"
                    [attr.aria-pressed]="h.doneToday"
                    [attr.aria-label]="(h.doneToday ? 'Undo today for ' : 'Mark done today: ') + h.name"
                    [disabled]="busy().has(h.id)"
                    (click)="toggle(h)"
                    type="button"
                    class="toggle"
                    [class.on]="h.doneToday"
                    mat-stroked-button
                  >
                    <mat-icon>{{ h.doneToday ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                    {{ h.doneToday ? 'Done today' : 'Mark done' }}
                  </button>
                }
                <span class="spacer"></span>
                <button mat-icon-button type="button" matTooltip="Edit" [attr.aria-label]="'Edit ' + h.name" [attr.data-testid]="'habit-edit-' + h.id" (click)="openForm(h)">
                  <mat-icon>edit</mat-icon>
                </button>
                @if (h.active) {
                  <button mat-icon-button type="button" matTooltip="Deactivate" [attr.aria-label]="'Deactivate ' + h.name" [attr.data-testid]="'habit-deactivate-' + h.id" (click)="deactivate(h)">
                    <mat-icon>pause_circle</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button type="button" matTooltip="Activate" [attr.aria-label]="'Activate ' + h.name" [attr.data-testid]="'habit-activate-' + h.id" (click)="activate(h)">
                    <mat-icon>play_circle</mat-icon>
                  </button>
                }
                <button mat-icon-button type="button" matTooltip="Delete" [attr.aria-label]="'Delete ' + h.name" [attr.data-testid]="'habit-delete-' + h.id" (click)="remove(h)">
                  <mat-icon>delete</mat-icon>
                </button>
              </footer>
            </article>
          }
        </div>
      } @else {
        <app-empty-state testid="empty-state-habits" icon="repeat" message="No habits yet. Add a habit to start building a streak." actionLabel="Add Habit" (action)="openForm(null)" />
      }
    }
  `,
  styles: `
    .habit-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .habit-card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 12px; background: var(--mat-sys-surface-container-low, #f7f7f7); border: 1px solid transparent; }
    .habit-card.done { border-color: #8cc79a; }
    .habit-card.inactive { opacity: .6; }
    header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .name { margin: 0; font-size: 18px; font-weight: 500; flex: 1 1 auto; overflow-wrap: anywhere; }
    .description { margin: 0; color: #666; font-size: 14px; overflow-wrap: anywhere; }
    .chip { padding: 2px 10px; border-radius: 12px; background: #e8e8e8; font-size: 13px; }
    .frequency { background: #dbe7fb; }
    .inactive-chip { background: #eceff1; }
    .done-chip { background: #d7f0dc; }
    .stats { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 14px; }
    .streak { display: inline-flex; align-items: center; gap: 4px; }
    .streak mat-icon { color: #e8710a; font-size: 20px; width: 20px; height: 20px; }
    .progress { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #555; }
    footer { display: flex; align-items: center; gap: 4px; }
    .spacer { flex: 1; }
    .toggle.on { background: #d7f0dc; }
  `,
})
export class HabitsPageComponent {
  private readonly api = inject(HabitApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly frequencyLabels = HABIT_FREQUENCY_LABELS;

  /** null until the first response, so the empty state does not flash. */
  readonly habits = signal<HabitResponse[] | null>(null);
  /** Habits with a toggle request in flight (prevents double completions). */
  readonly busy = signal<ReadonlySet<number>>(new Set());

  /** Active habits first (A-03: inactive ones stay visible, greyed), then by id. */
  readonly sorted = computed(() => {
    const list = this.habits();
    return list && [...list].sort((a, b) => Number(b.active) - Number(a.active) || a.id - b.id);
  });

  constructor() {
    this.reload();
  }

  streakUnit(h: HabitResponse): string {
    return h.frequency === 'DAILY' ? (h.currentStreak === 1 ? 'day' : 'days') : h.currentStreak === 1 ? 'week' : 'weeks';
  }

  progressWindow(h: HabitResponse): string {
    return h.frequency === 'DAILY' ? 'of the last 7 days' : 'of the last 4 weeks';
  }

  openForm(habit: HabitResponse | null): void {
    this.dialog
      .open<HabitFormDialogComponent, HabitFormDialogData, HabitResponse>(HabitFormDialogComponent, { data: { habit }, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify.info(habit ? 'Habit updated' : 'Habit created');
          this.reload();
        }
      });
  }

  /** Done → remove today's completion; not done → record one. A 409 (BR-7) is shown by the interceptor. */
  toggle(h: HabitResponse): void {
    if (this.busy().has(h.id)) return;
    this.busy.update((s) => new Set(s).add(h.id));
    const req: Observable<unknown> = h.doneToday ? this.api.uncompleteToday(h.id) : this.api.complete(h.id);
    this.mutate(
      req.pipe(finalize(() => this.busy.update((s) => { const next = new Set(s); next.delete(h.id); return next; }))),
      h.doneToday ? 'Marked as not done today' : 'Habit completed for today',
    );
  }

  deactivate(h: HabitResponse): void {
    this.mutate(this.api.deactivate(h.id), 'Habit deactivated');
  }

  activate(h: HabitResponse): void {
    this.mutate(this.api.activate(h.id), 'Habit activated');
  }

  remove(h: HabitResponse): void {
    confirmDialog(this.dialog, {
      title: 'Delete habit?',
      message: `"${h.name}" and its completion history will be permanently deleted.`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (ok) this.mutate(this.api.delete(h.id), 'Habit deleted');
    });
  }

  private mutate(req: Observable<unknown>, message: string): void {
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.info(message);
        this.reload();
      },
      // Errors are shown by the interceptor; reload in case the card is stale (e.g. 404, 409).
      error: () => this.reload(),
    });
  }

  private reload(): void {
    this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (list) => this.habits.set(list), error: () => this.habits.update((l) => l ?? []) });
  }
}
