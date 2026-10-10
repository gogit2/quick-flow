# M06: Plan items, start notification, history

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | M05, backend-dev:M06 |
| Stories | US-PLAN-05, US-PLAN-07, US-PLAN-09, US-PLAN-10 |
| Requirements | FR-07 (item done), FR-08 (notify, progress, auto status), BR-13, UX Todo Plans (notification/highlight), AC Plans |

## 1. Spec (what and why)
Per-item done toggles on plan cards (progress updates immediately, BR-13 side effects visible on the source pages), an in-app start notification (snackbar + card highlight, optional browser Notification) when a plan's start is reached, and a History section listing completed plans with their final progress %.

## 2. Design notes (how)
- Contract: `PATCH /plans/{id}/items/{itemId}` `PlanItemDoneRequest` → full `PlanResponse` (A-09); `GET /plans/history` (D-49).
- Toggle replaces the plan in the signal; status may flip to COMPLETED when all items done (D-43) → card moves to Completed group.
- Start watcher (D-46): `PlanStartWatcher` service started at app bootstrap, polls `GET /plans?status=NOT_STARTED`/uses `startsInSeconds` (A-01) at least every 30 s plus the NowService tick; when a plan's start passes → NotificationService snackbar "Plan '<title>' has started", highlight `plan-card-<id>` (class + `plan-started-<id>` badge), browser Notification if settings allow (settings read in M07; default off). Notified IDs stored in localStorage `qf.notifiedPlans`.
- testids: `plan-item-toggle-<itemId>`, `plan-started-<id>`, `plans-history`, `plan-history-row-<id>`, `plan-history-progress-<id>`.

## 3. Tasks
- [x] M06-T01 Item done toggle (PATCH), live progress/status update, move between groups. Files: `features/plans/plan-card.component.ts` (`plan-item-toggle-<id>` checkbox + source status text), `plans-page.component.ts` (replace plan from the PATCH response, then reload for ordering/history; per-plan busy flag)
- [x] M06-T02 History section (GET /plans/history) with final progress %. Files: `plans-page.component.ts` (`plans-history` table)
- [x] M06-T03 PlanStartWatcher + NotificationService snackbar/browser notification + localStorage dedupe + card highlight. Files: `core/notify/plan-start-watcher.service.ts` (polls NOT_STARTED every 30 s + on create/edit/delete; checks on every NowService tick; `startsInSeconds` anchored to request time), `core/notify/notification.service.ts` (`remind()`, `prefs` signal: inApp on / browser off until M07 loads settings), `layout/shell.component.ts` (starts the watcher)
- [x] M06-T04 Write scenario file `outputs/e2e/M06-plan-items.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: plan with 3 items → toggle one → 33%; toggle all → 100%, status Completed, moves to Completed group | US-PLAN-05, US-PLAN-09, FR-08 | e2e S1 |
| A2 | S2: after marking the task item done, Tasks page shows the task Done; un-marking does not revert it | BR-13, D-47 | e2e S2 |
| A3 | S3: create plan with start = now + 1 min → wait ≤ 90 s → snackbar "Plan '<title>' has started" and card highlighted; reload → no repeat snackbar | US-PLAN-07, FR-08, D-46 | e2e S3 |
| A4 | S4: History lists the completed plan with its progress % | US-PLAN-10, D-49 | e2e S4 |
| A5 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M05 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T19:09:35+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M06-plan-items.md` S1–S4 with Playwright MCP (browser TZ UTC+3); regression on a second fresh backend; servers stopped.
- A1 S1 ✅ (0% → task 33% → habit 67% → card 100%; status Completed; card moved to the Completed group; snackbar "Plan '…' completed") · A2 S2 ✅ (Tasks page: task Done; Habits page: "Done today", 1-day streak; un-marking the task item → 67%, In progress, back in the active group; task still DONE in the UI and API; the learning card stays "not started" (D-47)) · A3 S3 ✅ (plan starting 19:08:00 created at 19:07:19 → by 19:08:03: snackbar "Plan 'Soon plan 1010' has started", plan-started-2 badge + highlight, status In progress, rest time 00:29:58; reload + 6 s → no repeat, localStorage `qf.notifiedPlans` = [2]) · A4 S4 ✅ (past plan → Completed 0 / 1; History: Items plan 3 / 3 · 100% (ended 20:07) above Past plan 0 / 1 · 0% (ended 18:08)) · A5 ✅ no console errors, no 4xx/5xx
- Notes:
  - S1.1 setup: the three sources were created with curl, not in the UI (the scenario file says so). Creating them in the UI is covered by the M02–M04 S1 regression below.
  - S3.2: the first `browser_wait_for` (text) timed out after its 5 s default, 30 s before the start time. It was redone as an explicit 35 s wait followed by a check. This was test timing; the app was not changed.
- Regression (fresh backend): M01 S1 ✅ (7 navigations), M02 S1 ✅, M03 S1 ✅, M04 S1 ✅, M05 S1 ✅ (plan built from the three sources just created in the UI: In progress, 0 / 3, 3 items, rest time)
- Evidence: `evidence/M06/trial-1/M06-trial-1-start-notification.png`, `evidence/M06/trial-1/M06-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
