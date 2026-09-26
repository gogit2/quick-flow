import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-habits-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Habits" testid="habits-title" />`,
})
export class HabitsPageComponent {}
