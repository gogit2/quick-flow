import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Shown in place of a page's content until its first load succeeds: a loading bar, or an error with a retry
 * button. Keeps a failed load from looking like an empty list.
 */
@Component({
  selector: 'app-load-state',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    @if (failed()) {
      <div class="load-error" role="alert" [attr.data-testid]="'load-error-' + testid()">
        <mat-icon aria-hidden="true">cloud_off</mat-icon>
        <p>Could not load {{ what() }}.</p>
        <button mat-flat-button type="button" [attr.data-testid]="'load-error-' + testid() + '-retry'" (click)="retry.emit()">Retry</button>
      </div>
    } @else {
      <mat-progress-bar mode="indeterminate" [attr.aria-label]="'Loading ' + what()" [attr.data-testid]="'loading-' + testid()" />
    }
  `,
  styles: `
    .load-error { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; color: #666; text-align: center; }
    mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .6; }
    p { margin: 0; }
  `,
})
export class LoadStateComponent {
  /** Page key: renders `loading-<testid>` / `load-error-<testid>`. */
  readonly testid = input.required<string>();
  /** Plural noun for the message, e.g. "tasks". */
  readonly what = input.required<string>();
  readonly failed = input(false);
  readonly retry = output<void>();
}
