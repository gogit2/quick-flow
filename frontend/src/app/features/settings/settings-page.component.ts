import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { asProblemDetail } from '../../core/models/problem-detail';
import { DEFAULT_VIEWS, DEFAULT_VIEW_LABELS, DISPLAY_NAME_MAX, DefaultView, SettingsResponse } from '../../core/models/settings';
import { NotificationService } from '../../core/notify/notification.service';
import { SettingsStore } from '../../core/settings/settings.store';
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

type BrowserPermission = NotificationPermission | 'unsupported';

@Component({
  selector: 'app-settings-page',
  imports: [PageHeaderComponent, ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule],
  template: `
    <app-page-header heading="Settings" testid="settings-title" />

    @if (loaded()) {
      <form class="settings" [formGroup]="form" (ngSubmit)="save()" novalidate data-testid="settings-form">
        <section>
          <h2>Profile</h2>
          <mat-form-field class="name">
            <mat-label>Display name</mat-label>
            <input matInput formControlName="displayName" data-testid="settings-display-name" />
            <mat-hint>Used in the dashboard greeting.</mat-hint>
            @if (form.controls.displayName.hasError('required')) {
              <mat-error data-testid="settings-display-name-error">Display name is required</mat-error>
            } @else if (form.controls.displayName.hasError('maxlength')) {
              <mat-error data-testid="settings-display-name-error">Display name must be at most {{ nameMax }} characters</mat-error>
            } @else if (form.controls.displayName.hasError('server')) {
              <mat-error data-testid="settings-display-name-error">{{ form.controls.displayName.getError('server') }}</mat-error>
            }
          </mat-form-field>
        </section>

        <section>
          <h2>Notifications</h2>
          <mat-slide-toggle formControlName="notificationsEnabled" data-testid="settings-notifications">
            In-app reminders (e.g. when a plan starts)
          </mat-slide-toggle>
          <mat-slide-toggle formControlName="browserNotifications" data-testid="settings-browser-notifications" (change)="onBrowserToggle($event)">
            Also show browser notifications
          </mat-slide-toggle>
          @if (permission() === 'denied' || permission() === 'unsupported') {
            <p class="hint" role="status" data-testid="settings-browser-denied">
              <mat-icon aria-hidden="true">info</mat-icon>
              {{ permission() === 'unsupported' ? 'This browser does not support notifications.' : 'Browser notifications are blocked for this site.' }}
              In-app reminders still work.
            </p>
          }
        </section>

        <section>
          <h2>Start page</h2>
          <mat-form-field>
            <mat-label>Open at start</mat-label>
            <mat-select formControlName="defaultView" data-testid="settings-default-view">
              @for (v of views; track v) {
                <mat-option [value]="v" [attr.data-testid]="'settings-default-view-' + v">{{ viewLabels[v] }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </section>

        @if (formError()) {
          <p class="error" role="alert" data-testid="settings-error">{{ formError() }}</p>
        }
        <div class="actions">
          <button mat-flat-button type="submit" [disabled]="saving()" data-testid="settings-save">Save</button>
          @if (savedAt()) {
            <span class="saved" role="status" data-testid="settings-saved"><mat-icon aria-hidden="true">check</mat-icon> Saved</span>
          }
        </div>
      </form>
    }
  `,
  styles: `
    .settings { display: flex; flex-direction: column; gap: 20px; max-width: 560px; }
    section { display: flex; flex-direction: column; gap: 10px; }
    h2 { margin: 0; font-size: 18px; font-weight: 500; }
    .name { width: 100%; }
    .hint { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 13px; color: #8a5300; }
    .hint mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .error { color: var(--mat-sys-error, #b3261e); margin: 0; }
    .actions { display: flex; align-items: center; gap: 12px; }
    .saved { display: inline-flex; align-items: center; gap: 4px; color: #1e7e34; }
  `,
})
export class SettingsPageComponent {
  private readonly store = inject(SettingsStore);
  private readonly notify = inject(NotificationService);

  readonly views = DEFAULT_VIEWS;
  readonly viewLabels = DEFAULT_VIEW_LABELS;
  readonly nameMax = DISPLAY_NAME_MAX;

  readonly loaded = signal(false);
  readonly saving = signal(false);
  readonly savedAt = signal<number | null>(null);
  readonly formError = signal<string | null>(null);
  readonly permission = signal<BrowserPermission>(currentPermission());

  readonly form = inject(FormBuilder).nonNullable.group({
    displayName: ['', [Validators.required, Validators.maxLength(DISPLAY_NAME_MAX), notBlank]],
    notificationsEnabled: [true],
    browserNotifications: [false],
    defaultView: ['DASHBOARD' as DefaultView],
  });

  constructor() {
    this.store.load().then((s) => {
      this.fill(s);
      this.loaded.set(true);
    });
    // Editing again hides the "Saved" mark.
    this.form.valueChanges.subscribe(() => this.savedAt.set(null));
  }

  /** Turning browser notifications on asks for permission; if it is not granted, the toggle goes back off. */
  async onBrowserToggle(event: MatSlideToggleChange): Promise<void> {
    if (!event.checked) return;
    if (typeof Notification === 'undefined') {
      this.permission.set('unsupported');
      this.form.controls.browserNotifications.setValue(false);
      return;
    }
    const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    this.permission.set(result);
    if (result !== 'granted') this.form.controls.browserNotifications.setValue(false);
  }

  async save(): Promise<void> {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    try {
      const saved = await this.store.save({ ...v, displayName: v.displayName.trim() });
      this.fill(saved);
      this.savedAt.set(Date.now());
      this.notify.info('Settings saved');
    } catch (err) {
      this.showServerErrors(err);
    } finally {
      this.saving.set(false);
    }
  }

  private fill(s: SettingsResponse): void {
    this.form.setValue(
      { displayName: s.displayName, notificationsEnabled: s.notificationsEnabled, browserNotifications: s.browserNotifications, defaultView: s.defaultView },
      { emitEvent: false },
    );
    this.form.markAsPristine();
  }

  private showServerErrors(err: unknown): void {
    const pd = err instanceof HttpErrorResponse ? asProblemDetail(err.error) : null;
    const unmatched: string[] = [];
    for (const [field, message] of Object.entries(pd?.errors ?? {})) {
      const control = this.form.get(field);
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: message });
        control.markAsTouched();
      } else {
        unmatched.push(message);
      }
    }
    if (unmatched.length) this.formError.set(unmatched.join('. '));
  }
}

function currentPermission(): BrowserPermission {
  return typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
}

/** The backend rejects whitespace-only names as blank. */
function notBlank(control: { value: string }) {
  return control.value && !control.value.trim() ? { required: true } : null;
}
