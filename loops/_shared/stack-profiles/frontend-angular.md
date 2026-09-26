# Stack profile: Frontend (Angular)

The frontend loop uses this profile. To reuse the loop on another stack, copy this file, change it, and point `task.md` at the copy.

## Toolchain (checked on this machine)
- **Node 18.20** → use **Angular 19** (Angular 20+ needs Node ≥ 20.19). Angular CLI 19 is installed globally (`ng`).
- **Angular Material 19** for components, SCSS styles.
- Project root: `frontend/`. Create it with:
  `ng new frontend --style=scss --routing --ssr=false --skip-git --defaults`, then `ng add @angular/material --defaults --skip-confirmation`.

## Architecture
```
frontend/src/app
├── core/
│   ├── api/          one typed service per backend tag (TaskApi, HabitApi, ...), models from openapi.json
│   ├── models/       TS interfaces/enums mirroring the Swagger schemas EXACTLY (names, enum values)
│   ├── time/         NowService: a `now` signal ticking every 1s (shared by all countdowns)
│   └── notify/       NotificationService (snackbar + optional browser Notification API)
├── shared/           empty-state, confirm-dialog, progress-bar/ring, rest-time pipe, page-header
├── features/<page>/  one lazy-loaded route per page (standalone components)
├── layout/           app shell: persistent side nav + top bar
└── app.routes.ts
```
- Standalone components, **signals** for state, the new control flow (`@if`, `@for`), reactive forms with validators that mirror the backend rules (same max lengths, required fields).
- HTTP: `provideHttpClient()`. Base URL `/api/v1`. The dev server proxies to the backend with `proxy.conf.json` (`/api` → `http://localhost:8080`).
- **The contract is `backend/openapi/openapi.json`.** Read it before writing a service or model. Never invent fields or endpoints.
  If something you need is missing, write it in `loops/frontend-dev/outputs/REQUESTS.md` and depend on the backend milestone.
- Show backend `ProblemDetail` errors to the user (field errors next to form fields, others in a snackbar).
- After every successful mutation, refresh the affected lists and the dashboard data (the PRD requires changes to show up immediately).

## Testability (required: Playwright MCP depends on it)
- Every interactive or asserted element gets `data-testid`, kebab-case, `<area>-<element>[-<qualifier>]`:
  `nav-tasks`, `task-add-btn`, `task-form-title`, `task-row-<id>`, `task-complete-<id>`, `plan-rest-time-<id>`, `empty-state-tasks`.
- Every page has an `<h1>` with the page name. Nav links have accessible names equal to the page name.
- No animations that block interaction (`provideNoopAnimations()` is acceptable in e2e mode).

## Commands
```bash
cd frontend && npx ng build                          # must pass before every trial
scripts/backend.sh start-stable                      # backend (last published jar) on :8080
scripts/frontend.sh start                            # ng serve on :4200 with proxy, waits until it serves
scripts/frontend.sh stop ; scripts/backend.sh stop-stable
cd frontend && npx ng test --watch=false --browsers=ChromeHeadless   # optional unit tests
```

## Playwright MCP verification
- MCP server `playwright`, configured in `.mcp.json`: headless, isolated profile, `--no-sandbox` (Ubuntu 24.04's AppArmor blocks the Chromium sandbox).
  It is pinned to `@playwright/mcp@0.0.40` because later versions need Node ≥ 20. After upgrading Node you can move to `@latest`.
  Screenshots are written under `run-artifacts/playwright/`. Copy the ones you cite into `outputs/evidence/`.
- Tools: `browser_navigate`, `browser_snapshot`,
  `browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`, `browser_wait_for`, `browser_take_screenshot`,
  `browser_console_messages`, `browser_network_requests`.
- Prefer `browser_snapshot` (accessibility tree) for assertions. Take a screenshot of the final state of each scenario as evidence.
- A scenario FAILS if any console error appears (check `browser_console_messages`) or any `/api` request returns 5xx.
