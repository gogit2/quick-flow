import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DEFAULT_VIEW_PATHS } from '../models/settings';
import { SettingsStore } from './settings.store';

/** The app root opens the page chosen in Settings (D-51); Dashboard if the settings cannot be read. */
export const defaultViewGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const settings = await inject(SettingsStore).load();
  return router.parseUrl(DEFAULT_VIEW_PATHS[settings.defaultView] ?? '/dashboard');
};
