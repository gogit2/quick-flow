# M06 scenarios
Fresh DB. `{ts}` = a unique suffix per run. Date-times are typed into `datetime-local` inputs (browser time zone). `{p}` = plan id; `{it}`, `{ih}`, `{ic}` = the plan's task / habit / learning item ids (from `plan-item-toggle-<id>`).

## S1 [smoke] Item toggles drive progress and status
Proves: US-PLAN-05, US-PLAN-09, FR-07 (item done), FR-08 (progress, auto status)
| Step | Action | Expected |
|---|---|---|
| 1 | setup: create task "Item task {ts}", habit "Item habit {ts}", card "Item card {ts}" with the API (curl; creating them in the UI is covered by M02–M05 S1); then in the UI build "Items plan {ts}" (start now − 5 min, end now + 1 h) with all three | plan-card-{p} In progress, "0 / 3 items · 0%" |
| 2 | click plan-item-toggle-{it} | "1 / 3 items · 33%"; item checked; still In progress |
| 3 | click plan-item-toggle-{ih}, then plan-item-toggle-{ic} | "3 / 3 items · 100%"; status Completed; card in plans-group-completed; plans-group-active empty |

## S2 BR-13 side effects, no revert
Proves: BR-13, D-47
| Step | Action | Expected |
|---|---|---|
| 1 | open /tasks | "Item task" status Done |
| 2 | open /habits | "Item habit" toggle "Done today" |
| 3 | /plans: click plan-item-toggle-{it} (un-mark) | "2 / 3 · 67%"; status In progress (now < end); card back in the active group |
| 4 | open /tasks | "Item task" still Done (un-marking does not revert) |

## S3 Start notification
Proves: US-PLAN-07, FR-08 (notify), D-46, UX Todo Plans (notification/highlight)
| Step | Action | Expected |
|---|---|---|
| 1 | build "Soon plan {ts}" with start = the next whole minute (≥ 30 s away), end = start + 30 min, item = the card | card Not started, no rest time |
| 2 | wait ≤ 90 s (browser_wait_for text "has started") | snackbar "Plan 'Soon plan {ts}' has started"; plan-started-{id} badge on the card; status In progress; rest time visible |
| 3 | reload /plans; wait 5 s | no "has started" snackbar; localStorage `qf.notifiedPlans` contains the id |

## S4 History
Proves: US-PLAN-10, D-49
| Step | Action | Expected |
|---|---|---|
| 1 | build "Past plan {ts}" with start = now − 2 h, end = now − 1 h, item = the task | card in the Completed group, "0 / 1 · 0%" |
| 2 | Items plan: click plan-item-toggle-{it} again | Items plan Completed, 100% |
| 3 | read plans-history | rows for "Items plan" (3 / 3 · 100%) and "Past plan" (0 / 1 · 0%), most recent end first (Items plan's end is later) |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S2.1 | S2.2 | S2.3 | S2.4 | S3.1 | S3.2 | S3.3 | S4.1 | S4.2 | S4.3 | M01 S1 | M02 S1 | M03 S1 | M04 S1 | M05 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ (sources via API) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 7/7 | ✅ | ✅ | ✅ | ✅ | ✅ none | ✅ none | evidence/M06/trial-1/M06-trial-1-start-notification.png, M06-trial-1-final.png |
