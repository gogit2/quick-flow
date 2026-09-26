import { Component } from '@angular/core';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-settings-page',
  imports: [PageHeaderComponent],
  template: `<app-page-header heading="Settings" testid="settings-title" />`,
})
export class SettingsPageComponent {}
