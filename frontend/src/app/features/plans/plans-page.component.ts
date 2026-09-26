import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-plans-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Todo Plans" testid="plans-title" />`,
})
export class PlansPageComponent {}
