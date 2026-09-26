# M06: Plan items, start notification, history

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
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
- [ ] M06-T01 Item done toggle (PATCH), live progress/status update, move between groups
- [ ] M06-T02 History section (GET /plans/history) with final progress %
- [ ] M06-T03 PlanStartWatcher + NotificationService snackbar/browser notification + localStorage dedupe + card highlight
- [ ] M06-T04 Write scenario file `outputs/e2e/M06-plan-items.md` (§4)

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

## 6. Notes / Blocked
