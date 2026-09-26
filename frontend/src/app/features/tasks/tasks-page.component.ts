import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-tasks-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Tasks" testid="tasks-title" />`,
})
export class TasksPageComponent {}
