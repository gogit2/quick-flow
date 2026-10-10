# M08 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{today}` = browser date; `{past}` = today − 2 days.

## S1 [smoke] Fresh dashboard
Proves: US-DASH-01, UX Dashboard 1–2, 6, D-52
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/dashboard | h1 "Dashboard"; dash-greeting "Good morning/afternoon/evening, Friend" (matches the local hour, A-02); dash-task-completion "0%"; dash-habits-done "0 / 0"; dash-plans-active "0"; dash-learning-in-progress "0"; empty-state-dash-today/-overdue/-habits/-plans/-learning visible; 4 quick-add buttons |

## S2 Tasks: today, overdue, completion
Proves: US-DASH-01, US-DASH-02, US-DASH-04, FR-09, D-15
| Step | Action | Expected |
|---|---|---|
| 1 | dash-quick-add-task → "Today task {ts}" due {today}; save | dialog closes; row in dash-today-tasks; completion "0%" (0 of 1) |
| 2 | on /tasks add "Late task {ts}" due {past}; back to /dashboard | row in dash-overdue-tasks with "Overdue" chip; "0 of 2" |
| 3 | click dash-task-complete-{today task} | dash-completed-today "1"; completion "50%" ("1 of 2"); task listed under Completed today |

## S3 Habits
Proves: US-DASH-03, D-24
| Step | Action | Expected |
|---|---|---|
| 1 | dash-quick-add-habit → "Daily habit {ts}" (Daily); save | habit in dash-today-habits; "0 / 1" |
| 2 | click dash-habit-toggle-{id} | "1 / 1"; toggle pressed; click again → "0 / 1" |

## S4 Active plan, rest time, item change reflected
Proves: US-DASH-05, FR-08 (dashboard reflects item changes)
| Step | Action | Expected |
|---|---|---|
| 1 | dash-quick-add-plan → "Dash plan {ts}", start now − 5 min, end now + 1 h, items = today task's sibling "Late task" + the habit; save | plan in dash-active-plans; dash-plans-active "1"; dash-plan-progress "0 / 2 · 0%" |
| 2 | read dash-plan-rest-time-{p} twice ≥ 2 s apart | HH:MM:SS, decreasing |
| 3 | on /plans toggle the habit item; back to /dashboard | dash-plan-progress "1 / 2 · 50%"; habits "1 / 1" (BR-13 side effect) |

## S5 Learning snapshot
Proves: US-DASH-06
| Step | Action | Expected |
|---|---|---|
| 1 | dash-quick-add-learning → "Dash course {ts}"; save | Not started count 1 |
| 2 | on /learning add 2 milestones to it and complete 1; back to /dashboard | In progress 1, Not started 0; card in the learning panel "1 / 2 milestones"; dash-learning-milestones-7d "1" |

### Results
| Trial | S1.1 | S2.1 | S2.2 | S2.3 | S3.1 | S3.2 | S4.1 | S4.2 | S4.3 | S5.1 | S5.2 | M01 S1 | M02 S1 | M03 S1 | M04 S1 | M05 S1 | M06 S1 | M07 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 6/6 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ none | ✅ none | evidence/M08/trial-1/M08-trial-1-final.png |
