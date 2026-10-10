import { Injectable, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { SettingsApi } from '../api/settings-api.service';
import { DEFAULT_SETTINGS, SettingsRequest, SettingsResponse } from '../models/settings';
import { NotificationService } from '../notify/notification.service';

/**
 * The app's settings (D-51), loaded once and shared: the default-view redirect, the dashboard greeting (M08)
 * and the notification preferences of the start watcher (M06) all read it.
 */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly api = inject(SettingsApi);
  private readonly notify = inject(NotificationService);

  private readonly _settings = signal<SettingsResponse>(DEFAULT_SETTINGS);
  readonly settings = this._settings.asReadonly();
  private loading: Promise<SettingsResponse> | null = null;

  constructor() {
    // Keep the notification preferences in step with the saved settings.
    effect(() => {
      const s = this._settings();
      this.notify.prefs.set({ inApp: s.notificationsEnabled, browser: s.browserNotifications });
    });
  }

  /** Loads the settings once; later calls reuse the first request. Falls back to the defaults on error. */
  load(): Promise<SettingsResponse> {
    this.loading ??= firstValueFrom(this.api.get()).then(
      (s) => {
        this._settings.set(s);
        return s;
      },
      () => this._settings(),
    );
    return this.loading;
  }

  /** Saves and publishes the new settings; rejects with the HTTP error so the form can show it. */
  async save(body: SettingsRequest): Promise<SettingsResponse> {
    const saved = await firstValueFrom(this.api.update(body));
    this._settings.set(saved);
    this.loading = Promise.resolve(saved);
    return saved;
  }
}
