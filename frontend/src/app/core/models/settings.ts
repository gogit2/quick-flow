/** Mirrors `SettingsRequest` / `SettingsResponse` in openapi.json (D-51, A-02, A-10). */
export type DefaultView = 'DASHBOARD' | 'TASKS' | 'HABITS' | 'LEARNING' | 'PLANS' | 'SETTINGS';

export const DEFAULT_VIEWS: DefaultView[] = ['DASHBOARD', 'TASKS', 'HABITS', 'LEARNING', 'PLANS', 'SETTINGS'];
export const DEFAULT_VIEW_LABELS: Record<DefaultView, string> = {
  DASHBOARD: 'Dashboard',
  TASKS: 'Tasks',
  HABITS: 'Habits',
  LEARNING: 'Learning Resources',
  PLANS: 'Todo Plans',
  SETTINGS: 'Settings',
};
/** Route of each default view. */
export const DEFAULT_VIEW_PATHS: Record<DefaultView, string> = {
  DASHBOARD: '/dashboard',
  TASKS: '/tasks',
  HABITS: '/habits',
  LEARNING: '/learning',
  PLANS: '/plans',
  SETTINGS: '/settings',
};

/** Same limit as the backend validation (A-10). */
export const DISPLAY_NAME_MAX = 100;

export interface SettingsRequest {
  displayName: string;
  notificationsEnabled?: boolean;
  browserNotifications?: boolean;
  defaultView?: DefaultView;
}

export interface SettingsResponse {
  displayName: string;
  notificationsEnabled: boolean;
  browserNotifications: boolean;
  defaultView: DefaultView;
}

/** D-51 defaults, used until the server answers (or if it cannot be reached). */
export const DEFAULT_SETTINGS: SettingsResponse = {
  displayName: 'Friend',
  notificationsEnabled: true,
  browserNotifications: false,
  defaultView: 'DASHBOARD',
};
