# M02: Tasks

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | pending |
| Depends on | M01 |
| Stories | US-TASK-01, US-TASK-02, US-TASK-03, US-TASK-04, US-TASK-05, US-TASK-06, US-TASK-07 |
| Requirements | FR-01, FR-02, BR-1, BR-2, BR-3, BR-4, BR-5, BR-14, D-10..D-14 |

## 1. Spec (what and why)
Full task CRUD with archive/restore, complete, search, filters, sorting and an `overdue` flag on every task. Hard delete. Not included: dashboard aggregates (M07), plan side effects (M06).

## 2. Design notes (how)
- `V2__tasks.sql`: `task(id bigint identity, title varchar(200) not null, description varchar(2000), status varchar(20), priority varchar(10), due_date date, created_at, updated_at, completed_at, archived boolean default false)`.
- `task/domain`: `Task` entity, `TaskStatus {TODO, IN_PROGRESS, DONE}`, `TaskPriority {LOW, MEDIUM, HIGH}`, `TaskRules` (pure): `applyStatus(task, newStatus, now)` sets/clears `completedAt` (D-11); `isOverdue(task, today)` (D-12).
- `task/api`: `TaskController` at `/api/v1/tasks`:
  - `GET /tasks?q=&status=&priority=&dueFrom=&dueTo=&dueDate=&archived=false&sort=dueDate|createdAt&dir=asc|desc` (D-13, D-14; null due dates last).
  - `GET /tasks/{id}`, `POST /tasks` (status default TODO, priority default MEDIUM), `PUT /tasks/{id}`, `DELETE /tasks/{id}` (204),
  - `POST /tasks/{id}/complete`, `POST /tasks/{id}/archive`, `POST /tasks/{id}/restore`.
  - `TaskResponse` includes `overdue`, `completedAt`, `archived`.
- Validation: `@NotBlank @Size(max=200)` title, `@Size(max=2000)` description; invalid enum → 400 (BR-3).
- Filtering via JPA Specification or in-memory stream over non-deleted rows (dataset is single-user; Specification preferred).
- Expose a `TaskService.completeFromPlan(id)` hook for M06 and a deletion event/hook so M06 can remove plan items (D-48). Keep simple: M06 will add the cascade call.

## 3. Tasks
- [ ] M02-T01 Migration `V2__tasks.sql` + `Task` entity + enums + `TaskRepository` (JpaSpecificationExecutor)
- [ ] M02-T02 `TaskRules` (completedAt set/clear, overdue) + unit tests with fixed Clock
- [ ] M02-T03 `TaskService`: create/get/update/delete/complete/archive/restore
- [ ] M02-T04 Search/filter/sort query (q, status, priority, due-date range/equality, archived, sort, dir; nulls last)
- [ ] M02-T05 `TaskController` + request/response records + mapper + Swagger annotations
- [ ] M02-T06 Curl suite `outputs/curl/M02-tasks.sh` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | POST valid task → 201, Location header, body echoes fields, status TODO, archived false | FR-01, US-TASK-01 | `outputs/curl/M02-tasks.sh` case 1 |
| A2 | POST with blank title → 400 with `errors.title` | BR-1 | case 2 |
| A3 | POST title 201 chars → 400; description 2001 chars → 400 | BR-1, BR-2 | case 3 |
| A4 | POST with `status: "FOO"` or `priority: "X"` → 400 (not 500) | BR-3 | case 4 |
| A5 | PUT updates title/priority/dueDate → 200, `updatedAt` changes | US-TASK-02 | case 5 |
| A6 | POST /complete → status DONE, `completedAt` set; PUT back to TODO clears `completedAt` | US-TASK-03, BR-5, D-11 | case 6 |
| A7 | Archive → excluded from default list, present with `?archived=true`; restore → back in default list | US-TASK-04, BR-4, D-13 | case 7 |
| A8 | DELETE → 204; GET → 404; not in any list | US-TASK-04, BR-14 | case 8 |
| A9 | `?q=<substring, mixed case>` returns only matching; `status` + `priority` filters combine (AND) | US-TASK-05/06, FR-02 | case 9 |
| A10 | `sort=dueDate&dir=asc` orders by date, null due dates last; `sort=createdAt&dir=desc` works | FR-02, D-14 | case 10 |
| A11 | Task with dueDate yesterday, status TODO → `overdue: true`; same but DONE → false; due today → false | US-TASK-07, D-12 | case 11 |
| A12 | GET/PUT/DELETE unknown id → 404 ProblemDetail | D-05 | case 12 |
| A13 | Unit tests for `TaskRules` pass | PRD §11 | verify.log |

Regression: M01 suite stays green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

## 6. Notes / Blocked
