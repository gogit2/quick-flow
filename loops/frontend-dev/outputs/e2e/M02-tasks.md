# M02 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{id}` = the task id read from the row testid. Dates: `{past}` = today − 3 days, `{soon}` = today + 2, `{later}` = today + 10.

## S1 [smoke] Empty state → create a task
Proves: US-TASK-01, FR-01, UX Tasks Page (Add Task, empty state)
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/tasks | h1 "Tasks"; empty-state-tasks visible with "Add Task" action |
| 2 | click empty-state-tasks-action | dialog "Add task" open |
| 3 | type task-form-title "Alpha {ts}"; type task-form-description "first"; click task-form-save | dialog closed; row "Alpha {ts}" visible with status "To do", "Medium priority"; empty state gone |

## S2 Required-field validation
Proves: BR-1, AC "required fields are validated"
| Step | Action | Expected |
|---|---|---|
| 1 | click task-add-btn; click task-form-save (title empty) | task-form-title-error "Title is required"; dialog stays open; no POST sent |
| 2 | type task-form-title 201 × "a"; click task-form-save | task-form-title-error "at most 200 characters"; dialog stays open; no POST sent |
| 3 | click task-form-cancel | dialog closed; list unchanged (1 row) |

## S3 Edit and complete
Proves: US-TASK-02, US-TASK-03, BR-5
| Step | Action | Expected |
|---|---|---|
| 1 | click task-edit-{id}; change title to "Alpha edited {ts}"; priority → High; click task-form-save | row shows "Alpha edited {ts}" and "High priority" |
| 2 | click task-complete-{id} | row status "Done"; complete button gone |

## S4 Archive, restore, delete
Proves: US-TASK-04, BR-4, BR-14, D-13
| Step | Action | Expected |
|---|---|---|
| 1 | create "Beta {ts}"; click task-archive-{beta} | Beta row gone from the active list |
| 2 | click task-show-archived | Beta row visible with restore button |
| 3 | click task-restore-{beta}; click task-show-active | archived view empty (empty-state-tasks-archived); Beta back in the active list |
| 4 | click task-delete-{beta}; click confirm-ok | Beta row gone; not in archived view either |

## S5 Search, filters, sort
Proves: US-TASK-05, US-TASK-06, FR-02, D-14
| Step | Action | Expected |
|---|---|---|
| 1 | create "Gamma {ts}" (Low, due {later}) and "Delta {ts}" (High, In progress, due {soon}) | 3 rows (Alpha edited, Gamma, Delta) |
| 2 | type task-search "gamm" | only Gamma visible |
| 3 | clear search; task-filter-status → In progress | only Delta visible |
| 4 | status → All; task-filter-priority → High | Alpha edited and Delta visible, Gamma not |
| 5 | priority → All; task-filter-due → next 7 days | only Delta visible |
| 6 | due → Any; task-sort → Due date (soonest) | order Delta, Gamma, then Alpha edited (no due date last) |

## S6 Overdue marker
Proves: US-TASK-07, D-12
| Step | Action | Expected |
|---|---|---|
| 1 | create "Epsilon {ts}" due {past} | task-overdue-{eps} "Overdue" visible |
| 2 | click task-complete-{eps} | overdue chip gone; status "Done" |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S2.1 | S2.2 | S2.3 | S3.1 | S3.2 | S4.1 | S4.2 | S4.3 | S4.4 | S5.1 | S5.2 | S5.3 | S5.4 | S5.5 | S5.6 | S6.1 | S6.2 | M01 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 8/8 | ✅ none | ✅ none | evidence/M02/trial-1/M02-trial-1-final.png |
