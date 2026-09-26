# M07: Settings page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
| Depends on | M01, backend-dev:M07 |
| Stories | (none; UX Settings Page) |
| Requirements | UX Settings Page, D-51 |

## 1. Spec (what and why)
The Settings page: profile (display name) and preferences (in-app notifications on/off, browser notifications on/off with permission request, default view). Saved via `PUT /settings`. At app start the app opens `defaultView` (D-51). The notification settings drive the M06 start watcher.

## 2. Design notes (how)
- Contract: `SettingsRequest/Response`; `GET/PUT /api/v1/settings`. `defaultView` enum `DASHBOARD, TASKS, HABITS, LEARNING, PLANS, SETTINGS` (A-02) → routes.
- Validators: displayName required, trimmed, ≤ 100 (A-10).
- `SettingsStore` (signal) loaded once at bootstrap; root route guard/redirect navigates to defaultView only on the initial `''` navigation.
- Turning browser notifications on calls `Notification.requestPermission()`; if denied, show a hint and keep in-app only.
- testids: `settings-display-name`, `settings-notifications`, `settings-browser-notifications`, `settings-default-view`, `settings-save`, `settings-saved`.

## 3. Tasks
- [ ] M07-T01 Settings models + `SettingsApi` + `SettingsStore`
- [ ] M07-T02 Settings form (validators, save, success snackbar, backend errors)
- [ ] M07-T03 Default view redirect at app start; NotificationService/start watcher honour notification settings
- [ ] M07-T04 Write scenario file `outputs/e2e/M07-settings.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: Settings shows defaults (Friend, notifications on, browser off, Dashboard); change name → save → reload keeps it | UX Settings, D-51 | e2e S1 |
| A2 | S2: set default view = Tasks → navigate to app root → Tasks page opens; reset to Dashboard | D-51 | e2e S2 |
| A3 | S3: empty display name shows required error, save blocked | A-10 | e2e S3 |
| A4 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M06 smoke.

## 5. Verification trials

## 6. Notes / Blocked
