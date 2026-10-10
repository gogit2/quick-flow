# M08: Dashboard

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | M06, M07, backend-dev:M07 |
| Stories | US-DASH-01..06 |
| Requirements | FR-09, FR-08 (dashboard reflects item changes), UX Dashboard 1–6, AC Dashboard |

## 1. Spec (what and why)
The Dashboard page from one `GET /dashboard` payload (D-50): greeting with display name (D-52), summary metric cards (tasks, habits, plans, learning), today's task list and overdue tasks (with complete action), completed-today count and task completion %, today's habit checklist (toggle), active plans with live progress and rest time, upcoming plans, learning snapshot (cards by status, milestones completed in the last 7 days), and quick-add actions (task, habit, card, plan). Refreshes after every mutation made from it.

## 2. Design notes (how)
- Contract: `DashboardResponse` and nested `Dashboard*` schemas. Greeting text from API if provided, else D-52/A-02 locally.
- Reuse the rest-time component (M05) and dialogs from M02–M05 for quick-add.
- Toggling a habit / completing a task on the dashboard calls the feature APIs then re-fetches the dashboard.
- testids: `dash-greeting`, `dash-card-tasks|habits|plans|learning`, `dash-task-completion`, `dash-today-tasks`, `dash-task-<id>`, `dash-task-complete-<id>`, `dash-overdue-tasks`, `dash-completed-today`, `dash-today-habits`, `dash-habit-toggle-<id>`, `dash-active-plans`, `dash-plan-<id>`, `dash-plan-progress-<id>`, `dash-plan-rest-time-<id>`, `dash-learning`, `dash-learning-milestones-7d`, `dash-quick-add-task|habit|learning|plan`, `empty-state-dash-*`.

## 3. Tasks
- [x] M08-T01 Dashboard models + `DashboardApi`. Files: `core/models/dashboard.ts`, `core/api/dashboard-api.service.ts`
- [x] M08-T02 Header greeting + summary metric cards (task completion %, habits done today, active plans, learning). Files: `features/dashboard/dashboard-page.component.ts` (greeting from the API, D-52/A-02; cards link to their pages)
- [x] M08-T03 Today's tasks, overdue, completed today lists with complete action; today's habit checklist with toggle. Files: `dashboard-page.component.ts`
- [x] M08-T04 Active/upcoming plans with live progress + rest time; learning snapshot. Files: `dashboard-page.component.ts` (reuses RestTimeComponent with server skew; reloads on start/end crossing)
- [x] M08-T05 Quick-add actions (reuse feature dialogs) + refresh after mutations; empty states per widget. Files: `dashboard-page.component.ts`
- [x] M08-T06 Write scenario file `outputs/e2e/M08-dashboard.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: fresh DB → dashboard shows greeting "Good …, Friend", zero metrics and empty states | US-DASH-01, UX Dashboard 1–2 | e2e S1 |
| A2 | S2: quick-add task due today + overdue task (via Tasks page) → both lists show them; complete on dashboard → completed today +1, completion % updates | US-DASH-01, US-DASH-02, US-DASH-04, FR-09, D-15 | e2e S2 |
| A3 | S3: daily habit appears in today's habits; toggle → habits done count updates | US-DASH-03 | e2e S3 |
| A4 | S4: in-progress plan shows progress and a rest time that changes between snapshots; toggling a plan item on Plans page updates dashboard progress | US-DASH-05, FR-08 | e2e S4 |
| A5 | S5: learning snapshot counts match cards by status and milestones completed in 7 days | US-DASH-06 | e2e S5 |
| A6 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M07 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T19:28:21+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M08-dashboard.md` S1–S5 with Playwright MCP; regression on a second fresh backend; servers stopped.
- S1 ✅ (fresh DB: "Good evening, Friend", all counts 0, six empty states, 4 quick-add buttons) · S2 ✅ (quick-add task due today in Today's tasks; "Late task" due Oct 8 under Overdue; completing the today task → 50%, "1 of 2 · 1 today", Completed today list) · S3 ✅ (daily habit toggle on the dashboard 0/1 → 1/1 → 0/1) · S4 ✅ (plan 19:20→20:26 with the late task + habit: listed under Active plans, 0 / 2, rest time counting down; ticking the habit item on /plans → dashboard 1 / 2 · 50% and habits 1 / 1) · S5 ✅ (quick-add learning card → Not started 1; two milestones added, one completed on /learning → In progress 1, Not started 0, card "1 / 2 milestones", 1 milestone in 7 days) · no console errors, no 4xx/5xx
- Notes: no API-only setup was needed; every record came from the UI. One click was retried with a fresh snapshot ref after navigation (stale ref); the app was not changed.
- Regression (fresh backend): M01 S1 ✅ (`/` → /dashboard, 6 nav links), M02 S1 ✅, M03 S1 ✅, M04 S1 ✅, M05 S1 ✅ (plan from task + habit: In progress, 0 / 2), M06 S1 ✅ (task item → 1 / 2 · 50%), M07 S1 ✅ (name "Reg User" saved → dashboard greets "Good evening, Reg User"; task done via plan shows 100% on the dashboard)
- Evidence: `evidence/M08/trial-1/M08-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
