# M02: Tasks page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | M01, backend-dev:M02 |
| Stories | US-TASK-01..07 |
| Requirements | FR-01, FR-02, BR-1..5, BR-14, UX Tasks Page, AC Tasks |

## 1. Spec (what and why)
The Tasks page: add/edit task form (title, description, status, priority, due date), task list with complete / edit / archive / restore / delete actions, search box, status / priority / due-date filters, sort (due date or created), archived view, overdue marker, and an empty state pointing at Add Task.

## 2. Design notes (how)
- Contract: `TaskRequest`, `TaskResponse`, `/api/v1/tasks` (+ `/{id}/complete|archive|restore`). Query params exactly as in openapi.json (search, status, priority, due range, sort, dir, archived).
- Validators mirror BR-1/BR-2: title required ≤ 200, description ≤ 2000. Backend field errors shown under fields.
- Overdue = `overdue` flag from the API (D-12), shown as a chip `task-overdue-<id>`.
- Delete asks confirmation (hard delete, D-13). Archive hides from default list; "Show archived" toggle uses `?archived=true`.
- testids: `task-add-btn`, `task-form-title|description|status|priority|due|save|cancel`, `task-row-<id>`, `task-complete-<id>`, `task-edit-<id>`, `task-archive-<id>`, `task-restore-<id>`, `task-delete-<id>`, `task-search`, `task-filter-status`, `task-filter-priority`, `task-filter-due`, `task-sort`, `task-show-archived`, `empty-state-tasks`.

## 3. Tasks
- [x] M02-T01 Task models + `TaskApi` service matching the contract. Files: `core/models/task.ts`, `core/api/task-api.service.ts`
- [x] M02-T02 Task list page: rows, status/priority/due/overdue display, empty state. Files: `features/tasks/tasks-page.component.ts`, `core/time/local-date.ts`
- [x] M02-T03 Add/edit dialog with validators and backend field errors. Files: `features/tasks/task-form-dialog.component.ts`
- [x] M02-T04 Row actions: complete, archive, restore (archived view), delete with confirm. Files: `tasks-page.component.ts` (Active/Archived toggle `task-show-active|archived`)
- [x] M02-T05 Search, status/priority/due filters, sort controls (debounced, query params to API). Files: `tasks-page.component.ts` (search 300 ms debounce → `q`; due filter = today / next 7 days / before today → `dueDate`/`dueFrom`/`dueTo`)
- [x] M02-T06 Write scenario file `outputs/e2e/M02-tasks.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: empty state visible → create task → row visible | US-TASK-01, FR-01, UX empty state | e2e S1 |
| A2 | S2: save with empty title shows required error; 201-char title blocked | BR-1, AC "required fields validated" | e2e S2 |
| A3 | S3: edit title/priority → row updated; complete → status Done | US-TASK-02, US-TASK-03, BR-5 | e2e S3 |
| A4 | S4: archive → gone from default list, visible in archived view, restore returns it; delete removes it | US-TASK-04, BR-4, BR-14 | e2e S4 |
| A5 | S5: search by title substring, status filter, priority filter, sort by due date narrow/reorder the list | US-TASK-05, US-TASK-06, FR-02 | e2e S5 |
| A6 | S6: task with past due date shows overdue marker; done task does not | US-TASK-07, D-12 | e2e S6 |
| A7 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01 S1 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T17:42+03:00)
- Context: iteration 3 built T01–T06 but its session ended before any trial was recorded (empty `evidence/M02/trial-1/`). This trial was run interactively, following the VERIFY procedure.
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M02-tasks.md` S1–S6 with Playwright MCP; M01 S1 smoke; servers stopped.
- A1 S1 ✅ · A2 S2 ✅ (required + 200-char errors, only 1 POST sent) · A3 S3 ✅ · A4 S4 ✅ (archived view empty after delete, checked via API) · A5 S5 ✅ (requests `q=gamm`, `status=IN_PROGRESS`, `priority=HIGH`, `dueFrom=2026-10-10&dueTo=2026-10-16`, `sort=dueDate&dir=asc`; extra check: `desc` reorders to Gamma, Delta, Alpha) · A6 S6 ✅ · A7 ✅ no console errors, no 5xx
- Regression: M01 S1 smoke 8/8 ✅
- Evidence: `evidence/M02/trial-1/M02-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
