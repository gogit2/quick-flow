import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { catchError, forkJoin, of } from 'rxjs';
import { HabitApi } from '../../core/api/habit-api.service';
import { LearningApi } from '../../core/api/learning-api.service';
import { PlanApi } from '../../core/api/plan-api.service';
import { TaskApi } from '../../core/api/task-api.service';
import { HABIT_FREQUENCY_LABELS } from '../../core/models/habit';
import { LEARNING_STATUS_LABELS } from '../../core/models/learning';
import { PLAN_SOURCE_ICONS, PLAN_TITLE_MAX, PlanRequest, PlanResponse, PlanSourceType } from '../../core/models/plan';
import { asProblemDetail } from '../../core/models/problem-detail';
import { TASK_STATUS_LABELS } from '../../core/models/task';
import { dateTimeLocalToIso, toDateTimeLocal } from '../../core/time/local-date';

/** Pass a plan to edit it, or null to create one. Closes with the saved plan. */
export interface PlanFormDialogData {
  plan: PlanResponse | null;
}

interface SourceOption {
  type: PlanSourceType;
  id: number;
  title: string;
  detail: string;
}

interface SourceGroup {
  type: PlanSourceType;
  label: string;
  /** testid segment: plan-source-<slug>-<id> */
  slug: string;
  emptyText: string;
  options: SourceOption[];
}

const key = (type: PlanSourceType, id: number) => `${type}:${id}`;

@Component({
  selector: 'app-plan-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.plan ? 'Edit plan' : 'Create plan' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="content">
        <mat-form-field>
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" data-testid="plan-form-title" cdkFocusInitial />
          @if (form.controls.title.hasError('required')) {
            <mat-error data-testid="plan-form-title-error">Title is required</mat-error>
          } @else if (form.controls.title.hasError('maxlength')) {
            <mat-error data-testid="plan-form-title-error">Title must be at most {{ titleMax }} characters</mat-error>
          } @else if (form.controls.title.hasError('server')) {
            <mat-error data-testid="plan-form-title-error">{{ form.controls.title.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field>
            <mat-label>Start</mat-label>
            <input matInput type="datetime-local" formControlName="start" data-testid="plan-form-start" />
            @if (form.controls.start.hasError('required')) {
              <mat-error data-testid="plan-form-start-error">Start is required</mat-error>
            } @else if (form.controls.start.hasError('server')) {
              <mat-error data-testid="plan-form-start-error">{{ form.controls.start.getError('server') }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>End</mat-label>
            <input matInput type="datetime-local" formControlName="end" data-testid="plan-form-end" />
            @if (form.controls.end.hasError('required')) {
              <mat-error data-testid="plan-form-end-error">End is required</mat-error>
            } @else if (form.controls.end.hasError('server')) {
              <mat-error data-testid="plan-form-end-error">{{ form.controls.end.getError('server') }}</mat-error>
            }
          </mat-form-field>
        </div>
        @if (form.hasError('endBeforeStart') && (form.controls.end.touched || form.controls.start.touched)) {
          <p class="error" role="alert" data-testid="plan-form-range-error">End must be after the start</p>
        }

        <div class="row">
          <mat-form-field>
            <mat-label>Estimated duration (minutes)</mat-label>
            <input matInput type="number" min="1" step="1" formControlName="duration" data-testid="plan-form-duration" />
            @if (form.controls.duration.invalid) {
              <mat-error data-testid="plan-form-duration-error">{{ form.controls.duration.getError('server') ?? 'Enter a whole number of minutes, at least 1' }}</mat-error>
            }
          </mat-form-field>
          <mat-form-field>
            <mat-label>Priority (1 = highest)</mat-label>
            <input matInput type="number" min="1" step="1" formControlName="priority" data-testid="plan-form-priority" />
            @if (form.controls.priority.invalid) {
              <mat-error data-testid="plan-form-priority-error">{{ form.controls.priority.getError('server') ?? 'Enter a whole number, at least 1' }}</mat-error>
            }
          </mat-form-field>
        </div>

        <h3>Items <span class="count" data-testid="plan-form-selected-count">({{ selected().size }} selected)</span></h3>
        @if (!sources()) {
          <p class="muted">Loading tasks, habits and learning cards…</p>
        } @else {
          <div class="sources">
            @for (g of sources(); track g.type) {
              <section class="source-group" [attr.data-testid]="'plan-sources-' + g.slug">
                <h4><mat-icon aria-hidden="true">{{ icons[g.type] }}</mat-icon> {{ g.label }}</h4>
                @for (o of g.options; track o.id) {
                  <mat-checkbox
                    [checked]="selected().has(keyOf(o))"
                    (change)="toggle(o)"
                    [attr.data-testid]="'plan-source-' + g.slug + '-' + o.id"
                  >
                    <span class="option-title">{{ o.title }}</span><span class="muted"> · {{ o.detail }}</span>
                  </mat-checkbox>
                } @empty {
                  <p class="muted">{{ g.emptyText }}</p>
                }
              </section>
            }
          </div>
        }
        @if (itemsError()) {
          <p class="error" role="alert" data-testid="plan-form-items-error">{{ itemsError() }}</p>
        }

        @if (formError()) {
          <p class="error" role="alert" data-testid="plan-form-error">{{ formError() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close data-testid="plan-form-cancel">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()" data-testid="plan-form-save">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .content { display: flex; flex-direction: column; gap: 4px; min-width: min(640px, 85vw); }
    .row { display: flex; gap: 12px; flex-wrap: wrap; }
    .row mat-form-field { flex: 1 1 200px; }
    h3 { margin: 8px 0 4px; font-size: 16px; font-weight: 500; }
    .count { font-weight: 400; color: #666; font-size: 14px; }
    .sources { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
    .source-group { display: flex; flex-direction: column; gap: 2px; }
    h4 { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 500; }
    h4 mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .option-title { overflow-wrap: anywhere; }
    .muted { color: #777; font-size: 13px; margin: 0; }
    .error { color: var(--mat-sys-error, #b3261e); margin: 0; font-size: 13px; }
  `,
})
export class PlanFormDialogComponent {
  readonly data = inject<PlanFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<PlanFormDialogComponent, PlanResponse>);
  private readonly api = inject(PlanApi);
  private readonly taskApi = inject(TaskApi);
  private readonly habitApi = inject(HabitApi);
  private readonly learningApi = inject(LearningApi);

  readonly titleMax = PLAN_TITLE_MAX;
  readonly icons = PLAN_SOURCE_ICONS;

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  private readonly submitted = signal(false);
  private readonly serverItemsError = signal<string | null>(null);

  readonly sources = signal<SourceGroup[] | null>(null);
  readonly selected = signal<ReadonlySet<string>>(new Set(this.data.plan?.items.map((i) => key(i.sourceType, i.sourceId)) ?? []));

  /** BR-10: shown after a save attempt with no items. */
  readonly itemsError = computed(() =>
    this.serverItemsError() ?? (this.submitted() && this.selected().size === 0 ? 'Select at least one task, habit or learning card' : null),
  );

  readonly form = inject(FormBuilder).nonNullable.group(
    {
      title: [this.data.plan?.title ?? '', [Validators.required, Validators.maxLength(PLAN_TITLE_MAX), notBlank]],
      start: [toDateTimeLocal(this.data.plan ? new Date(this.data.plan.startDateTime) : roundedNow(0)), [Validators.required]],
      end: [toDateTimeLocal(this.data.plan ? new Date(this.data.plan.endDateTime) : roundedNow(60)), [Validators.required]],
      duration: [this.data.plan?.estimatedDuration ?? 60, [Validators.required, Validators.min(1), integer]],
      priority: [this.data.plan?.priorityOrder ?? 1, [Validators.required, Validators.min(1), integer]],
    },
    { validators: endAfterStart },
  );

  constructor() {
    // Active (non-archived) tasks, active habits, all learning cards; a failed list just shows as empty.
    forkJoin({
      tasks: this.taskApi.list().pipe(catchError(() => of([]))),
      habits: this.habitApi.list(true).pipe(catchError(() => of([]))),
      cards: this.learningApi.list().pipe(catchError(() => of([]))),
    }).subscribe(({ tasks, habits, cards }) =>
      this.sources.set([
        {
          type: 'TASK',
          label: 'Tasks',
          slug: 'task',
          emptyText: 'No tasks yet.',
          options: tasks.map((t) => ({ type: 'TASK', id: t.id, title: t.title, detail: TASK_STATUS_LABELS[t.status] })),
        },
        {
          type: 'HABIT',
          label: 'Habits',
          slug: 'habit',
          emptyText: 'No active habits.',
          options: habits.map((h) => ({ type: 'HABIT', id: h.id, title: h.name, detail: HABIT_FREQUENCY_LABELS[h.frequency] })),
        },
        {
          type: 'LEARNING_RESOURCE',
          label: 'Learning cards',
          slug: 'learning',
          emptyText: 'No learning cards yet.',
          options: cards.map((c) => ({ type: 'LEARNING_RESOURCE', id: c.id, title: c.title, detail: LEARNING_STATUS_LABELS[c.status] })),
        },
      ]),
    );
  }

  keyOf(o: SourceOption): string {
    return key(o.type, o.id);
  }

  toggle(o: SourceOption): void {
    this.serverItemsError.set(null);
    this.selected.update((s) => {
      const next = new Set(s);
      const k = key(o.type, o.id);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  }

  save(): void {
    this.formError.set(null);
    this.serverItemsError.set(null);
    this.submitted.set(true);
    if (this.form.invalid || this.selected().size === 0) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: PlanRequest = {
      title: v.title.trim(),
      estimatedDuration: Number(v.duration),
      startDateTime: dateTimeLocalToIso(v.start)!,
      endDateTime: dateTimeLocalToIso(v.end)!,
      priorityOrder: Number(v.priority),
      items: [...this.selected()].map((k) => {
        const [type, id] = k.split(':');
        return { sourceType: type as PlanSourceType, sourceId: Number(id) };
      }),
    };
    this.saving.set(true);
    const req = this.data.plan ? this.api.update(this.data.plan.id, body) : this.api.create(body);
    req.subscribe({
      next: (plan) => this.dialogRef.close(plan),
      error: (err: unknown) => {
        this.saving.set(false);
        this.showServerErrors(err);
      },
    });
  }

  private showServerErrors(err: unknown): void {
    const pd = err instanceof HttpErrorResponse ? asProblemDetail(err.error) : null;
    const controlFor: Record<string, AbstractControl> = {
      title: this.form.controls.title,
      startDateTime: this.form.controls.start,
      endDateTime: this.form.controls.end,
      estimatedDuration: this.form.controls.duration,
      priorityOrder: this.form.controls.priority,
    };
    const unmatched: string[] = [];
    for (const [field, message] of Object.entries(pd?.errors ?? {})) {
      const control = controlFor[field];
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: message });
        control.markAsTouched();
      } else if (field.startsWith('items')) {
        this.serverItemsError.set(message);
      } else {
        unmatched.push(message);
      }
    }
    if (unmatched.length) {
      this.formError.set(unmatched.join('. '));
    }
  }
}

/** Now (or now + minutes) rounded down to the minute, as the builder's default start/end. */
function roundedNow(addMinutes: number): Date {
  const d = new Date(Date.now() + addMinutes * 60_000);
  d.setSeconds(0, 0);
  return d;
}

/** BR-11: cross-field check on the group. */
function endAfterStart(group: AbstractControl): ValidationErrors | null {
  const start = dateTimeLocalToIso(group.get('start')?.value ?? '');
  const end = dateTimeLocalToIso(group.get('end')?.value ?? '');
  return start && end && Date.parse(end) <= Date.parse(start) ? { endBeforeStart: true } : null;
}

function integer(control: AbstractControl): ValidationErrors | null {
  const v = control.value;
  return v === null || v === '' || Number.isInteger(Number(v)) ? null : { integer: true };
}

/** The backend rejects whitespace-only titles as blank. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  return control.value && !String(control.value).trim() ? { required: true } : null;
}
