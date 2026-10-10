import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PlanStartWatcher } from '../core/notify/plan-start-watcher.service';
import { NAV_ITEMS } from './nav-items';

/** App shell: persistent side navigation + top bar. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatListModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="topbar">
      <span class="brand" data-testid="app-brand">QuickFlow</span>
    </mat-toolbar>
    <mat-sidenav-container class="container">
      <mat-sidenav mode="side" opened class="sidenav" data-testid="app-nav">
        <nav aria-label="Main navigation">
          <mat-nav-list>
            @for (item of navItems; track item.path) {
              <a mat-list-item [routerLink]="item.path" routerLinkActive="active-link"
                 #rla="routerLinkActive" [activated]="rla.isActive"
                 [attr.data-testid]="item.testid" [attr.aria-label]="item.label">
                <mat-icon matListItemIcon aria-hidden="true">{{ item.icon }}</mat-icon>
                <span matListItemTitle>{{ item.label }}</span>
              </a>
            }
          </mat-nav-list>
        </nav>
      </mat-sidenav>
      <mat-sidenav-content>
        <main class="content">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host { display: flex; flex-direction: column; height: 100vh; }
    .topbar { flex: 0 0 auto; }
    .brand { font-weight: 500; letter-spacing: .5px; }
    .container { flex: 1 1 auto; }
    .sidenav { width: 230px; }
    .content { padding: 24px; max-width: 1200px; }
  `,
})
export class ShellComponent {
  readonly navItems = NAV_ITEMS;

  constructor() {
    // Plan start notifications work on every page (D-46).
    inject(PlanStartWatcher).start();
  }
}
