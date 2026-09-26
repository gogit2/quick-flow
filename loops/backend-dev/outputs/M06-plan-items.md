# M06: Plan items, side effects, history

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | done |
| Depends on | M05 |
| Stories | US-PLAN-05, US-PLAN-09, US-PLAN-10 |
| Requirements | FR-07 (mark item), FR-08 (immediate roll-up, auto status), BR-13, BR-14, D-47, D-48, D-49 |

## 1. Spec (what and why)
Mark individual plan items done/not done, with the BR-13 side effects (task → DONE, habit → today's completion, learning → none; un-marking never reverts). Plan progress and status update immediately. Deleting a source task/habit/card removes plan items that reference it. A history endpoint lists completed plans with final progress.

## 2. Design notes (how)
- `PATCH /api/v1/plans/{id}/items/{itemId}` body `{ "done": true|false }` → 200 + full `PlanResponse`. Item from another plan → 404.
- `PlanItemSideEffects` (service): TASK → `TaskService.completeFromPlan` (sets DONE via `TaskRules`, idempotent); HABIT → `HabitService.recordCompletionIfAbsent(today)`; LEARNING_RESOURCE → nothing (D-47).
- Cascade (D-48): `PlanItemRepository.deleteBySourceTypeAndSourceId` called from `TaskService.delete`, `HabitService.delete`, `LearningService.deleteCard` (same transaction). Plan remains, possibly empty (status then derived by time only).
- `GET /api/v1/plans/history` → COMPLETED plans (by derived status), sorted by `endDateTime` desc, each with `progressPercent` (D-49). Register before `/{id}` mapping conflicts (use explicit path).
- Unit tests: status becomes COMPLETED when all items done even before end; side-effect selection per source type.

## 3. Tasks
- [x] M06-T01 `PATCH /plans/{id}/items/{itemId}` service + controller + Swagger (item toggle, status/progress recompute)
  - `PlanService.setItemDone`, `PlanController.setItemDone`, `plan/api/PlanItemDoneRequest.java`, `PlanItemRepository.findByIdAndPlanId`
- [x] M06-T02 `PlanItemSideEffects` (task complete, habit completion if absent, learning none) + hooks in TaskService/HabitService
  - `plan/domain/PlanItemEffect.java`, `PlanRules.sideEffect`, `plan/service/PlanItemSideEffects.java` (uses `TaskService.complete`, `HabitService.recordCompletionIfAbsent`)
- [x] M06-T03 Cascade delete of plan items when a task/habit/learning card is deleted (D-48)
  - `PlanItemRepository.deleteBySource`; called in `TaskService.delete`, `HabitService.delete`, `LearningService.delete`
- [x] M06-T04 `GET /plans/history` (D-49)
  - `PlanService.history`, `PlanController.history` (`/plans/history`)
- [x] M06-T05 Unit tests: all-done → COMPLETED before end; side-effect mapping; un-mark does not revert
  - `PlanRulesTest` +3 tests (10 total)
- [x] M06-T06 Curl suite `outputs/curl/M06-plan-items.sh` (§4)
  - cases 1–9

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | In an IN_PROGRESS plan with 3 items, PATCH one item done → `doneItems: 1`, `progressPercent: 33` | US-PLAN-05/09, FR-08 | `outputs/curl/M06-plan-items.sh` case 1 |
| A2 | Marking the task item done → GET task shows `status: DONE`, `completedAt` set | BR-13, D-47 | case 2 |
| A3 | Marking the habit item done → habit `doneToday: true`; if the habit was already completed today, still 200 (no 409) | BR-13, D-47 | case 3 |
| A4 | Marking the learning item done → card status unchanged | BR-13, D-47 | case 4 |
| A5 | Un-mark the task item → item `done: false`, progress drops, task stays DONE | D-47 | case 5 |
| A6 | All items done → plan `COMPLETED` even though now < end; `remainingSeconds: null` | FR-08, D-43 | case 6 |
| A7 | Plan appears in `GET /plans/history` with `progressPercent: 100`; history is sorted by end desc | US-PLAN-10, D-49 | case 7 |
| A8 | Delete the source habit of another plan → that plan's item is gone, plan still exists, `totalItems` decreased | BR-14, D-48 | case 8 |
| A9 | PATCH with unknown item id → 404; body without `done` → 400 | D-05 | case 9 |
| A10 | Unit tests pass | PRD §11 | verify.log |

Regression: M01–M05 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->
### Trial 1 (2026-09-26T20:04:26+03:00): PASS
Commands: `./mvnw -q verify` → `scripts/backend.sh start-dev` → `scripts/export-swagger.sh` → `scripts/curl-regression.sh M06` → `scripts/curl-regression.sh` → `scripts/backend.sh stop-dev`.
| Check | Result |
|---|---|
| A1–A9 | PASS (M06 suite 51/51) |
| A10 | PASS (PlanRulesTest 10/10; total 28/28 unit tests) |
| Swagger | new ops `GET /plans/history`, `PATCH /plans/{id}/items/{itemId}` documented with summaries |
| Regression | PASS (M01 9, M02 69, M03 50, M04 58, M05 64, M06 51) |

Evidence: `outputs/evidence/M06/trial-1/` (`verify.log`, `swagger.log`, `curl-M06.log`, `regression.log`, `swagger-check.log`).

## 6. Notes / Blocked
