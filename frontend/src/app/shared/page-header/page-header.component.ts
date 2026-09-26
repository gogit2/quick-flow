import { Component, input } from '@angular/core';

/** Page title (`<h1>`) with a slot for header actions. */
@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <h1 [attr.data-testid]="testid()">{{ heading() }}</h1>
      <div class="actions"><ng-content /></div>
    </header>
  `,
  styles: `
    .page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 28px; font-weight: 400; }
    .actions { display: flex; gap: 8px; align-items: center; }
  `,
})
export class PageHeaderComponent {
  readonly heading = input.required<string>();
  readonly testid = input('page-title');
}
