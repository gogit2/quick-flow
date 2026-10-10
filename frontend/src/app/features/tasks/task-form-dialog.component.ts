import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskApi } from '../../core/api/task-api.service';
import { asProblemDetail } from '../../core/models/problem-detail';
import {
  TASK_DESCRIPTION_MAX,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_TITLE_MAX,
  TaskPriority,
  TaskRequest,
  TaskResponse,
  TaskStatus,
} from '../../core/models/task';

/** Pass a task to edit it, or null to create one. Closes with the saved task. */
export interface TaskFormDialogData {
  task: TaskResponse | null;
}

@Component({
  selector: 'app-task-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.task ? 'Edit task' : 'Add task' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="fields">
        <mat-form-field>
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" data-testid="task-form-title" cdkFocusInitial />
          <mat-hint align="end">{{ form.controls.title.value.length }} / {{ titleMax }}</mat-hint>
          @if (form.controls.title.hasError('required')) {
            <mat-error data-testid="task-form-title-error">Title is required</mat-error>
          } @else if (form.controls.title.hasError('maxlength')) {
            <mat-error data-testid="task-form-title-error">Title must be at most {{ titleMax }} characters</mat-error>
          } @else if (form.controls.title.hasError('server')) {
            <mat-error data-testid="task-form-title-error">{{ form.controls.title.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" data-testid="task-form-description"></textarea>
          @if (form.controls.description.hasError('maxlength')) {
            <mat-error data-testid="task-form-description-error">Description must be at most {{ descriptionMax }} characters</mat-error>
          } @else if (form.controls.description.hasError('server')) {
            <mat-error data-testid="task-form-description-error">{{ form.controls.description.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <div class="row">
          <mat-form-field>
            <mat-label>Status</mat-label>
            <mat-select formControlName="status" data-testid="task-form-status">
              @for (s of statuses; track s) {
                <mat-option [value]="s" [attr.data-testid]="'task-form-status-' + s">{{ statusLabels[s] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority" data-testid="task-form-priority">
              @for (p of priorities; track p) {
                <mat-option [value]="p" [attr.data-testid]="'task-form-priority-' + p">{{ priorityLabels[p] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field>
          <mat-label>Due date</mat-label>
          <input matInput type="date" formControlName="dueDate" data-testid="task-form-due" />
          @if (form.controls.dueDate.hasError('server')) {
            <mat-error data-testid="task-form-due-error">{{ form.controls.dueDate.getError('server') }}</mat-error>
          }
        </mat-form-field>

        @if (formError()) {
          <p class="form-error" role="alert" data-testid="task-form-error">{{ formError() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close data-testid="task-form-cancel">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()" data-testid="task-form-save">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields { display: flex; flex-direction: column; gap: 4px; min-width: min(480px, 80vw); }
    .row { display: flex; gap: 12px; }
    .row mat-form-field { flex: 1; }
    .form-error { color: var(--mat-sys-error, #b3261e); margin: 0; }
  `,
})
export class TaskFormDialogComponent {
  readonly data = inject<TaskFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<TaskFormDialogComponent, TaskResponse>);
  private readonly api = inject(TaskApi);

  readonly titleMax = TASK_TITLE_MAX;
  readonly descriptionMax = TASK_DESCRIPTION_MAX;
  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;
  readonly statusLabels = TASK_STATUS_LABELS;
  readonly priorityLabels = TASK_PRIORITY_LABELS;

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    title: [this.data.task?.title ?? '', [Validators.required, Validators.maxLength(TASK_TITLE_MAX), notBlank]],
    description: [this.data.task?.description ?? '', [Validators.maxLength(TASK_DESCRIPTION_MAX)]],
    status: [(this.data.task?.status ?? 'TODO') as TaskStatus],
    priority: [(this.data.task?.priority ?? 'MEDIUM') as TaskPriority],
    dueDate: [this.data.task?.dueDate ?? ''],
  });

  save(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: TaskRequest = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      status: v.status,
      priority: v.priority,
      dueDate: v.dueDate || null,
    };
    this.saving.set(true);
    const req = this.data.task ? this.api.update(this.data.task.id, body) : this.api.create(body);
    req.subscribe({
      next: (task) => this.dialogRef.close(task),
      error: (err: unknown) => {
        this.saving.set(false);
        this.showServerErrors(err);
      },
    });
  }

  private showServerErrors(err: unknown): void {
    const pd = err instanceof HttpErrorResponse ? asProblemDetail(err.error) : null;
    const errors = pd?.errors ?? {};
    const unmatched: string[] = [];
    for (const [field, message] of Object.entries(errors)) {
      const control = this.form.get(field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: message });
        control.markAsTouched();
      } else {
        unmatched.push(message);
      }
    }
    if (unmatched.length) {
      this.formError.set(unmatched.join('. '));
    }
  }
}

/** The backend rejects whitespace-only titles as blank. */
function notBlank(control: { value: string }) {
  return control.value && !control.value.trim() ? { required: true } : null;
}
