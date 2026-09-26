export interface NavItem {
  path: string;
  label: string;
  icon: string;
  testid: string;
}

/** The six PRD pages, in navigation order. */
export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: 'dashboard', testid: 'nav-dashboard' },
  { path: '/tasks', label: 'Tasks', icon: 'check_circle', testid: 'nav-tasks' },
  { path: '/habits', label: 'Habits', icon: 'repeat', testid: 'nav-habits' },
  { path: '/learning', label: 'Learning Resources', icon: 'school', testid: 'nav-learning' },
  { path: '/plans', label: 'Todo Plans', icon: 'event_note', testid: 'nav-plans' },
  { path: '/settings', label: 'Settings', icon: 'settings', testid: 'nav-settings' },
];
