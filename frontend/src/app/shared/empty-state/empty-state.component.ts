import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/** Empty list placeholder that points to the page's add action. */
@Component({
  selector: 'app-empty-state',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="empty-state" [attr.data-testid]="testid()">
      <mat-icon aria-hidden="true">{{ icon() }}</mat-icon>
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <button mat-flat-button type="button" [attr.data-testid]="testid() + '-action'" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
  styles: `
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 16px; color: #666; text-align: center; }
    mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .6; }
  `,
})
export class EmptyStateComponent {
  readonly testid = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input<string>();
  readonly icon = input('inbox');
  readonly action = output<void>();
}
