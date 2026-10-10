import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LearningApi } from '../../core/api/learning-api.service';
import { LEARNING_DESCRIPTION_MAX, LEARNING_TITLE_MAX, LearningCardRequest, LearningCardResponse } from '../../core/models/learning';
import { asProblemDetail } from '../../core/models/problem-detail';

/** Pass a card to edit it, or null to create one. Closes with the saved card. */
export interface LearningFormDialogData {
  card: LearningCardResponse | null;
}

@Component({
  selector: 'app-learning-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>{{ data.card ? 'Edit learning card' : 'Add learning card' }}</h2>
    <form [formGroup]="form" (ngSubmit)="save()" novalidate>
      <mat-dialog-content class="fields">
        <mat-form-field>
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" data-testid="learning-form-title" cdkFocusInitial />
          <mat-hint align="end">{{ form.controls.title.value.length }} / {{ titleMax }}</mat-hint>
          @if (form.controls.title.hasError('required')) {
            <mat-error data-testid="learning-form-title-error">Title is required</mat-error>
          } @else if (form.controls.title.hasError('maxlength')) {
            <mat-error data-testid="learning-form-title-error">Title must be at most {{ titleMax }} characters</mat-error>
          } @else if (form.controls.title.hasError('server')) {
            <mat-error data-testid="learning-form-title-error">{{ form.controls.title.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field>
          <mat-label>Description / source</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Link, book, course name…" data-testid="learning-form-description"></textarea>
          @if (form.controls.description.hasError('maxlength')) {
            <mat-error data-testid="learning-form-description-error">Description must be at most {{ descriptionMax }} characters</mat-error>
          } @else if (form.controls.description.hasError('server')) {
            <mat-error data-testid="learning-form-description-error">{{ form.controls.description.getError('server') }}</mat-error>
          }
        </mat-form-field>

        @if (formError()) {
          <p class="form-error" role="alert" data-testid="learning-form-error">{{ formError() }}</p>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close data-testid="learning-form-cancel">Cancel</button>
        <button mat-flat-button type="submit" [disabled]="saving()" data-testid="learning-form-save">Save</button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .fields { display: flex; flex-direction: column; gap: 4px; min-width: min(480px, 80vw); }
    .form-error { color: var(--mat-sys-error, #b3261e); margin: 0; }
  `,
})
export class LearningFormDialogComponent {
  readonly data = inject<LearningFormDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<LearningFormDialogComponent, LearningCardResponse>);
  private readonly api = inject(LearningApi);

  readonly titleMax = LEARNING_TITLE_MAX;
  readonly descriptionMax = LEARNING_DESCRIPTION_MAX;

  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = inject(FormBuilder).nonNullable.group({
    title: [this.data.card?.title ?? '', [Validators.required, Validators.maxLength(LEARNING_TITLE_MAX), notBlank]],
    description: [this.data.card?.description ?? '', [Validators.maxLength(LEARNING_DESCRIPTION_MAX)]],
  });

  save(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    // Status is omitted: ignored on create, kept on update (A-07).
    const body: LearningCardRequest = { title: v.title.trim(), description: v.description.trim() || null };
    this.saving.set(true);
    const req = this.data.card ? this.api.update(this.data.card.id, body) : this.api.create(body);
    req.subscribe({
      next: (card) => this.dialogRef.close(card),
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
