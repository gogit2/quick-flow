# M05: Todo Plans: builder, list, progress, rest time

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
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
- [x] M05-T01 Plan models + `PlanApi` service. Files: `core/models/plan.ts`, `core/api/plan-api.service.ts` (also PATCH item + history for M06)
- [x] M05-T02 Plan builder dialog: source pickers (tasks/habits/learning loaded from their APIs), fields, validators (BR-10, BR-11). Files: `features/plans/plan-form-dialog.component.ts`, `core/time/local-date.ts` (datetime-local ↔ ISO). Sources: non-archived tasks, active habits, all cards. Defaults: start = now, end = +1 h, 60 min, priority 1. Also used for edit (PUT).
- [x] M05-T03 Plans page: grouped list (active/upcoming vs completed), cards with status, progress bar %, item list, empty state, remove with confirm. Files: `features/plans/plans-page.component.ts`, `plan-card.component.ts`
- [x] M05-T04 Rest-time countdown component (NowService, skew correction, BR-12 visibility, D-45 format) + refresh on start/end crossing. Files: `shared/rest-time/rest-time.component.ts` (`formatRestTime`; skew = serverTime − client time of the last list response; `phaseChange` → page reload)
- [x] M05-T05 Write scenario file `outputs/e2e/M05-plans-core.md` (§4)

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
### Trial 1 (2026-10-10T19:03:08+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M05-plans-core.md` S1–S5 with Playwright MCP (browser TZ Africa/Cairo, UTC+3); regression on a second fresh backend; servers stopped.
- A1/A6 S1 ✅ (sources created via the Tasks/Habits/Learning pages; builder lists them as plan-source-task-1 / habit-1 / learning-1; "Morning plan" 18:55 → 20:01, 65 min, P1 → In progress, "0 / 3 items · 0%", 3 item rows) · A2 S2 ✅ (01:00:13 → 01:00:10 over 3.0 s; matches end − now within 1 s; HH:MM:SS) · A3 S3 ✅ (tomorrow plan: Not started, "Starts Oct 11, 19:00", no rest time; listed after the In-progress plan) · A4 S4 ✅ (no items → items error; end < start → range error; empty title → title error; no POST in any case; cancel keeps 2 plans) · A5 S5 ✅ (delete with confirm → 1 plan; its task still exists) · A7 ✅ no 5xx (18 API calls, all 2xx)
- Notes:
  - S2.1: the expected value in the scenario ("≤ 01:00:00") was wrong, because the end was typed as 20:01, rounded up from now + 1 h. The scenario now expects end − now (±1 s). The app value (01:00:20 at about 19:00:40) was correct.
  - Fix made during the trial: the builder labels read "Title· detail" because Angular strips the whitespace between the two spans. The space now sits inside the detail span. Checked after the fix: "Plan task 1010 · To do". The regression below ran on the fixed code.
  - Regression: the first attempt drove M02–M04 with a DOM script that clicked Save before each dialog's form had bound. That raised three `_syncPendingControls` console errors and created nothing (only GETs were sent). It was a test-driver mistake, not an app bug; a real click cannot reach Save before the dialog renders. After a reload it was redone with Playwright MCP clicks/typing: clean console.
- Regression: M01 S1 ✅ (7 navigations), M02 S1 ✅, M03 S1 ✅, M04 S1 ✅ (fresh backend)
- Evidence: `evidence/M05/trial-1/M05-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
