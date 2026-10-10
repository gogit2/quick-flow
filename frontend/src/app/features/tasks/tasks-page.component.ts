import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, Subject, catchError, debounceTime, distinctUntilChanged, filter, of, switchMap } from 'rxjs';
import { TaskApi } from '../../core/api/task-api.service';
import {
  SortDir,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TaskPriority,
  TaskQuery,
  TaskResponse,
  TaskSort,
  TaskStatus,
} from '../../core/models/task';
import { NotificationService } from '../../core/notify/notification.service';
import { isoLocalDate } from '../../core/time/local-date';
import { confirmDialog } from '../../shared/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { LoadStateComponent } from '../../shared/load-state/load-state.component';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { TaskFormDialogComponent, TaskFormDialogData } from './task-form-dialog.component';

type DueFilter = '' | 'today' | 'next7' | 'past';

interface SortOption {
  value: string;
  label: string;
  sort: TaskSort;
  dir: SortDir;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'createdAt-desc', label: 'Newest first', sort: 'createdAt', dir: 'desc' },
  { value: 'createdAt-asc', label: 'Oldest first', sort: 'createdAt', dir: 'asc' },
  { value: 'dueDate-asc', label: 'Due date (soonest)', sort: 'dueDate', dir: 'asc' },
  { value: 'dueDate-desc', label: 'Due date (latest)', sort: 'dueDate', dir: 'desc' },
];

@Component({
  selector: 'app-tasks-page',
  imports: [
    DatePipe,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadStateComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  template: `
    <app-page-header heading="Tasks" testid="tasks-title">
      <button mat-flat-button type="button" data-testid="task-add-btn" (click)="openForm(null)">
        <mat-icon>add</mat-icon> Add Task
      </button>
    </app-page-header>

    <div class="toolbar">
      <mat-form-field class="search" subscriptSizing="dynamic">
        <mat-label>Search by title</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput type="search" data-testid="task-search" [value]="searchText()" (input)="onSearch($any($event.target).value)" />
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Status</mat-label>
        <mat-select data-testid="task-filter-status" [value]="status()" (valueChange)="status.set($event)">
          <mat-option value="" data-testid="task-filter-status-ALL">All statuses</mat-option>
          @for (s of statuses; track s) {
            <mat-option [value]="s" [attr.data-testid]="'task-filter-status-' + s">{{ statusLabels[s] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Priority</mat-label>
        <mat-select data-testid="task-filter-priority" [value]="priority()" (valueChange)="priority.set($event)">
          <mat-option value="" data-testid="task-filter-priority-ALL">All priorities</mat-option>
          @for (p of priorities; track p) {
            <mat-option [value]="p" [attr.data-testid]="'task-filter-priority-' + p">{{ priorityLabels[p] }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Due</mat-label>
        <mat-select data-testid="task-filter-due" [value]="due()" (valueChange)="due.set($event)">
          <mat-option value="" data-testid="task-filter-due-ALL">Any due date</mat-option>
          <mat-option value="today" data-testid="task-filter-due-today">Due today</mat-option>
          <mat-option value="next7" data-testid="task-filter-due-next7">Due in the next 7 days</mat-option>
          <mat-option value="past" data-testid="task-filter-due-past">Due before today</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field subscriptSizing="dynamic">
        <mat-label>Sort</mat-label>
        <mat-select data-testid="task-sort" [value]="sort()" (valueChange)="sort.set($event)">
          @for (o of sortOptions; track o.value) {
            <mat-option [value]="o.value" [attr.data-testid]="'task-sort-' + o.value">{{ o.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-button-toggle-group
        hideSingleSelectionIndicator
        aria-label="Task view"
        [value]="archived() ? 'archived' : 'active'"
        (change)="archived.set($event.value === 'archived')"
      >
        <mat-button-toggle value="active" data-testid="task-show-active">Active</mat-button-toggle>
        <mat-button-toggle value="archived" data-testid="task-show-archived">Archived</mat-button-toggle>
      </mat-button-toggle-group>
      @if (hasFilters()) {
        <button mat-button type="button" data-testid="task-clear-filters" (click)="clearFilters()">Clear filters</button>
      }
    </div>

    @if (tasks(); as list) {
      @if (list.length) {
        <ul class="task-list" data-testid="task-list">
          @for (t of list; track t.id) {
            <li class="task-row" [class.done]="t.status === 'DONE'" [attr.data-testid]="'task-row-' + t.id">
              <div class="main">
                <span class="title" [attr.data-testid]="'task-title-' + t.id">{{ t.title }}</span>
                @if (t.description) {
                  <span class="description">{{ t.description }}</span>
                }
                <div class="meta">
                  <span class="chip status-{{ t.status }}" [attr.data-testid]="'task-status-' + t.id">{{ statusLabels[t.status] }}</span>
                  <span class="chip priority-{{ t.priority }}" [attr.data-testid]="'task-priority-' + t.id">{{ priorityLabels[t.priority] }} priority</span>
                  @if (t.dueDate) {
                    <span class="due" [attr.data-testid]="'task-due-' + t.id">Due {{ t.dueDate | date: 'mediumDate' }}</span>
                  }
                  @if (t.overdue) {
                    <span class="chip overdue" [attr.data-testid]="'task-overdue-' + t.id">Overdue</span>
                  }
                </div>
              </div>
              <div class="actions">
                @if (!t.archived) {
                  @if (t.status !== 'DONE') {
                    <button mat-icon-button type="button" matTooltip="Mark complete" [attr.aria-label]="'Complete ' + t.title" [attr.data-testid]="'task-complete-' + t.id" (click)="complete(t)">
                      <mat-icon>check_circle</mat-icon>
                    </button>
                  }
                  <button mat-icon-button type="button" matTooltip="Edit" [attr.aria-label]="'Edit ' + t.title" [attr.data-testid]="'task-edit-' + t.id" (click)="openForm(t)">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button type="button" matTooltip="Archive" [attr.aria-label]="'Archive ' + t.title" [attr.data-testid]="'task-archive-' + t.id" (click)="archive(t)">
                    <mat-icon>archive</mat-icon>
                  </button>
                } @else {
                  <button mat-icon-button type="button" matTooltip="Restore" [attr.aria-label]="'Restore ' + t.title" [attr.data-testid]="'task-restore-' + t.id" (click)="restore(t)">
                    <mat-icon>unarchive</mat-icon>
                  </button>
                }
                <button mat-icon-button type="button" matTooltip="Delete" [attr.aria-label]="'Delete ' + t.title" [attr.data-testid]="'task-delete-' + t.id" (click)="remove(t)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </li>
          }
        </ul>
      } @else if (hasFilters()) {
        <app-empty-state testid="tasks-no-match" icon="search_off" message="No tasks match your search and filters." actionLabel="Clear filters" (action)="clearFilters()" />
      } @else if (archived()) {
        <app-empty-state testid="empty-state-tasks-archived" icon="archive" message="No archived tasks." />
      } @else {
        <app-empty-state testid="empty-state-tasks" icon="task_alt" message="No tasks yet. Add your first task to get started." actionLabel="Add Task" (action)="openForm(null)" />
      }
    } @else {
      <app-load-state testid="tasks" what="tasks" [failed]="loadFailed()" (retry)="reload()" />
    }
  `,
  styles: `
    .toolbar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
    .toolbar .search { flex: 1 1 240px; }
    .toolbar mat-form-field:not(.search) { width: 170px; }
    .task-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .task-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: var(--mat-sys-surface-container-low, #f7f7f7); }
    .task-row.done .title { text-decoration: line-through; opacity: .7; }
    .main { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
    .title { font-weight: 500; overflow-wrap: anywhere; }
    .description { color: #666; font-size: 14px; overflow-wrap: anywhere; }
    .meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; font-size: 13px; }
    .chip { padding: 2px 10px; border-radius: 12px; background: #e8e8e8; }
    .status-DONE { background: #d7f0dc; }
    .status-IN_PROGRESS { background: #dbe7fb; }
    .priority-HIGH { background: #fde2d6; }
    .priority-LOW { background: #eef0f2; }
    .overdue { background: #b3261e; color: #fff; }
    .due { color: #555; }
    .actions { display: flex; flex-shrink: 0; }
  `,
})
export class TasksPageComponent {
  private readonly api = inject(TaskApi);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly statuses = TASK_STATUSES;
  readonly priorities = TASK_PRIORITIES;
  readonly statusLabels = TASK_STATUS_LABELS;
  readonly priorityLabels = TASK_PRIORITY_LABELS;
  readonly sortOptions = SORT_OPTIONS;

  readonly searchText = signal('');
  private readonly search = signal('');
  readonly status = signal<TaskStatus | ''>('');
  readonly priority = signal<TaskPriority | ''>('');
  readonly due = signal<DueFilter>('');
  readonly sort = signal(SORT_OPTIONS[0].value);
  readonly archived = signal(false);
  private readonly refresh = signal(0);

  /** null until the first response, so the empty state does not flash. */
  readonly tasks = signal<TaskResponse[] | null>(null);
  readonly loadFailed = signal(false);

  readonly hasFilters = computed(() => !!(this.search() || this.status() || this.priority() || this.due()));

  private readonly query = computed<TaskQuery>(() => {
    this.refresh();
    const sort = SORT_OPTIONS.find((o) => o.value === this.sort()) ?? SORT_OPTIONS[0];
    return {
      q: this.search() || undefined,
      status: this.status() || undefined,
      priority: this.priority() || undefined,
      ...dueRange(this.due()),
      archived: this.archived() || undefined,
      sort: sort.sort,
      dir: sort.dir,
    };
  });

  private readonly searchInput = new Subject<string>();

  constructor() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((text) => this.search.set(text.trim()));

    toObservable(this.query)
      .pipe(
        switchMap((q) =>
          this.api.list(q).pipe(
            catchError(() => {
              this.loadFailed.set(true);
              return of(null);
            }),
          ),
        ),
        filter((list): list is TaskResponse[] => list !== null),
        takeUntilDestroyed(),
      )
      .subscribe((list) => {
        this.loadFailed.set(false);
        this.tasks.set(list);
      });
  }

  onSearch(text: string): void {
    this.searchText.set(text);
    this.searchInput.next(text);
  }

  clearFilters(): void {
    this.searchText.set('');
    this.searchInput.next('');
    this.search.set('');
    this.status.set('');
    this.priority.set('');
    this.due.set('');
  }

  openForm(task: TaskResponse | null): void {
    this.dialog
      .open<TaskFormDialogComponent, TaskFormDialogData, TaskResponse>(TaskFormDialogComponent, { data: { task }, autoFocus: 'first-tabbable' })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.notify.info(task ? 'Task updated' : 'Task created');
          this.reload();
        }
      });
  }

  complete(t: TaskResponse): void {
    this.mutate(this.api.complete(t.id), 'Task completed');
  }

  archive(t: TaskResponse): void {
    this.mutate(this.api.archive(t.id), 'Task archived');
  }

  restore(t: TaskResponse): void {
    this.mutate(this.api.restore(t.id), 'Task restored');
  }

  remove(t: TaskResponse): void {
    confirmDialog(this.dialog, {
      title: 'Delete task?',
      message: `"${t.title}" will be permanently deleted.`,
      confirmLabel: 'Delete',
    }).subscribe((ok) => {
      if (ok) this.mutate(this.api.delete(t.id), 'Task deleted');
    });
  }

  private mutate(req: Observable<unknown>, message: string): void {
    req.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify.info(message);
        this.reload();
      },
      // Errors are shown by the interceptor; reload in case the row is stale (e.g. 404).
      error: () => this.reload(),
    });
  }

  reload(): void {
    this.loadFailed.set(false);
    this.refresh.update((n) => n + 1);
  }
}

function dueRange(due: DueFilter): Pick<TaskQuery, 'dueDate' | 'dueFrom' | 'dueTo'> {
  switch (due) {
    case 'today':
      return { dueDate: isoLocalDate() };
    case 'next7':
      return { dueFrom: isoLocalDate(), dueTo: isoLocalDate(new Date(), 6) };
    case 'past':
      return { dueTo: isoLocalDate(new Date(), -1) };
    default:
      return {};
  }
}
