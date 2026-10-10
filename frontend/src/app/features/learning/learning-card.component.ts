import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, switchMap } from 'rxjs';
import { LearningApi } from '../../core/api/learning-api.service';
import {
  LEARNING_STATUSES,
  LEARNING_STATUS_LABELS,
  LearningCardResponse,
  LearningStatus,
  MILESTONE_TITLE_MAX,
  MilestoneResponse,
  NOTE_TEXT_MAX,
  NoteResponse,
} from '../../core/models/learning';
import { NotificationService } from '../../core/notify/notification.service';

/** One learning card: summary, plus an expandable panel with milestones, notes and a manual status. */
@Component({
  selector: 'app-learning-card',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  template: `
    @let c = card();
    <article class="card" [class.expanded]="expanded()" [attr.data-testid]="'learning-card-' + c.id">
      <header>
        <h2 class="title" [attr.data-testid]="'learning-title-' + c.id">{{ c.title }}</h2>
        <span class="chip status-{{ c.status }}" [attr.data-testid]="'learning-status-' + c.id">{{ statusLabels[c.status] }}</span>
      </header>
      @if (c.description) {
        <p class="description" [attr.data-testid]="'learning-description-' + c.id">{{ c.description }}</p>
      }
      <div class="progress">
        <mat-progress-bar mode="determinate" [value]="c.progressPercent" [attr.aria-label]="'Milestone progress of ' + c.title" />
        <span [attr.data-testid]="'learning-progress-' + c.id">{{ c.milestonesDone }} / {{ c.milestonesTotal }} milestones · {{ c.progressPercent }}%</span>
      </div>
      <div class="meta">Added {{ c.createdAt | date: 'mediumDate' }}</div>

      <footer>
        <button mat-button type="button" [attr.aria-expanded]="expanded()" [attr.data-testid]="'learning-expand-' + c.id" (click)="expanded.set(!expanded())">
          <mat-icon>{{ expanded() ? 'expand_less' : 'expand_more' }}</mat-icon>
          {{ expanded() ? 'Hide details' : 'Milestones & notes' }}
        </button>
        <span class="spacer"></span>
        <button mat-icon-button type="button" matTooltip="Edit" [attr.aria-label]="'Edit ' + c.title" [attr.data-testid]="'learning-edit-' + c.id" (click)="edit.emit()">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button type="button" matTooltip="Delete" [attr.aria-label]="'Delete ' + c.title" [attr.data-testid]="'learning-delete-' + c.id" (click)="remove.emit()">
          <mat-icon>delete</mat-icon>
        </button>
      </footer>

      @if (expanded()) {
        <section class="details" [attr.data-testid]="'learning-details-' + c.id">
          <mat-form-field class="status-select" subscriptSizing="dynamic">
            <mat-label>Status</mat-label>
            <mat-select [value]="c.status" [attr.data-testid]="'learning-status-select-' + c.id" (valueChange)="setStatus($event)">
              @for (s of statuses; track s) {
                <mat-option [value]="s" [attr.data-testid]="'learning-status-select-' + c.id + '-' + s">{{ statusLabels[s] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <p class="hint">Status updates automatically when milestones change.</p>

          <h3>Milestones</h3>
          @if (c.milestones.length) {
            <ul class="rows">
              @for (m of c.milestones; track m.id) {
                <li class="row" [class.done]="m.done" [attr.data-testid]="'milestone-row-' + m.id">
                  <mat-checkbox
                    [checked]="m.done"
                    [disabled]="busy()"
                    [attr.data-testid]="'milestone-toggle-' + m.id"
                    [aria-label]="(m.done ? 'Mark not done: ' : 'Mark done: ') + m.title"
                    (change)="toggleMilestone(m)"
                  >
                    <span class="row-title" [attr.data-testid]="'milestone-title-' + m.id">{{ m.title }}</span>
                  </mat-checkbox>
                  @if (m.targetDate) {
                    <span class="target" [attr.data-testid]="'milestone-target-' + m.id">Target {{ m.targetDate | date: 'mediumDate' }}</span>
                  }
                  <span class="spacer"></span>
                  <button mat-icon-button type="button" [attr.aria-label]="'Remove milestone ' + m.title" [attr.data-testid]="'milestone-delete-' + m.id" [disabled]="busy()" (click)="deleteMilestone(m)">
                    <mat-icon>close</mat-icon>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="empty" [attr.data-testid]="'milestones-empty-' + c.id">No milestones yet. Break this resource into steps below.</p>
          }
          <form class="add-row" (submit)="$event.preventDefault(); addMilestone()">
            <mat-form-field subscriptSizing="dynamic" class="grow">
              <mat-label>New milestone</mat-label>
              <input matInput [value]="milestoneTitle()" (input)="milestoneTitle.set($any($event.target).value); milestoneError.set(null)" [attr.data-testid]="'milestone-input-' + c.id" />
            </mat-form-field>
            <mat-form-field subscriptSizing="dynamic" class="date">
              <mat-label>Target date</mat-label>
              <input matInput type="date" [value]="milestoneDate()" (input)="milestoneDate.set($any($event.target).value)" [attr.data-testid]="'milestone-date-' + c.id" />
            </mat-form-field>
            <button mat-stroked-button type="submit" [disabled]="busy()" [attr.data-testid]="'milestone-add-' + c.id">Add</button>
          </form>
          @if (milestoneError()) {
            <p class="error" role="alert" [attr.data-testid]="'milestone-input-error-' + c.id">{{ milestoneError() }}</p>
          }

          <h3>Notes</h3>
          @if (c.notes.length) {
            <ul class="rows">
              @for (n of c.notes; track n.id) {
                <li class="row note" [attr.data-testid]="'note-row-' + n.id">
                  <div class="note-body">
                    <span class="note-text" [attr.data-testid]="'note-text-' + n.id">{{ n.text }}</span>
                    <time class="note-time" [attr.datetime]="n.createdAt" [attr.data-testid]="'note-time-' + n.id">{{ n.createdAt | date: 'medium' }}</time>
                  </div>
                  <button mat-icon-button type="button" [attr.aria-label]="'Remove note'" [attr.data-testid]="'note-delete-' + n.id" [disabled]="busy()" (click)="deleteNote(n)">
                    <mat-icon>close</mat-icon>
                  </button>
                </li>
              }
            </ul>
          } @else {
            <p class="empty" [attr.data-testid]="'notes-empty-' + c.id">No notes yet.</p>
          }
          <form class="add-row" (submit)="$event.preventDefault(); addNote()">
            <mat-form-field subscriptSizing="dynamic" class="grow">
              <mat-label>New note</mat-label>
              <textarea matInput rows="2" [value]="noteText()" (input)="noteText.set($any($event.target).value); noteError.set(null)" [attr.data-testid]="'note-input-' + c.id"></textarea>
            </mat-form-field>
            <button mat-stroked-button type="submit" [disabled]="busy()" [attr.data-testid]="'note-add-' + c.id">Add note</button>
          </form>
          @if (noteError()) {
            <p class="error" role="alert" [attr.data-testid]="'note-input-error-' + c.id">{{ noteError() }}</p>
          }
        </section>
      }
    </article>
  `,
  styles: `
    .card { display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 12px; background: var(--mat-sys-surface-container-low, #f7f7f7); }
    .card.expanded { grid-column: 1 / -1; }
    header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .title { margin: 0; font-size: 18px; font-weight: 500; flex: 1 1 auto; overflow-wrap: anywhere; }
    .description { margin: 0; color: #555; font-size: 14px; overflow-wrap: anywhere; white-space: pre-line; }
    .chip { padding: 2px 10px; border-radius: 12px; background: #e8e8e8; font-size: 13px; }
    .status-IN_PROGRESS { background: #dbe7fb; }
    .status-COMPLETED { background: #d7f0dc; }
    .progress { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #555; }
    .meta { font-size: 12px; color: #777; }
    footer { display: flex; align-items: center; gap: 4px; }
    .spacer { flex: 1; }
    .details { border-top: 1px solid #e0e0e0; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
    .status-select { width: 200px; }
    .hint { margin: 0; font-size: 12px; color: #777; }
    h3 { margin: 8px 0 0; font-size: 15px; font-weight: 500; }
    .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
    .row { display: flex; align-items: center; gap: 8px; padding: 2px 4px; border-radius: 8px; background: #fff; }
    .row.done .row-title { text-decoration: line-through; opacity: .7; }
    .row-title { overflow-wrap: anywhere; }
    .target { font-size: 12px; color: #666; }
    .note { align-items: flex-start; padding: 8px; }
    .note-body { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .note-text { white-space: pre-line; overflow-wrap: anywhere; }
    .note-time { font-size: 12px; color: #777; }
    .empty { margin: 0; color: #777; font-size: 14px; }
    .add-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .add-row .grow { flex: 1 1 220px; }
    .add-row .date { width: 170px; }
    .error { margin: 0; color: var(--mat-sys-error, #b3261e); font-size: 13px; }
  `,
})
export class LearningCardComponent {
  private readonly api = inject(LearningApi);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly card = input.required<LearningCardResponse>();
  /** Emits the updated card after any change made inside this component. */
  readonly changed = output<LearningCardResponse>();
  readonly edit = output<void>();
  readonly remove = output<void>();

  readonly statuses = LEARNING_STATUSES;
  readonly statusLabels = LEARNING_STATUS_LABELS;

  readonly expanded = signal(false);
  readonly busy = signal(false);
  readonly milestoneTitle = signal('');
  readonly milestoneDate = signal('');
  readonly milestoneError = signal<string | null>(null);
  readonly noteText = signal('');
  readonly noteError = signal<string | null>(null);

  addMilestone(): void {
    const title = this.milestoneTitle().trim();
    if (!title) return this.milestoneError.set('Milestone title is required');
    if (title.length > MILESTONE_TITLE_MAX) return this.milestoneError.set(`Milestone title must be at most ${MILESTONE_TITLE_MAX} characters`);
    this.run(this.api.addMilestone(this.card().id, { title, targetDate: this.milestoneDate() || null }), 'Milestone added', () => {
      this.milestoneTitle.set('');
      this.milestoneDate.set('');
    });
  }

  toggleMilestone(m: MilestoneResponse): void {
    const id = this.card().id;
    const req = m.done ? this.api.uncompleteMilestone(id, m.id) : this.api.completeMilestone(id, m.id);
    this.run(req, m.done ? 'Milestone marked not done' : 'Milestone completed');
  }

  deleteMilestone(m: MilestoneResponse): void {
    this.run(this.reloadAfter(this.api.deleteMilestone(this.card().id, m.id)), 'Milestone removed');
  }

  addNote(): void {
    const text = this.noteText().trim();
    if (!text) return this.noteError.set('Note text is required');
    if (text.length > NOTE_TEXT_MAX) return this.noteError.set(`Note must be at most ${NOTE_TEXT_MAX} characters`);
    this.run(this.reloadAfter(this.api.addNote(this.card().id, { text })), 'Note added', () => this.noteText.set(''));
  }

  deleteNote(n: NoteResponse): void {
    this.run(this.reloadAfter(this.api.deleteNote(this.card().id, n.id)), 'Note removed');
  }

  setStatus(status: LearningStatus): void {
    const c = this.card();
    if (status === c.status) return;
    this.run(this.api.update(c.id, { title: c.title, description: c.description ?? null, status }), 'Status updated');
  }

  /** For endpoints that do not return the card (204 / note), fetch it again. */
  private reloadAfter(req: Observable<unknown>): Observable<LearningCardResponse> {
    return req.pipe(switchMap(() => this.api.get(this.card().id)));
  }

  private run(req: Observable<LearningCardResponse>, message: string, onSuccess?: () => void): void {
    this.busy.set(true);
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (card) => {
        this.busy.set(false);
        onSuccess?.();
        this.notify.info(message);
        this.changed.emit(card);
      },
      // The interceptor shows the error; refresh so the card is not stale.
      error: () => {
        this.busy.set(false);
        this.api.get(this.card().id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: (card) => this.changed.emit(card), error: () => {} });
      },
    });
  }
}
