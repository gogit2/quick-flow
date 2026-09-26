import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-learning-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Learning Resources" testid="learning-title" />`,
})
export class LearningPageComponent {}
