# M08: Dashboard

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
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
- [ ] M08-T01 Dashboard models + `DashboardApi`
- [ ] M08-T02 Header greeting + summary metric cards (task completion %, habits done today, active plans, learning)
- [ ] M08-T03 Today's tasks, overdue, completed today lists with complete action; today's habit checklist with toggle
- [ ] M08-T04 Active/upcoming plans with live progress + rest time; learning snapshot
- [ ] M08-T05 Quick-add actions (reuse feature dialogs) + refresh after mutations; empty states per widget
- [ ] M08-T06 Write scenario file `outputs/e2e/M08-dashboard.md` (§4)

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

## 6. Notes / Blocked
