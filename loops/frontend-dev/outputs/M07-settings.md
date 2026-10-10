# M07: Settings page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
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
- [x] M07-T01 Settings models + `SettingsApi` + `SettingsStore`. Files: `core/models/settings.ts`, `core/api/settings-api.service.ts`, `core/settings/settings.store.ts` (load once, defaults on error, syncs NotificationService.prefs)
- [x] M07-T02 Settings form (validators, save, success snackbar, backend errors). Files: `features/settings/settings-page.component.ts` (slide toggles, permission request + denied hint, "Saved" mark)
- [x] M07-T03 Default view redirect at app start; NotificationService/start watcher honour notification settings. Files: `core/settings/default-view.guard.ts`, `app.routes.ts` (root route guard), `layout/shell.component.ts` (loads settings at start)
- [x] M07-T04 Write scenario file `outputs/e2e/M07-settings.md` (§4; adds S4 permission and S5 reminders-off checks)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: Settings shows defaults (Friend, notifications on, browser off, Dashboard); change name → save → reload keeps it | UX Settings, D-51 | e2e S1 |
| A2 | S2: set default view = Tasks → navigate to app root → Tasks page opens; reset to Dashboard | D-51 | e2e S2 |
| A3 | S3: empty display name shows required error, save blocked | A-10 | e2e S3 |
| A4 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M06 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T19:21:32+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M07-settings.md` S1–S5 with Playwright MCP; regression on a second fresh backend; servers stopped. The trial was paused once at S1.2 at the user's request and resumed with the same servers and data.
- A1 S1 ✅ (defaults Friend / in-app on / browser off / Dashboard; "Sam 1010" saved → "Saved" + snackbar, GET then PUT 200; kept after reload) · A2 S2 ✅ (start page Tasks → full load of / opens /tasks; back to Dashboard → / opens /dashboard) · A3 S3 ✅ (empty → "Display name is required"; exactly 101 chars → "at most 100 characters"; no PUT either time; reload keeps "Sam 1010") · S4 ✅ (browser toggle → permission requested, headless Chromium returned "denied" → hint shown, toggle back off) · S5 ✅ (in-app off saved (`notificationsEnabled:false`); plan starting 19:20:00 → at 19:20:10: no "has started" snackbar, plan In progress with Started badge, `qf.notifiedPlans` = [1]; in-app back on, saved) · A4 ✅ no console errors, no 4xx/5xx
- Notes: S5.2 created the setup task with curl (scenario file says so). The first 47 s wait in S5.3 returned at 19:19:52, before the start time, so it was followed by a 14 s wait and the check at 19:20:10. This was test timing; the app was not changed.
- Regression (fresh backend): M01 S1 ✅ (7 navigations, `/` → /dashboard with default settings), M02 S1 ✅, M03 S1 ✅, M04 S1 ✅, M05 S1 ✅ (plan from the three UI-created sources: In progress, 0 / 3), M06 S1 ✅ (33% → 67% → 100%, Completed group, History row 3 / 3 · 100%)
- Evidence: `evidence/M07/trial-1/M07-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
