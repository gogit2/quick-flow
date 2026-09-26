# M05: Todo Plans: builder, list, progress, rest time

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
| Depends on | M02, M03, M04, backend-dev:M05 |
| Stories | US-PLAN-01, US-PLAN-02, US-PLAN-03, US-PLAN-04, US-PLAN-06, US-PLAN-08, US-PLAN-09 |
| Requirements | FR-07, FR-08 (rest time, progress, status), BR-10, BR-11, BR-12, UX Todo Plans Page, AC Plans |

## 1. Spec (what and why)
The Todo Plans page: a Create Plan builder that lists existing tasks, habits and learning cards to pick from, plus title, estimated duration (minutes), start and end date-time, priority order. Plan list grouped into Active/Upcoming and Completed, each card showing status, progress % (done/total), items, and a live rest-time countdown only while In Progress. Remove plan with confirm. Empty state pointing at Create Plan. Item toggles, start notification and history are M06.

## 2. Design notes (how)
- Contract: `PlanRequest`, `PlanItemRequest`, `PlanResponse`, `PlanItemResponse`; `/plans` GET/POST/PUT/DELETE. Source types `TASK`, `HABIT`, `LEARNING_RESOURCE` (A-01).
- Validators: title required, ≥ 1 item (BR-10), end > start (BR-11, cross-field error), estimatedDuration positive int (D-40), priorityOrder int ≥ 1 (D-41). Backend 400 details shown.
- Date-time inputs: native `datetime-local`, converted to ISO Instant (UTC) for the API.
- Rest time: `RestTimePipe`/component using NowService; remaining = endDateTime − (now corrected by `serverTime` skew); format `HH:MM:SS` or `Xd HH:MM:SS` (D-45); hidden unless start ≤ now < end (BR-12). Status displayed from the API and re-fetched when a countdown crosses start/end (D-43).
- Sorting as returned by the API (D-41).
- testids: `plan-add-btn`, `plan-form-title|duration|start|end|priority|save|cancel`, `plan-source-task-<id>`, `plan-source-habit-<id>`, `plan-source-learning-<id>`, `plan-card-<id>`, `plan-status-<id>`, `plan-progress-<id>`, `plan-rest-time-<id>`, `plan-item-<itemId>`, `plan-delete-<id>`, `plans-group-active`, `plans-group-completed`, `empty-state-plans`.

## 3. Tasks
- [ ] M05-T01 Plan models + `PlanApi` service
- [ ] M05-T02 Plan builder dialog: source pickers (tasks/habits/learning loaded from their APIs), fields, validators (BR-10, BR-11)
- [ ] M05-T03 Plans page: grouped list (active/upcoming vs completed), cards with status, progress bar %, item list, empty state, remove with confirm
- [ ] M05-T04 Rest-time countdown component (NowService, skew correction, BR-12 visibility, D-45 format) + refresh on start/end crossing
- [ ] M05-T05 Write scenario file `outputs/e2e/M05-plans-core.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: empty state → create task + habit + card via their pages → build plan selecting all three with duration, start = now − 5 min, end = now + 1 h, priority 1 → plan card In Progress, 0%, 3 items | US-PLAN-01..04, FR-07 | e2e S1 |
| A2 | S2: rest-time value visible and changes between two snapshots ≥ 2 s apart, format HH:MM:SS | US-PLAN-08, FR-08, D-45 | e2e S2 |
| A3 | S3: future plan (start = now + 1 day) shows Not Started and no rest time; listed in active/upcoming group | BR-12, D-43 | e2e S3 |
| A4 | S4: builder with no items / end ≤ start shows validation errors, nothing saved | BR-10, BR-11 | e2e S4 |
| A5 | S5: remove plan → gone | US-PLAN-06 | e2e S5 |
| A6 | Progress shows done/total (0/3 = 0%) | US-PLAN-09 | e2e S1 |
| A7 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M04 smoke.

## 5. Verification trials

## 6. Notes / Blocked
