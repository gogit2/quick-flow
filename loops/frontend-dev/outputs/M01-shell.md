# M01: App shell

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | backend-dev:M01 |
| Stories | (none; enables all) |
| Requirements | PRD §4, UX Main Navigation, DoD "six pages reachable" |

## 1. Spec (what and why)
An Angular 19 + Material app in `frontend/` with a persistent side nav linking the six pages (Dashboard, Tasks, Habits, Learning Resources, Todo Plans, Settings), each a lazy placeholder with an `<h1>`. Core plumbing every feature needs: `/api` proxy to :8080, ProblemDetail error interceptor, NowService (1 s `now` signal), NotificationService skeleton, shared empty-state and confirm-dialog components. No feature logic.

## 2. Design notes (how)
- Create with the stack profile commands (`ng new frontend --style=scss --routing --ssr=false --skip-git --defaults`, `ng add @angular/material`).
- `proxy.conf.json` `/api` → `http://localhost:8080`; wire it in `angular.json` serve options. Base URL constant `/api/v1` (D-05).
- `core/http/error.interceptor.ts`: ProblemDetail → snackbar for non-field errors; rethrow so forms can map field errors (`errors`/`fieldErrors` as in the contract).
- `core/time/now.service.ts` (D-45), `core/notify/notification.service.ts` (snackbar now; browser Notification added in M06).
- `shared/empty-state` (inputs: testid, message, action label; output: action), `shared/confirm-dialog`, `shared/page-header`.
- Routes: `/dashboard`, `/tasks`, `/habits`, `/learning`, `/plans`, `/settings`; `''` → `/dashboard` (defaultView added in M07).
- testids: `nav-dashboard`, `nav-tasks`, `nav-habits`, `nav-learning`, `nav-plans`, `nav-settings`.

## 3. Tasks
- [x] M01-T01 Scaffold `frontend/` (Angular 19, Material, SCSS), `proxy.conf.json`, `ng build` green
  - `frontend/` via ng new + ng add material (azure-blue prebuilt theme); added `@angular/animations`; `angular.json` serve.options.proxyConfig; initial budget raised to 1MB warn / 2MB error.
- [x] M01-T02 Layout shell: side nav + toolbar, six nav links with testids and accessible names, placeholder pages with `<h1>`
  - `layout/shell.component.ts`, `layout/nav-items.ts`, `app.component.ts`, `app.routes.ts` (lazy routes, '' and '**' → dashboard), `features/*/<page>-page.component.ts`.
- [x] M01-T03 Core: API base, error interceptor (ProblemDetail), NowService, NotificationService skeleton
  - `core/api/api.config.ts` (API_BASE), `core/models/problem-detail.ts`, `core/http/error.interceptor.ts` (snackbar unless field `errors`; rethrows), `core/time/now.service.ts`, `core/notify/notification.service.ts`; wired in `app.config.ts`.
- [x] M01-T04 Shared: empty-state, confirm-dialog, page-header components
  - `shared/empty-state` (testid, message, actionLabel, icon → `action`; button testid `<testid>-action`), `shared/confirm-dialog` (+ `confirmDialog()` helper; `confirm-ok`/`confirm-cancel`), `shared/page-header` (input `heading`, `testid`).
- [x] M01-T05 Write scenario file `outputs/e2e/M01-shell.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | `npx ng build` succeeds | build | command |
| A2 | S1 [smoke]: each of the six nav links opens a page whose `<h1>` equals the page name, nav stays visible | PRD §4, UX nav | `outputs/e2e/M01-shell.md` S1 |
| A3 | Unknown route / root redirects to Dashboard; no console errors, no 5xx | shell | S1 |

Regression: none (first milestone).

## 5. Verification trials
### Trial 1 (2026-09-26T20:27+03:00): PASS
- A1 `cd frontend && npx ng build`: ✅ (bundle generation complete)
- Stack: `scripts/backend.sh start-stable --fresh`, `scripts/frontend.sh start`; Playwright MCP.
- A2 S1.1–S1.7: ✅ every nav link opens its page, h1 = page name, nav stays visible, active link highlighted.
- A3 S1.1 root → /dashboard ✅, S1.8 /does-not-exist → /dashboard ✅; console: no errors; network: no 5xx.
- Evidence: `outputs/evidence/M01/trial-1/M01-trial-1-final.png`; results table in `outputs/e2e/M01-shell.md`.

## 6. Notes / Blocked
