import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { DashboardApi } from '../../core/api/dashboard-api.service';
import { HabitApi } from '../../core/api/habit-api.service';
import { TaskApi } from '../../core/api/task-api.service';
import { DashboardResponse } from '../../core/models/dashboard';
import { HABIT_FREQUENCY_LABELS, HabitResponse } from '../../core/models/habit';
import { LEARNING_STATUSES, LEARNING_STATUS_LABELS } from '../../core/models/learning';
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS, TaskResponse } from '../../core/models/task';
import { NotificationService } from '../../core/notify/notification.service';
import { PlanStartWatcher } from '../../core/notify/plan-start-watcher.service';
import { LoadStateComponent } from '../../shared/load-state/load-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { RestTimeComponent } from '../../shared/rest-time/rest-time.component';
import { HabitFormDialogComponent } from '../habits/habit-form-dialog.component';
import { LearningFormDialogComponent } from '../learning/learning-form-dialog.component';
import { PlanFormDialogComponent } from '../plans/plan-form-dialog.component';
import { TaskFormDialogComponent } from '../tasks/task-form-dialog.component';

/** Dashboard (FR-09, UX Dashboard 1–6): one `GET /dashboard` payload, re-fetched after every change made here. */
@Component({
  selector: 'app-dashboard-page',
  imports: [DatePipe, NgTemplateOutlet, RouterLink, PageHeaderComponent, LoadStateComponent, RestTimeComponent, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  template: `
    <app-page-header heading="Dashboard" testid="dashboard-title">
      <div class="quick-add" role="group" aria-label="Quick add">
        <button mat-stroked-button type="button" data-testid="dash-quick-add-task" (click)="quickAdd('task')"><mat-icon>add_task</mat-icon> Task</button>
        <button mat-stroked-button type="button" data-testid="dash-quick-add-habit" (click)="quickAdd('habit')"><mat-icon>repeat</mat-icon> Habit</button>
        <button mat-stroked-button type="button" data-testid="dash-quick-add-learning" (click)="quickAdd('learning')"><mat-icon>school</mat-icon> Learning</button>
        <button mat-stroked-button type="button" data-testid="dash-quick-add-plan" (click)="quickAdd('plan')"><mat-icon>event_note</mat-icon> Plan</button>
      </div>
    </app-page-header>

    @if (data(); as d) {
      <p class="greeting" data-testid="dash-greeting">{{ d.greeting }}</p>
      <p class="today muted" data-testid="dash-today">{{ d.today | date: 'EEEE, MMMM d, y' }}</p>

      <section class="metrics" aria-label="Summary">
        <a class="metric" routerLink="/tasks" data-testid="dash-card-tasks">
          <span class="label">Tasks done</span>
          <span class="value" data-testid="dash-task-completion">{{ d.tasks.completionPercent }}%</span>
          <span class="sub">{{ d.tasks.doneCount }} of {{ d.tasks.totalActive }} · <span data-testid="dash-completed-today">{{ d.tasks.completedToday.length }}</span> today</span>
          <mat-progress-bar mode="determinate" [value]="d.tasks.completionPercent" aria-label="Task completion" />
        </a>
        <a class="metric" routerLink="/habits" data-testid="dash-card-habits">
          <span class="label">Habits today</span>
          <span class="value" data-testid="dash-habits-done">{{ d.habits.completedTodayCount }} / {{ d.habits.activeCount }}</span>
          <span class="sub">active habits done today</span>
          <mat-progress-bar mode="determinate" [value]="pct(d.habits.completedTodayCount, d.habits.activeCount)" aria-label="Habits done today" />
        </a>
        <a class="metric" routerLink="/plans" data-testid="dash-card-plans">
          <span class="label">Active plans</span>
          <span class="value" data-testid="dash-plans-active">{{ d.plans.activeCount }}</span>
          <span class="sub">{{ d.plans.upcoming.length }} upcoming</span>
        </a>
        <a class="metric" routerLink="/learning" data-testid="dash-card-learning">
          <span class="label">Learning in progress</span>
          <span class="value" data-testid="dash-learning-in-progress">{{ d.learning.byStatus.IN_PROGRESS }}</span>
          <span class="sub"><span data-testid="dash-learning-milestones-7d">{{ d.learning.milestonesCompletedLast7Days }}</span> milestones in 7 days</span>
        </a>
      </section>

      <div class="grid">
        <section class="panel" data-testid="dash-today-tasks">
          <h2><mat-icon aria-hidden="true">today</mat-icon> Today's tasks</h2>
          @for (t of d.tasks.dueToday; track t.id) {
            <ng-container *ngTemplateOutlet="taskRow; context: { $implicit: t }" />
          } @empty {
            <p class="empty" data-testid="empty-state-dash-today">Nothing due today. <a routerLink="/tasks">Plan your tasks</a> or use quick add.</p>
          }
          <h3 class="sub-head">Overdue</h3>
          <div data-testid="dash-overdue-tasks">
            @for (t of d.tasks.overdue; track t.id) {
              <ng-container *ngTemplateOutlet="taskRow; context: { $implicit: t }" />
            } @empty {
              <p class="empty" data-testid="empty-state-dash-overdue">No overdue tasks.</p>
            }
          </div>
          <h3 class="sub-head">Completed today</h3>
          <div data-testid="dash-completed-today-list">
            @for (t of d.tasks.completedToday; track t.id) {
              <div class="row done" [attr.data-testid]="'dash-completed-' + t.id"><mat-icon aria-hidden="true">check</mat-icon> {{ t.title }}</div>
            } @empty {
              <p class="empty" data-testid="empty-state-dash-completed">No tasks completed yet today.</p>
            }
          </div>
        </section>

        <section class="panel" data-testid="dash-today-habits">
          <h2><mat-icon aria-hidden="true">repeat</mat-icon> Today's habits</h2>
          @for (h of d.habits.today; track h.id) {
            <div class="row" [class.done]="h.doneToday" [attr.data-testid]="'dash-habit-' + h.id">
              <button
                mat-icon-button
                type="button"
                [attr.aria-pressed]="h.doneToday"
                [attr.aria-label]="(h.doneToday ? 'Undo today for ' : 'Mark done today: ') + h.name"
                [attr.data-testid]="'dash-habit-toggle-' + h.id"
                [disabled]="busy()"
                (click)="toggleHabit(h)"
              >
                <mat-icon>{{ h.doneToday ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
              </button>
              <span class="title">{{ h.name }}</span>
              <span class="chip">{{ frequencyLabels[h.frequency] }}</span>
              <span class="muted small">{{ h.currentStreak }} streak</span>
            </div>
          } @empty {
            <p class="empty" data-testid="empty-state-dash-habits">No habits for today. <a routerLink="/habits">Add a habit</a> to build a streak.</p>
          }
        </section>

        <section class="panel" data-testid="dash-active-plans">
          <h2><mat-icon aria-hidden="true">event_note</mat-icon> Active plans</h2>
          @for (p of d.plans.active; track p.id) {
            <a class="plan" routerLink="/plans" [attr.data-testid]="'dash-plan-' + p.id">
              <div class="plan-head">
                <span class="title">{{ p.title }}</span>
                <app-rest-time
                  [start]="p.startDateTime"
                  [end]="p.endDateTime"
                  [skewMs]="skewMs()"
                  [enabled]="p.status !== 'COMPLETED'"
                  [testid]="'dash-plan-rest-time-' + p.id"
                  (phaseChange)="reload()"
                />
              </div>
              <mat-progress-bar mode="determinate" [value]="p.progressPercent" [attr.aria-label]="'Progress of ' + p.title" />
              <span class="muted small" [attr.data-testid]="'dash-plan-progress-' + p.id">{{ p.doneItems }} / {{ p.totalItems }} items · {{ p.progressPercent }}%</span>
            </a>
          } @empty {
            <p class="empty" data-testid="empty-state-dash-plans">No plan in progress. <a routerLink="/plans">Create a plan</a> from your tasks, habits and learning.</p>
          }
          @if (d.plans.upcoming.length) {
            <h3 class="sub-head">Upcoming</h3>
            @for (p of d.plans.upcoming; track p.id) {
              <div class="row" [attr.data-testid]="'dash-upcoming-' + p.id">
                <span class="title">{{ p.title }}</span>
                <span class="muted small">{{ p.startDateTime | date: 'MMM d, HH:mm' }}</span>
              </div>
            }
          }
        </section>

        <section class="panel" data-testid="dash-learning">
          <h2><mat-icon aria-hidden="true">school</mat-icon> Learning</h2>
          <div class="statuses">
            @for (s of learningStatuses; track s) {
              <span class="chip status-{{ s }}" [attr.data-testid]="'dash-learning-' + s">{{ learningLabels[s] }}: {{ d.learning.byStatus[s] }}</span>
            }
          </div>
          @for (c of d.learning.inProgress; track c.id) {
            <div class="card-row" [attr.data-testid]="'dash-learning-card-' + c.id">
              <span class="title">{{ c.title }}</span>
              <mat-progress-bar mode="determinate" [value]="c.progressPercent" [attr.aria-label]="'Progress of ' + c.title" />
              <span class="muted small">{{ c.milestonesDone }} / {{ c.milestonesTotal }} milestones</span>
            </div>
          } @empty {
            <p class="empty" data-testid="empty-state-dash-learning">No learning card in progress. <a routerLink="/learning">Add a learning card</a>.</p>
          }
        </section>
      </div>

      <ng-template #taskRow let-t>
        <div class="row" [class.done]="t.status === 'DONE'" [attr.data-testid]="'dash-task-' + t.id">
          @if (t.status !== 'DONE') {
            <button mat-icon-button type="button" matTooltip="Mark complete" [attr.aria-label]="'Complete ' + t.title" [attr.data-testid]="'dash-task-complete-' + t.id" [disabled]="busy()" (click)="completeTask(t)">
              <mat-icon>radio_button_unchecked</mat-icon>
            </button>
          } @else {
            <mat-icon class="done-icon" aria-label="Done">check_circle</mat-icon>
          }
          <span class="title">{{ t.title }}</span>
          <span class="chip">{{ priorityLabel(t) }}</span>
          @if (t.overdue) {
            <span class="chip overdue">Overdue · {{ t.dueDate | date: 'MMM d' }}</span>
          } @else {
            <span class="muted small">{{ statusLabel(t) }}</span>
          }
        </div>
      </ng-template>
    } @else {
      <app-load-state testid="dashboard" what="the dashboard" [failed]="loadFailed()" (retry)="reload()" />
    }
  `,
  styles: `
    .quick-add { display: flex; flex-wrap: wrap; gap: 8px; }
    .greeting { margin: -8px 0 0; font-size: 20px; }
    .today { margin: 0 0 16px; }
    .muted { color: #777; }
    .small { font-size: 12px; }
    .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .metric { display: flex; flex-direction: column; gap: 4px; padding: 14px 16px; border-radius: 12px; background: var(--mat-sys-surface-container-low, #f7f7f7); color: inherit; text-decoration: none; }
    .metric:hover { background: #eef2f8; }
    .metric .label { font-size: 13px; color: #555; }
    .metric .value { font-size: 28px; font-weight: 500; }
    .metric .sub { font-size: 12px; color: #777; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; align-items: start; }
    .panel { display: flex; flex-direction: column; gap: 6px; padding: 16px; border-radius: 12px; border: 1px solid #e3e3e3; }
    h2 { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; font-size: 17px; font-weight: 500; }
    h2 mat-icon { color: #555; }
    .sub-head { margin: 10px 0 2px; font-size: 13px; font-weight: 500; color: #555; text-transform: uppercase; letter-spacing: .04em; }
    .row { display: flex; align-items: center; gap: 8px; min-height: 40px; font-size: 14px; }
    .row .title, .card-row .title, .plan .title { flex: 1 1 auto; overflow-wrap: anywhere; }
    .row.done .title { text-decoration: line-through; opacity: .7; }
    .done-icon { color: #34a853; margin: 0 8px; }
    .chip { padding: 2px 8px; border-radius: 10px; background: #eceff1; font-size: 12px; white-space: nowrap; }
    .overdue { background: #b3261e; color: #fff; }
    .status-IN_PROGRESS { background: #dbe7fb; }
    .status-COMPLETED { background: #d7f0dc; }
    .statuses { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
    .plan { display: flex; flex-direction: column; gap: 4px; padding: 8px 0; color: inherit; text-decoration: none; border-bottom: 1px solid #f0f0f0; }
    .plan-head { display: flex; align-items: baseline; gap: 8px; }
    .card-row { display: flex; flex-direction: column; gap: 4px; padding: 6px 0; }
    .empty { margin: 0; color: #777; font-size: 14px; }
  `,
})
export class DashboardPageComponent {
  private readonly api = inject(DashboardApi);
  private readonly taskApi = inject(TaskApi);
  private readonly habitApi = inject(HabitApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly watcher = inject(PlanStartWatcher);
  private readonly destroyRef = inject(DestroyRef);

  readonly frequencyLabels = HABIT_FREQUENCY_LABELS;
  readonly learningStatuses = LEARNING_STATUSES;
  readonly learningLabels = LEARNING_STATUS_LABELS;

  /** null until the first response. */
  readonly data = signal<DashboardResponse | null>(null);
  readonly loadFailed = signal(false);
  /** Server clock − client clock (D-44), for the rest-time countdowns. */
  readonly skewMs = signal(0);
  readonly busy = signal(false);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loadFailed.set(false);
    this.api
      .get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (d) => {
          this.skewMs.set(Date.parse(d.serverTime) - Date.now());
          this.data.set(d);
        },
        // The interceptor shows the error; the page offers a retry until the first load succeeds.
        error: () => this.loadFailed.set(true),
      });
  }

  // Typed lookups for the shared task-row template (its context is untyped).
  priorityLabel(t: TaskResponse): string {
    return TASK_PRIORITY_LABELS[t.priority];
  }

  statusLabel(t: TaskResponse): string {
    return TASK_STATUS_LABELS[t.status];
  }

  pct(part: number, total: number): number {
    return total ? Math.round((part / total) * 100) : 0;
  }

  completeTask(t: TaskResponse): void {
    this.mutate(this.taskApi.complete(t.id), 'Task completed');
  }

  toggleHabit(h: HabitResponse): void {
    const req: Observable<unknown> = h.doneToday ? this.habitApi.uncompleteToday(h.id) : this.habitApi.complete(h.id);
    this.mutate(req, h.doneToday ? 'Marked as not done today' : 'Habit completed for today');
  }

  /** Quick-add reuses the feature dialogs; the dashboard refreshes after a save. */
  quickAdd(kind: 'task' | 'habit' | 'learning' | 'plan'): void {
    const config = { autoFocus: 'first-tabbable' as const };
    const ref =
      kind === 'task'
        ? this.dialog.open(TaskFormDialogComponent, { ...config, data: { task: null } })
        : kind === 'habit'
          ? this.dialog.open(HabitFormDialogComponent, { ...config, data: { habit: null } })
          : kind === 'learning'
            ? this.dialog.open(LearningFormDialogComponent, { ...config, data: { card: null } })
            : this.dialog.open(PlanFormDialogComponent, { ...config, data: { plan: null }, maxHeight: '90vh' });
    const labels = { task: 'Task created', habit: 'Habit created', learning: 'Learning card added', plan: 'Plan created' };
    ref.afterClosed().subscribe((saved) => {
      if (!saved) return;
      this.notify.info(labels[kind]);
      this.reload();
      if (kind === 'plan') this.watcher.refresh();
    });
  }

  private mutate(req: Observable<unknown>, message: string): void {
    this.busy.set(true);
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.notify.info(message);
        this.reload();
      },
      error: () => {
        this.busy.set(false);
        this.reload();
      },
    });
  }
}
