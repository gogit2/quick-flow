# M05: Todo plans: composition, status, progress, rest time

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | done |
| Depends on | M02, M03, M04 |
| Stories | US-PLAN-01, US-PLAN-02, US-PLAN-03, US-PLAN-04, US-PLAN-06, US-PLAN-07 (backend part), US-PLAN-08, US-PLAN-09 |
| Requirements | FR-07, FR-08 (status, %, rest time), BR-10, BR-11, BR-12, NFR Reliability, D-40..D-45 |

## 1. Spec (what and why)
Create, read, update and remove plans built from existing tasks, habits and learning cards. Every read computes status (pure function of now/start/end/items), `progressPercent`, `doneItems`, `totalItems`, `remainingSeconds` (only while IN_PROGRESS), `serverTime`, and `startsInSeconds` (for NOT_STARTED, helps the UI notify, US-PLAN-07). Not included: item done toggling and side effects, history, cascade from source deletion (M06).

## 2. Design notes (how)
- `V5__plans.sql`: `plan(id, title varchar(200) not null, estimated_duration int, start_date_time timestamp, end_date_time timestamp, priority_order int, status varchar(20), created_at)`, `plan_item(id, plan_id fk cascade, source_type varchar(20), source_id bigint, done boolean, position int, unique(plan_id, source_type, source_id))`.
- `plan/domain`: `Plan`, `PlanItem`, `PlanStatus {NOT_STARTED, IN_PROGRESS, COMPLETED}`, `PlanSourceType {TASK, HABIT, LEARNING_RESOURCE}`, `PlanRules` (pure):
  `status(start, end, doneItems, totalItems, now)` (D-43: COMPLETED if total>0 && all done, or now ≥ end; IN_PROGRESS if start ≤ now < end; else NOT_STARTED),
  `progressPercent(done,total)` (0 if total 0), `remainingSeconds(...)` (null unless IN_PROGRESS; BR-12), `validateWindow(start,end)` (BR-11).
- `plan/service/PlanSourceResolver`: checks a source exists and returns `sourceTitle`/`sourceStatus` (task title/status, habit name/active+doneToday, card title/status). Unknown → 400 with `errors.items`.
- `plan/api` `/api/v1/plans`: `GET` (`?status=` optional; sort by status group IN_PROGRESS, NOT_STARTED, COMPLETED → priorityOrder → start, D-41), `GET /{id}`, `POST`, `PUT /{id}` (title, estimatedDuration, start, end, priorityOrder, items replace—keeps done flags for retained sources), `DELETE /{id}`.
- Request validation: title `@NotBlank @Size(max=200)`, `estimatedDuration` `@NotNull @Positive` (D-40), `priorityOrder` `@NotNull @Min(1)` (D-41), start/end `@NotNull`, items `@NotEmpty` (BR-10), duplicate source → 400 (D-42).
- Persisted `status` column refreshed on every read/write, never trusted (D-43).
- `PlanResponse`: id, title, estimatedDuration, startDateTime, endDateTime, priorityOrder, status, createdAt, items[{id, sourceType, sourceId, sourceTitle, sourceStatus, done}], doneItems, totalItems, progressPercent, remainingSeconds, startsInSeconds, serverTime.

## 3. Tasks
- [x] M05-T01 Migration `V5__plans.sql` + entities + enums + repositories
  - `db/migration/V5__plans.sql`, `plan/domain/{Plan,PlanItem,PlanStatus,PlanSourceType}.java`, `plan/repo/PlanRepository.java`, `PlanItemRepository.java`
- [x] M05-T02 `PlanRules` (status, progress, remainingSeconds, startsInSeconds, window validation) + unit tests across NOT_STARTED → IN_PROGRESS → COMPLETED with fixed Clock
  - `plan/domain/PlanRules.java` (+ `groupRank` for D-41), `test/.../plan/domain/PlanRulesTest.java` (7 tests)
- [x] M05-T03 `PlanSourceResolver` (existence + title/status lookup across task/habit/learning repos)
  - `plan/service/PlanSourceResolver.java` (batched per type; habit sourceStatus DONE/PENDING/INACTIVE, A-08)
- [x] M05-T04 `PlanService` create/get/list (sorted)/update/delete with validation (BR-10, BR-11, D-42) and status refresh
  - `plan/service/PlanService.java` (item replace keeps done flags of kept sources)
- [x] M05-T05 `PlanController` + records + mapper + Swagger annotations
  - `plan/api/PlanController.java`, `PlanRequest`, `PlanItemRequest`, `PlanResponse`, `PlanItemResponse`, `PlanMapper`
- [x] M05-T06 Curl suite `outputs/curl/M05-plans-core.sh` (§4)
  - `outputs/curl/M05-plans-core.sh` (cases 1–10)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | POST plan with 1 task + 1 habit + 1 learning card, start = now−10 min, end = now+50 min → 201; `status: IN_PROGRESS`, `totalItems: 3`, `progressPercent: 0`, `remainingSeconds` ≈ 3000 (2900–3000), items carry `sourceTitle` | US-PLAN-01/02/03/04/08, FR-07, FR-08, D-44 | `outputs/curl/M05-plans-core.sh` case 1 |
| A2 | Plan with start = now+1 h → `NOT_STARTED`, `remainingSeconds: null`, `startsInSeconds > 0` | BR-12, D-43, US-PLAN-07 | case 2 |
| A3 | Plan with start = now−2 h, end = now−1 h → `COMPLETED`, `remainingSeconds: null` | D-43, BR-12 | case 3 |
| A4 | Empty items → 400; item referencing non-existent id → 400; duplicate source in one plan → 400 | BR-10, D-42 | case 4 |
| A5 | end ≤ start → 400 with an error on `endDateTime` | BR-11 | case 5 |
| A6 | `estimatedDuration: 0` → 400; `priorityOrder: 0` → 400; bad sourceType → 400 | D-40, D-41 | case 6 |
| A7 | GET list: IN_PROGRESS plans before NOT_STARTED before COMPLETED; within a group, lower priorityOrder first | D-41, US-PLAN-04 | case 7 |
| A8 | PUT changes title/priority/window → 200 and status recomputed | FR-07 | case 8 |
| A9 | DELETE plan → 204; GET → 404; the source task still exists | US-PLAN-06, BR-14 | case 9 |
| A10 | `serverTime` present and within 5 s of the machine clock | D-44 | case 10 |
| A11 | Unit tests for `PlanRules` lifecycle pass | PRD §11 | verify.log |

Regression: M01–M04 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->
### Trial 1 (2026-09-26T19:59:46+03:00): PASS
Commands: `./mvnw -q verify` → `scripts/backend.sh start-dev` → `scripts/export-swagger.sh` → `scripts/curl-regression.sh M05` → `scripts/curl-regression.sh` → `scripts/backend.sh stop-dev`.
| Check | Result |
|---|---|
| A1–A10 | PASS (M05 suite 64/64) |
| A11 | PASS (PlanRulesTest 7/7; total 25/25 unit tests) |
| Swagger | 5 plan ops (`/plans` GET/POST, `/plans/{id}` GET/PUT/DELETE), each with a summary |
| Regression | PASS (M01 9, M02 69, M03 50, M04 58, M05 64) |

Evidence: `outputs/evidence/M05/trial-1/` (`verify.log`, `swagger.log`, `curl-M05.log`, `regression.log`, `swagger-check.log`).

## 6. Notes / Blocked
