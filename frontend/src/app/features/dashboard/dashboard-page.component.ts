import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Dashboard" testid="dashboard-title" />`,
})
export class DashboardPageComponent {}
