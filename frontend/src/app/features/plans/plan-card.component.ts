import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PLAN_SOURCE_ICONS, PLAN_SOURCE_LABELS, PLAN_STATUS_LABELS, PlanItemResponse, PlanResponse } from '../../core/models/plan';
import { RestTimeComponent } from '../../shared/rest-time/rest-time.component';

/** One plan: status, schedule, progress (done/total), live rest time and its items. */
@Component({
  selector: 'app-plan-card',
  imports: [DatePipe, MatButtonModule, MatCheckboxModule, MatIconModule, MatProgressBarModule, MatTooltipModule, RestTimeComponent],
  template: `
    @let p = plan();
    <article class="plan-card status-{{ p.status }}" [class.started]="started()" [attr.data-testid]="'plan-card-' + p.id">
      <header>
        <h3 class="title" [attr.data-testid]="'plan-title-' + p.id">{{ p.title }}</h3>
        @if (started()) {
          <span class="chip started-badge" role="status" [attr.data-testid]="'plan-started-' + p.id"><mat-icon aria-hidden="true">notifications_active</mat-icon> Started</span>
        }
        <span class="chip status" [attr.data-testid]="'plan-status-' + p.id">{{ statusLabels[p.status] }}</span>
        <span class="chip priority" [attr.data-testid]="'plan-priority-' + p.id" matTooltip="Priority order (1 = highest)">P{{ p.priorityOrder }}</span>
      </header>

      <div class="schedule">
        <span [attr.data-testid]="'plan-schedule-' + p.id">{{ p.startDateTime | date: 'MMM d, HH:mm' }} → {{ p.endDateTime | date: 'MMM d, HH:mm' }}</span>
        <span class="muted" [attr.data-testid]="'plan-duration-' + p.id">· est. {{ p.estimatedDuration }} min</span>
      </div>

      <div class="rest">
        @if (p.status === 'NOT_STARTED') {
          <span class="muted" [attr.data-testid]="'plan-starts-' + p.id">Starts {{ p.startDateTime | date: 'MMM d, HH:mm' }}</span>
        }
        <app-rest-time
          [start]="p.startDateTime"
          [end]="p.endDateTime"
          [skewMs]="skewMs()"
          [enabled]="p.status !== 'COMPLETED'"
          [testid]="'plan-rest-time-' + p.id"
          (phaseChange)="windowChange.emit()"
        />
        @if (p.status === 'IN_PROGRESS') {
          <span class="muted">remaining</span>
        }
      </div>

      <div class="progress">
        <mat-progress-bar mode="determinate" [value]="p.progressPercent" [attr.aria-label]="'Progress of ' + p.title" />
        <span [attr.data-testid]="'plan-progress-' + p.id">{{ p.doneItems }} / {{ p.totalItems }} items · {{ p.progressPercent }}%</span>
      </div>

      <ul class="items">
        @for (i of p.items; track i.id) {
          <li [class.done]="i.done" [attr.data-testid]="'plan-item-' + i.id">
            <mat-checkbox
              [checked]="i.done"
              [disabled]="busy()"
              [aria-label]="(i.done ? 'Mark not done: ' : 'Mark done: ') + i.sourceTitle"
              [attr.data-testid]="'plan-item-toggle-' + i.id"
              (change)="toggleItem.emit(i)"
            />
            <mat-icon class="type-icon" [matTooltip]="sourceLabels[i.sourceType]" [attr.aria-label]="sourceLabels[i.sourceType]">{{ sourceIcons[i.sourceType] }}</mat-icon>
            <span class="item-title" [attr.data-testid]="'plan-item-title-' + i.id">{{ i.sourceTitle }}</span>
            <span class="muted item-status" [attr.data-testid]="'plan-item-status-' + i.id">{{ statusText(i.sourceStatus) }}</span>
          </li>
        } @empty {
          <li class="muted" [attr.data-testid]="'plan-items-empty-' + p.id">No items left (their sources were deleted).</li>
        }
      </ul>

      <footer>
        <span class="spacer"></span>
        <button mat-icon-button type="button" matTooltip="Edit" [attr.aria-label]="'Edit ' + p.title" [attr.data-testid]="'plan-edit-' + p.id" (click)="edit.emit()">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Delete" [attr.aria-label]="'Delete ' + p.title" [attr.data-testid]="'plan-delete-' + p.id" (click)="remove.emit()">
          <mat-icon>delete</mat-icon>
        </button>
      </footer>
    </article>
  `,
  styles: `
    .plan-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; border-radius: 12px; background: var(--mat-sys-surface-container-low, #f7f7f7); border-left: 4px solid #bdbdbd; }
    .plan-card.status-IN_PROGRESS { border-left-color: #1a73e8; }
    .plan-card.status-COMPLETED { border-left-color: #34a853; }
    .plan-card.started { box-shadow: 0 0 0 2px #fbbc04; }
    .started-badge { display: inline-flex; align-items: center; gap: 4px; background: #fef0c3; }
    .started-badge mat-icon { font-size: 16px; width: 16px; height: 16px; color: #b06000; }
    .item-status { font-size: 12px; }
    header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .title { margin: 0; font-size: 18px; font-weight: 500; flex: 1 1 auto; overflow-wrap: anywhere; }
    .chip { padding: 2px 10px; border-radius: 12px; background: #e8e8e8; font-size: 13px; }
    .status-IN_PROGRESS .status { background: #dbe7fb; }
    .status-COMPLETED .status { background: #d7f0dc; }
    .priority { background: #fff3cd; }
    .schedule, .rest { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; font-size: 14px; }
    .rest { font-size: 18px; min-height: 0; }
    .rest .muted { font-size: 13px; }
    .muted { color: #777; }
    .progress { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #555; }
    .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 2px; }
    .items li { display: flex; align-items: center; gap: 6px; font-size: 14px; }
    .items li.done .item-title { text-decoration: line-through; opacity: .7; }
    .items mat-icon { font-size: 18px; width: 18px; height: 18px; color: #666; }
    .item-title { overflow-wrap: anywhere; }
    footer { display: flex; align-items: center; }
    .spacer { flex: 1; }
  `,
})
export class PlanCardComponent {
  readonly plan = input.required<PlanResponse>();
  readonly skewMs = input(0);
  /** The start notification fired for this plan in this session (D-46 highlight). */
  readonly started = input(false);
  /** A toggle for this plan is in flight. */
  readonly busy = input(false);
  /** Mark an item done / not done (PATCH, A-09). */
  readonly toggleItem = output<PlanItemResponse>();
  readonly edit = output<void>();
  readonly remove = output<void>();
  /** The plan's start or end just passed: its derived status must be re-read (D-43). */
  readonly windowChange = output<void>();

  readonly statusLabels = PLAN_STATUS_LABELS;
  readonly sourceLabels = PLAN_SOURCE_LABELS;
  readonly sourceIcons = PLAN_SOURCE_ICONS;

  /** Source status (A-08) as plain text, e.g. IN_PROGRESS → "in progress". */
  statusText(status: string | null | undefined): string {
    return (status ?? '').replace(/_/g, ' ').toLowerCase();
  }
}
