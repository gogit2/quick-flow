# M09 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{today}` = browser date. Run order: **S2 first** (it needs empty lists and leaves them empty), then S1, then S3.

## S1 [smoke] Full journey (PRD §11)
Proves: PRD §11 E2E coverage; US-TASK-01/03, US-HABIT-01/03, US-LEARN-01/03/04, US-PLAN-01/05/09/10, US-DASH-01..06; AC Plans "item changes reflected in plan + dashboard"
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/ | redirected to /dashboard; dash-task-completion "0%"; dash-habits-done "0 / 0"; dash-plans-active "0"; dash-learning-in-progress "0" |
| 2 | /tasks: task-add-btn → "Journey task {ts}", due {today}, priority High; save | row visible, status "To do" |
| 3 | click task-complete-{a} | task-status-{a} "Done" |
| 4 | add "Journey plan task {ts}" (no due date); save | second row, "To do" |
| 5 | /habits: habit-add-btn → "Journey habit {ts}", Daily; save; click habit-toggle-{h} | toggle pressed; habit-streak "1 day streak" |
| 6 | /learning: learning-add-btn → "Journey course {ts}"; save; learning-expand-{c}; add milestones "Chapter 1", "Chapter 2"; tick milestone-toggle of "Chapter 1" | learning-status "In progress"; learning-progress "1 / 2 milestones · 50%" |
| 7 | /dashboard | completion "50%" ("1 of 2 · 1 today"); habits "1 / 1"; learning In progress 1, dash-learning-milestones-7d "1" |
| 8 | /plans: plan-add-btn → "Journey plan {ts}", start = now − 1 min, end = now + 1 h, items: "Journey plan task", "Journey habit", "Journey course"; save | plan card In progress; plan-progress "0 / 3 items · 0%"; rest time HH:MM:SS |
| 9 | /dashboard | dash-plans-active "1"; dash-plan-progress "0 / 3 items · 0%" |
| 10 | /plans: toggle item "Journey plan task" | "1 / 3 items · 33%"; item status "done" (task set to DONE, D-47) |
| 11 | toggle item "Journey habit" | "2 / 3 items · 67%" (existing completion today is ignored, no error) |
| 12 | toggle item "Journey course" | "3 / 3 items · 100%"; plan moves to Completed group, status "Completed"; plans-history row "Journey plan {ts}" 100% |
| 13 | /dashboard | completion "100%" ("2 of 2"); habits "1 / 1"; dash-plans-active "0" + empty-state-dash-plans; learning In progress 1 ("1 / 2 milestones", the learning item has no side effect) |

## S2 UX pass: empty states, add, validation, remove
Proves: NFR Usability, DoD (add + remove on every list page, empty state points to add, validation messages visible)
| Step | Action | Expected |
|---|---|---|
| 1 | /tasks: click empty-state-tasks-action | "Add task" dialog opens; click task-form-save with an empty title → task-form-title-error "Title is required"; type "UX task {ts}"; save → row; task-delete + confirm-ok → empty-state-tasks again |
| 2 | /habits: click empty-state-habits-action | "Add habit" dialog; empty save → habit-form-name-error; "UX habit {ts}" saved → card; habit-delete + confirm-ok → empty-state-habits |
| 3 | /learning: click empty-state-learning-action | "Add learning card" dialog; empty save → learning-form-title-error; "UX course {ts}" saved → card; learning-delete + confirm-ok → empty-state-learning |
| 4 | /plans: click empty-state-plans-action | "Create plan" dialog; empty title + no items, save → plan-form-title-error "Title is required" and plan-form-items-error "Select at least one task, habit or learning card"; no POST; cancel. Then create task "UX plan src {ts}" on /tasks, build plan "UX plan {ts}" from it; plan-delete + confirm-ok → empty-state-plans; delete the task → empty-state-tasks |
| 5 | /dashboard | every panel shows its empty state; its link opens the matching page (check "Add a habit" → /habits) |

## S3 Load failure shows an error with retry (expected errors)
Proves: UX pass (loading/error states, M09-T02)
Console errors and proxy 5xx in this scenario are **expected** (the backend is down on purpose) and are not counted in the Console/5xx columns, which cover S1 and S2.
| Step | Action | Expected |
|---|---|---|
| 1 | `scripts/backend.sh stop-stable`; navigate {app_url}/tasks | load-error-tasks "Could not load tasks." with a Retry button; **no** empty-state-tasks ("No tasks yet") |
| 2 | navigate /dashboard | load-error-dashboard visible |
| 3 | `scripts/backend.sh start-stable` (same DB); click load-error-dashboard-retry | dashboard renders with the S1 data (completion "100%") |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S1.4 | S1.5 | S1.6 | S1.7 | S1.8 | S1.9 | S1.10 | S1.11 | S1.12 | S1.13 | S2.1 | S2.2 | S2.3 | S2.4 | S2.5 | S3.1 | S3.2 | S3.3 | M01–M08 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 8/8 | ✅ none (S1/S2) | ✅ none | evidence/M09/trial-1/M09-trial-1-journey-final.png |
