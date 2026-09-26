# M07: Dashboard and settings

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | done |
| Depends on | M06 |
| Stories | US-DASH-01, US-DASH-02, US-DASH-03, US-DASH-04, US-DASH-05, US-DASH-06 |
| Requirements | FR-09, FR-08 (dashboard reflects item changes), D-15, D-24, D-50, D-51, D-52 |

## 1. Spec (what and why)
One `GET /api/v1/dashboard` payload with every widget the UI needs, computed from live data, plus a single-row settings resource. Not included: any new domain data.

## 2. Design notes (how)
- `dashboard/` package (read model, no entity): `DashboardService` uses Task/Habit/Plan/Learning services.
- `DashboardResponse`:
  - `greeting` ("Good morning/afternoon/evening, {displayName}"; morning 05–11, afternoon 12–17, evening otherwise, in `app.zone`) (D-52), `serverTime`, `today`.
  - `tasks`: `dueToday[]`, `overdue[]`, `completedToday[]` (completedAt in today's zone), `totalActive`, `doneCount`, `completionPercent` (D-15).
  - `habits`: `today[]` (D-24, each with `doneToday`/`doneThisPeriod`, `currentStreak`), `activeCount`, `completedTodayCount`.
  - `plans`: `active[]` (IN_PROGRESS, with progressPercent, remainingSeconds), `upcoming[]` (NOT_STARTED, next 5 by start), `activeCount`.
  - `learning`: `byStatus{NOT_STARTED, IN_PROGRESS, COMPLETED}`, `inProgress[]` (id, title, progressPercent), `milestonesCompletedLast7Days` (D-30).
- `DashboardRules` (pure): greeting by hour, task completion %, today's-habit selection → unit tests.
- `settings/`: `V6__settings.sql` table `app_settings(id=1, display_name varchar(100), notifications_enabled, browser_notifications, default_view)` seeded with defaults; `GET/PUT /api/v1/settings` (D-51); `defaultView` enum `DASHBOARD, TASKS, HABITS, LEARNING, PLANS, SETTINGS`.

## 3. Tasks
- [x] M07-T01 `V6__settings.sql` + `Settings` entity/repo/service/controller + Swagger (D-51) — `settings/` domain (Settings, DefaultView), repo, service, api (controller, request, response); A-10
- [x] M07-T02 `DashboardRules` (greeting, completion %, today's habits) + unit tests with fixed Clock — `dashboard/domain/DashboardRules.java`, `DashboardRulesTest` (5 tests; also zone-aware "completed today" and 7-day milestone window)
- [x] M07-T03 `DashboardService` aggregation (tasks, habits, plans, learning) — `dashboard/service/DashboardService.java`
- [x] M07-T04 `DashboardController` + response records + Swagger — `dashboard/api/DashboardController.java`, `DashboardResponse.java` (nested widget records); Task/Habit/PlanMapper made public for reuse
- [x] M07-T05 Curl suite `outputs/curl/M07-dashboard-settings.sh` (§4)

## 4. Acceptance checks
Checks are relative (before/after deltas) because the regression DB holds data from earlier suites.

| # | Check | Proves | How |
|---|---|---|---|
| A1 | GET /settings → 200 defaults shape; PUT displayName/defaultView → 200 and persisted; displayName 101 chars → 400; bad defaultView → 400 | D-51 | `outputs/curl/M07-dashboard-settings.sh` case 1 |
| A2 | Dashboard `greeting` contains the displayName and starts with "Good " | D-52 | case 2 |
| A3 | Task due today appears in `tasks.dueToday`; task due yesterday (TODO) in `tasks.overdue` | US-DASH-01/02, FR-09 | case 3 |
| A4 | Completing a task → appears in `completedToday`; `completionPercent` equals round(doneCount/totalActive*100) and matches GET /tasks data | US-DASH-04, D-15, PRD §11 | case 4 |
| A5 | New active daily habit in `habits.today` with `doneToday: false`; after completing → true and `completedTodayCount` +1; deactivated habit absent | US-DASH-03, D-24 | case 5 |
| A6 | IN_PROGRESS plan in `plans.active` with `remainingSeconds > 0`; PATCH an item done → dashboard `progressPercent` updates immediately | US-DASH-05, FR-08 | case 6 |
| A7 | Completing a learning milestone → `milestonesCompletedLast7Days` +1 and `byStatus` counts match GET /learning-cards | US-DASH-06, D-30 | case 7 |
| A8 | Unit tests for `DashboardRules` pass | PRD §11 | verify.log |

Regression: M01–M06 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

### Trial 1 (2026-09-26T20:11+03:00): PASS
Commands: `./mvnw -q verify` → `scripts/backend.sh start-dev` → `scripts/export-swagger.sh` → `scripts/curl-regression.sh M07` → `scripts/curl-regression.sh` → `scripts/backend.sh stop-dev`.

| Check | Result |
|---|---|
| A1 settings GET/PUT/validation (101 chars, bad enum, blank → 400) | pass |
| A2 greeting "Good …, {displayName}" | pass |
| A3 dueToday / overdue / archived hidden | pass |
| A4 completedToday + completionPercent matches GET /tasks | pass |
| A5 today's habits, doneToday, completedTodayCount +1, weekly-done hidden, deactivated absent | pass |
| A6 active plan remainingSeconds > 0, upcoming, progress 0 → 50 after PATCH | pass |
| A7 milestonesCompletedLast7Days +1, byStatus matches GET /learning-cards | pass |
| A8 DashboardRulesTest 5/5 (33/33 total) | pass |
| Regression M01–M07 (352 checks) | pass |
| Swagger: GET /dashboard, GET+PUT /settings documented with summaries | pass |

Evidence: `outputs/evidence/M07/trial-1/{verify,curl-M07,regression,swagger-check}.log`. Jar published.

## 6. Notes / Blocked
