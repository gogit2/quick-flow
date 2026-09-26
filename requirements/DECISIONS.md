# Decisions and Clarifications (QuickFlow)

The PRD leaves these points open. Every loop must follow them. A human may edit any entry before or between runs.
Loops append new entries under "Assumed during loop runs" instead of stopping to ask.

## Platform
| ID | Decision |
|---|---|
| D-01 | **Single user, no authentication.** No login, no user table. Settings is one row. |
| D-02 | Stack: **Java 17 + Spring Boot 3.5 + Maven** (backend, `backend/`), **Angular 19 + Angular Material** (frontend, `frontend/`). The Node 18 and Java 17 on the machine set these versions. |
| D-03 | Persistence: **H2 file database** managed by Flyway (zero setup, survives restarts, which meets the NFR "persist between sessions"). |
| D-04 | Time: the backend stores timestamps as UTC `Instant`. "Today", "overdue" and "this week" are computed in the zone `app.zone` (default: the server's system zone). Weeks follow ISO (Monday–Sunday). All time logic uses an injected `Clock`. |
| D-05 | API base path `/api/v1`. Errors use RFC 7807 ProblemDetail (400 validation/business rule, 404, 409 duplicate). |

## Tasks
| ID | Decision |
|---|---|
| D-10 | `dueDate` is a date (`LocalDate`) and is optional. |
| D-11 | Add a nullable `completedAt` (Instant). It is set when the status becomes DONE and cleared when the status leaves DONE. It is needed for "completed tasks today". |
| D-12 | **Overdue** = `dueDate < today` AND status ≠ DONE AND not archived. The API returns an `overdue` boolean on each task. |
| D-13 | Archive and restore are separate actions (`POST /tasks/{id}/archive`, `/restore`). The default list excludes archived tasks, and `?archived=true` lists only archived ones. **Delete is a hard delete** (BR-14). |
| D-14 | Search = case-insensitive "contains" on the title. Filters combine with AND. Sort: `dueDate` or `createdAt`, `asc`/`desc`. Tasks with no due date sort last. |
| D-15 | Task completion percentage (dashboard) = DONE ÷ all non-archived tasks, rounded to an integer. 0 when there are no tasks. |

## Habits
| ID | Decision |
|---|---|
| D-20 | Completing a habit records a completion for **today**. The API also accepts an explicit date (not in the future). A duplicate (habit, date) returns **409**. Un-completing today deletes today's record. |
| D-21 | Daily habit: "done today" = a completion exists for today. Weekly habit: "done this period" = at least one completion in the current ISO week. |
| D-22 | Streak: for a daily habit, the number of consecutive days with a completion, ending today (or yesterday if today is not done yet). For a weekly habit, the same with consecutive ISO weeks. Returned as `currentStreak`. |
| D-23 | Progress shown on the card: daily = completions in the last 7 days ÷ 7. Weekly = completions in the last 4 weeks ÷ 4. Returned as `progressPercent`. |
| D-24 | "Today's habits" (dashboard) = active daily habits, plus active weekly habits not yet done this week. Deactivated habits are hidden from today's lists but kept. |
| D-25 | Delete is a hard delete and cascades to the habit's completions. |

## Learning resources
| ID | Decision |
|---|---|
| D-30 | A milestone gets a nullable `completedAt` (set when it is marked done, cleared when un-done). "Milestones completed recently" = the last 7 days. |
| D-31 | Card status is **derived automatically** when its milestones change: no milestones done → NOT_STARTED; some done → IN_PROGRESS; all done (at least one milestone) → COMPLETED. The user may also set the status manually. A later milestone change re-derives it. |
| D-32 | Deleting a card cascades to its milestones and notes. |

## Todo plans
| ID | Decision |
|---|---|
| D-40 | `estimatedDuration` is a positive integer in **minutes**. It is informational and is not checked against the start–end window. |
| D-41 | `priorityOrder` is an integer ≥ 1, where **1 = highest priority**. Values do not have to be unique. Plan lists sort by status group, then priorityOrder, then startDateTime. |
| D-42 | `startDateTime` / `endDateTime` are Instants. The end must be after the start (BR-11) → 400. A plan must have ≥ 1 item (BR-10), and each item must reference an existing source → 400. The same source cannot appear twice in one plan. |
| D-43 | **Status is derived by a pure domain function** each time it is read or written, so it is correct after a restart (NFR Reliability): **COMPLETED** if all items are done OR now ≥ end; **IN_PROGRESS** if start ≤ now < end; otherwise **NOT_STARTED**. The persisted column is refreshed but never trusted over the function. |
| D-44 | Progress % = done items ÷ total items (integer). The API returns `progressPercent`, `doneItems`, `totalItems`, `remainingSeconds` (only while IN_PROGRESS, else null), and `serverTime` so the client can correct for clock skew. |
| D-45 | Rest time: the frontend counts down every **1 s** from `endDateTime` using a shared `now` signal (the NFR asks for ≥ 1/min). It is shown only between start and end (BR-12). Format `HH:MM:SS`, or `Xd HH:MM:SS` for more than 24 h. |
| D-46 | Start notification is **in-app**: the frontend checks plans at least every 30 s, and when a plan crosses its start it shows a snackbar ("Plan '<title>' has started") and highlights the plan card. If the browser-notifications setting is on and permission is granted, it also shows a browser Notification. Plans already notified are remembered in localStorage so the notification does not repeat. |
| D-47 | Plan item side effects (BR-13): marking a **Task** item done sets the task to DONE. Marking a **Habit** item done records a habit completion for today (an existing one is ignored, not an error). A **Learning** item has no side effect on the card. **Un-marking an item never reverts the source.** |
| D-48 | Each plan item response includes `sourceTitle` (and `sourceStatus`). If a source entity is deleted, the plan items referencing it are deleted too (BR-14). The plan remains, even if it becomes empty. |
| D-49 | History = COMPLETED plans, most recent end first, each with its final progress %. |

## Dashboard and settings
| ID | Decision |
|---|---|
| D-50 | One endpoint `GET /api/v1/dashboard` returns all the widgets in one payload (today's tasks, overdue, completed today, task completion %, today's habits with done flags, active plans with progress + remainingSeconds, learning snapshot: cards by status + milestones completed in the last 7 days). |
| D-51 | Settings: `displayName` (default "Friend", max 100), `notificationsEnabled` (true), `browserNotifications` (false), `defaultView` (enum of the six pages, default DASHBOARD). `GET`/`PUT /api/v1/settings`. The frontend opens `defaultView` at app start. |
| D-52 | Dashboard greeting: "Good morning/afternoon/evening, {displayName}", based on local time. |

## Assumed during loop runs
<!-- Loops append here: | ID | Loop/Milestone | Decision | -->
| ID | Loop/Milestone | Decision |
|---|---|---|
