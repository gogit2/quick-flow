# M05 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{now}` = browser local time; date-times are typed into `datetime-local` inputs as `yyyy-MM-ddTHH:mm`. `{t}`, `{h}`, `{c}` = ids of the task, habit and learning card created in S1; `{p}` = plan id from the card testid.

## S1 [smoke] Empty state → build a plan from a task, a habit and a learning card
Proves: US-PLAN-01..04, US-PLAN-09, FR-07, UX Todo Plans Page (Create Plan, empty state)
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/plans | h1 "Todo Plans"; empty-state-plans with "Create Plan" action |
| 2 | create task "Plan task {ts}" on /tasks, habit "Plan habit {ts}" on /habits, card "Plan card {ts}" on /learning (UI) | each visible on its page |
| 3 | /plans → click empty-state-plans-action | builder open; plan-sources-task/habit/learning list the three sources (plan-source-task-{t}, plan-source-habit-{h}, plan-source-learning-{c}) |
| 4 | title "Morning plan {ts}"; start = now − 5 min; end = now + 1 h; duration 65; priority 1; tick the three sources; save | dialog closed; plan-card-{p} in plans-group-active; plan-status "In progress"; plan-progress "0 / 3 items · 0%"; 3 plan-item rows with the source titles |

## S2 Live rest time
Proves: US-PLAN-08, FR-08, D-45
| Step | Action | Expected |
|---|---|---|
| 1 | read plan-rest-time-{p} | format `HH:MM:SS`; value = end − now (±1 s), e.g. ≈ 01:00:xx when end was typed as now + 1 h rounded up to the next minute |
| 2 | wait ≥ 2 s; read again | value decreased by ≈ the elapsed seconds |

## S3 Upcoming plan
Proves: BR-12, D-43, D-41
| Step | Action | Expected |
|---|---|---|
| 1 | create "Tomorrow plan {ts}" with start = now + 1 day, end = start + 2 h, priority 2, item = the task | card in plans-group-active, status "Not started", plan-starts-{id} visible, no plan-rest-time-{id} |
| 2 | order in the active group | "Morning plan" (In progress) before "Tomorrow plan" (Not started) |

## S4 Builder validation
Proves: BR-10, BR-11, AC "required fields are validated"
| Step | Action | Expected |
|---|---|---|
| 1 | open builder; title "Bad {ts}"; select nothing; save | plan-form-items-error "Select at least one…"; dialog open; no POST |
| 2 | tick a source; set end = start − 1 h; save | plan-form-range-error "End must be after the start"; no POST |
| 3 | clear title; save | plan-form-title-error "Title is required"; no POST; cancel → plan count unchanged |

## S5 Remove plan
Proves: US-PLAN-06
| Step | Action | Expected |
|---|---|---|
| 1 | click plan-delete-{tomorrow}; confirm-ok | card gone; 1 plan left; the task still exists on /tasks |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S1.4 | S2.1 | S2.2 | S3.1 | S3.2 | S4.1 | S4.2 | S4.3 | S5.1 | M01 S1 | M02 S1 | M03 S1 | M04 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ (see note) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 7/7 | ✅ | ✅ | ✅ | ✅ app: none (see note) | ✅ none | evidence/M05/trial-1/M05-trial-1-final.png |
