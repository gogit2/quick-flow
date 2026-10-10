import { Injectable, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Notification preferences; defaults until the Settings page (M07) loads the saved values. */
export interface NotificationPrefs {
  /** In-app reminders such as "plan started" (`notificationsEnabled`). */
  inApp: boolean;
  /** Also show a browser Notification when permission is granted (`browserNotifications`). */
  browser: boolean;
}

/** In-app notifications (snackbar) plus optional browser notifications (D-46). */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  readonly prefs = signal<NotificationPrefs>({ inApp: true, browser: false });

  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 4000 });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 6000, panelClass: 'snack-error' });
  }

  /** A reminder (e.g. a plan's start): snackbar if in-app reminders are on, browser Notification if also allowed. */
  remind(message: string): void {
    const prefs = this.prefs();
    if (!prefs.inApp) return;
    this.snackBar.open(message, 'OK', { duration: 10000, panelClass: 'snack-reminder' });
    if (prefs.browser && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('QuickFlow', { body: message });
      } catch {
        // Some browsers only allow notifications from a service worker; the snackbar is enough.
      }
    }
  }
}
