# M09: End-to-end journey and UX pass

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | M08 |
| Stories | all (journey) |
| Requirements | PRD §11 E2E coverage, §13 DoD, NFR Usability, UX empty states / validation |

## 1. Spec (what and why)
One continuous Playwright scenario on a fresh stack covering PRD §11: create task, complete task, create habit, complete habit, add learning card with milestones, build a plan from existing items, mark plan items done, verify plan achievement and dashboard update. Plus a UX pass: every list page has add + remove + empty state pointing at add, validation messages visible, dashboard updates after mutations, no console errors.

## 2. Design notes (how)
- Scenario data suffixed with a timestamp. Plan start = now − 1 min so it is In Progress immediately.
- UX pass fixes go in as small FIX tasks; no new features.

## 3. Tasks
- [x] M09-T01 Write journey scenario `outputs/e2e/M09-e2e-journey.md` (S1 journey, S2 UX pass checklist). Added S3 (load failure → error + retry) for the T02 fix.
- [x] M09-T02 UX pass: review each page for empty state → add action link, validation messages, loading/error states; fix gaps. Empty states with an add action and form validation were already in place on every list page. Gap fixed (FIX): while the first load ran, pages showed nothing, and a failed first load showed "No … yet" on Habits/Learning/Plans (a blank page on Tasks/Dashboard). New `shared/load-state` shows a loading bar, or "Could not load …" with Retry, until the first load succeeds; used on Tasks, Habits, Learning, Plans and Dashboard. Settings keeps its D-51 fallback to the defaults.
- [x] M09-T03 Update `outputs/00-coverage.md` with final scenario step references (M09 S1 step refs on stories/ACs, validation and load-state UX rows added; Status column filled on PASS)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: full journey passes step by step; final dashboard shows task completion %, habit done, plan 100%/Completed, learning milestones | PRD §11, AC Plans "reflected in dashboard" | e2e S1 |
| A2 | S2: on each list page, empty state shows and its button opens the add form; remove works from the page | NFR Usability, DoD | e2e S2 |
| A3 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M08 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T19:37:27+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M09-e2e-journey.md` run in order S2 → S1 → S3 with Playwright MCP; regression on a second fresh backend; servers stopped.
- A2 S2 ✅ (Tasks, Habits, Learning, Plans: the empty state's button opens the add dialog; empty save shows the required message ("Title is required" / "Name is required"; plans also "Select at least one task, habit or learning card", no request sent); item saved, then removed via delete + confirm → empty state again. Dashboard: all six empty states, their links go to the right page) 
- A1 S1 ✅ (fresh dashboard 0% · 0 / 0 · 0 · 0 → "Journey task" High, due today, completed → Done; "Journey plan task" To do; daily habit marked done → "1 day streak"; course with 2 milestones, 1 done → In progress, 1 / 2 · 50%; dashboard 50% (1 of 2 · 1 today), habits 1 / 1, learning In progress 1, 1 milestone in 7 days; plan start now − 1 min with the plan task + habit + course → In progress, 0 / 3, countdown decreasing; dashboard shows it 0 / 3; items ticked → 33% → 67% → 100%, plan Completed, History row 3 / 3 · 100%; final dashboard 100% (2 of 2), habits 1 / 1, active plans 0 with its empty state, learning 1 / 2 (no side effect from the learning item, D-47))
- S3 ✅ (backend stopped: /tasks shows "Could not load tasks." + Retry and no "No tasks yet"; /dashboard shows "Could not load the dashboard."; backend restarted on the same DB → Retry renders the S1 data, 100%)
- A3 ✅ build green; no console errors in S1/S2 (one browser warning came from the test typing a date in the wrong format into the native date field, not from the app); no 5xx in the backend log. The 500s and console errors in S3 are expected (backend down on purpose).
- Notes: the dev proxy answers 500 when the backend is down, so the snackbar says "Request failed (500)" rather than "Cannot reach the server". Known limitation, dev setup only. One `browser_type` used a testid instead of a snapshot ref and was retried with the ref.
- Regression (fresh backend): M01 S1 ✅ (`/` → /dashboard, 6 nav links), M02 S1 ✅, M03 S1 ✅, M04 S1 ✅, M05 S1 ✅ (plan from task + habit + card: In progress, 0 / 3), M06 S1 ✅ (33% → 67% → 100%, Completed, History 3 / 3 · 100%), M07 S1 ✅ (name "Reg User" saved → greeting), M08 S1 ✅ (fresh dashboard: zeros, empty states, 4 quick-add buttons)
- Evidence: `evidence/M09/trial-1/M09-trial-1-journey-final.png`
- Result: PASS

## 6. Notes / Blocked
- Known limitation: with the Angular dev proxy, an unreachable backend surfaces as HTTP 500 ("Request failed (500)"), not status 0 ("Cannot reach the server"). The page still shows the load-error state with Retry.
