import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { HabitApi } from '../../core/api/habit-api.service';
import {
  HABIT_DESCRIPTION_MAX,
  HABIT_FREQUENCIES,
  HABIT_FREQUENCY_LABELS,
  HABIT_NAME_MAX,
  HabitFrequency,
  HabitRequest,
  HabitResponse,
} from '../../core/models/habit';
import { asProblemDetail } from '../../core/models/problem-detail';

/** Pass a habit to edit it, or null to create one. Closes with the saved habit. */
export interface HabitFormDialogData {
  habit: HabitResponse | null;
}

@Component({
  selector: 'app-habit-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.habit ? 'Edit habit' : 'Add habit' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="fields">
        <mat-form-field>
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" data-testid="habit-form-name" cdkFocusInitial />
          <mat-hint align="end">{{ form.controls.name.value.length }} / {{ nameMax }}</mat-hint>
          @if (form.controls.name.hasError('required')) {
            <mat-error data-testid="habit-form-name-error">Name is required</mat-error>
          } @else if (form.controls.name.hasError('maxlength')) {
            <mat-error data-testid="habit-form-name-error">Name must be at most {{ nameMax }} characters</mat-error>
          } @else if (form.controls.name.hasError('server')) {
            <mat-error data-testid="habit-form-name-error">{{ form.controls.name.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" data-testid="habit-form-description"></textarea>
          @if (form.controls.description.hasError('maxlength')) {
            <mat-error data-testid="habit-form-description-error">Description must be at most {{ descriptionMax }} characters</mat-error>
          } @else if (form.controls.description.hasError('server')) {
            <mat-error data-testid="habit-form-description-error">{{ form.controls.description.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Frequency</mat-label>
          <mat-select formControlName="frequency" data-testid="habit-form-frequency">
            @for (f of frequencies; track f) {
              <mat-option [value]="f" [attr.data-testid]="'habit-form-frequency-' + f">{{ frequencyLabels[f] }}</mat-option>
            }
          </mat-select>
          @if (form.controls.frequency.hasError('required')) {
            <mat-error data-testid="habit-form-frequency-error">Frequency is required</mat-error>
          } @else if (form.controls.frequency.hasError('server')) {
            <mat-error data-testid="habit-form-frequency-error">{{ form.controls.frequency.getError('server') }}</mat-error>
          }
        </mat-form-field>

        @if (formError()) {
          <p class="form-error" role="alert" data-testid="habit-form-error">{{ formError() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close data-testid="habit-form-cancel">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()" data-testid="habit-form-save">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields { display: flex; flex-direction: column; gap: 4px; min-width: min(440px, 80vw); }
    .form-error { color: var(--mat-sys-error, #b3261e); margin: 0; }
  `,
})
export class HabitFormDialogComponent {
  readonly data = inject<HabitFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<HabitFormDialogComponent, HabitResponse>);
  private readonly api = inject(HabitApi);

  readonly nameMax = HABIT_NAME_MAX;
  readonly descriptionMax = HABIT_DESCRIPTION_MAX;
  readonly frequencies = HABIT_FREQUENCIES;
  readonly frequencyLabels = HABIT_FREQUENCY_LABELS;

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    name: [this.data.habit?.name ?? '', [Validators.required, Validators.maxLength(HABIT_NAME_MAX), notBlank]],
    description: [this.data.habit?.description ?? '', [Validators.maxLength(HABIT_DESCRIPTION_MAX)]],
    frequency: [(this.data.habit?.frequency ?? 'DAILY') as HabitFrequency, [Validators.required]],
  });

  save(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const body: HabitRequest = {
      name: v.name.trim(),
      description: v.description.trim() || null,
      frequency: v.frequency,
    };
    this.saving.set(true);
    const req = this.data.habit ? this.api.update(this.data.habit.id, body) : this.api.create(body);
    req.subscribe({
      next: (habit) => this.dialogRef.close(habit),
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

/** The backend rejects whitespace-only names as blank. */
function notBlank(control: { value: string }) {
  return control.value && !control.value.trim() ? { required: true } : null;
}
