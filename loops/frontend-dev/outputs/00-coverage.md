# Frontend coverage: requirement → milestone → scenario step

Scenario refs are `Mxx Sn` in `outputs/e2e/Mxx-*.md` (written during BUILD). Status column is filled on PASS.

## User stories
| Story | Text (short) | Milestone | Scenario | Status |
|---|---|---|---|---|
| US-TASK-01 | create task | M02 | M02 S1, M09 S1 | ✅ |
| US-TASK-02 | edit task | M02 | M02 S3 | ✅ |
| US-TASK-03 | complete task | M02 | M02 S3, M09 S1 | ✅ |
| US-TASK-04 | delete/archive task | M02 | M02 S4 | ✅ |
| US-TASK-05 | filter by status/priority | M02 | M02 S5 | ✅ |
| US-TASK-06 | search tasks | M02 | M02 S5 | ✅ |
| US-TASK-07 | see overdue tasks | M02 | M02 S6 | ✅ |
| US-HABIT-01 | create habit | M03 | M03 S1, M09 S1 | ✅ |
| US-HABIT-02 | daily/weekly | M03 | M03 S1, S2 | ✅ |
| US-HABIT-03 | complete for today | M03 | M03 S3, M09 S1 | ✅ |
| US-HABIT-04 | completion progress | M03 | M03 S3 | ✅ |
| US-HABIT-05 | remove habit | M03 | M03 S4 | ✅ |
| US-LEARN-01 | add card | M04 | M04 S1, M09 S1 | ✅ |
| US-LEARN-02 | remove card | M04 | M04 S4 | ✅ |
| US-LEARN-03 | add milestones | M04 | M04 S2, M09 S1 | ✅ |
| US-LEARN-04 | complete milestones | M04 | M04 S2, M09 S1.6 | ✅ |
| US-LEARN-05 | notes | M04 | M04 S3 | ✅ |
| US-PLAN-01 | create plan from items | M05 | M05 S1, M09 S1 | ✅ |
| US-PLAN-02 | estimated time | M05 | M05 S1 | ✅ |
| US-PLAN-03 | start/end date-time | M05 | M05 S1, S4 | ✅ |
| US-PLAN-04 | priority order | M05 | M05 S1 | ✅ |
| US-PLAN-05 | mark items done | M06 | M06 S1, M09 S1 | ✅ |
| US-PLAN-06 | remove plan | M05 | M05 S5 | ✅ |
| US-PLAN-07 | start notification | M06 | M06 S3 | ✅ |
| US-PLAN-08 | live rest time | M05 | M05 S2 | ✅ |
| US-PLAN-09 | completion progress | M05, M06 | M05 S1, M06 S1, M09 S1.10–12 | ✅ |
| US-PLAN-10 | history | M06 | M06 S4, M09 S1.12 | ✅ |
| US-DASH-01 | today's tasks | M08 | M08 S1, S2, M09 S1.7 | ✅ |
| US-DASH-02 | overdue tasks | M08 | M08 S2 | ✅ |
| US-DASH-03 | today's habits | M08 | M08 S3, M09 S1.7 | ✅ |
| US-DASH-04 | completion % | M08 | M08 S2, M09 S1.7, S1.13 | ✅ |
| US-DASH-05 | active plans + rest time | M08 | M08 S4, M09 S1.9 | ✅ |
| US-DASH-06 | learning snapshot | M08 | M08 S5, M09 S1.7, S1.13 | ✅ |

## UX requirements
| UX item | Milestone | Scenario | Status |
|---|---|---|---|
| Main navigation (6 pages) | M01 | M01 S1 | ✅ |
| Dashboard 1 greeting | M08 | M08 S1 | ✅ |
| Dashboard 2 metric cards | M08 | M08 S1, S2 | ✅ |
| Dashboard 3 today's tasks | M08 | M08 S2 | ✅ |
| Dashboard 4 habit checklist | M08 | M08 S3 | ✅ |
| Dashboard 5 active plans live | M08 | M08 S4 | ✅ |
| Dashboard 6 quick-add | M08 | M08 S2 | ✅ |
| Tasks: search, filters, add, edit/delete/archive, empty state | M02 | M02 S1–S5 | ✅ |
| Habits: add, cards w/ toggle, frequency, streak, edit/deactivate/remove, empty | M03 | M03 S1–S4 | ✅ |
| Learning: add, grid, expand, milestones/notes controls, empty | M04 | M04 S1–S4 | ✅ |
| Plans: builder, fields, grouped list, progress, rest time, toggles, remove, empty | M05, M06 | M05 S1–S5, M06 S1 | ✅ |
| Plans: start notification/highlight | M06 | M06 S3 | ✅ |
| Settings: profile + preferences | M07 | M07 S1–S3 | ✅ |
| NFR Usability: add/remove on every list page, empty states guide to add | M09 | M09 S2.1–S2.5 |
| UX: validation messages visible on every add form | M02–M05, M09 | M02 S2, M03 S2, M04 S4, M05 S4, M09 S2.1–S2.4 |
| UX: loading and load-error (retry) states instead of a misleading empty list | M09 | M09 S3 | ✅ |

## Acceptance criteria (PRD §12)
| AC | Milestone | Scenario | Status |
|---|---|---|---|
| Tasks: CRUD/complete/archive | M02 | M02 S1, S3, S4 | ✅ |
| Tasks: required fields validated | M02 | M02 S2 | ✅ |
| Tasks: search & filters | M02 | M02 S5 | ✅ |
| Tasks: overdue identified | M02 | M02 S6 | ✅ |
| Habits: daily/weekly create | M03 | M03 S1, S2 | ✅ |
| Habits: complete today, no duplicate | M03 | M03 S3 | ✅ |
| Habits: deactivate/remove | M03 | M03 S4 | ✅ |
| Learning: add/remove card | M04 | M04 S1, S4 | ✅ |
| Learning: milestones add/complete/remove | M04 | M04 S2 | ✅ |
| Learning: notes add/remove | M04 | M04 S3 | ✅ |
| Plans: create from items | M05 | M05 S1 | ✅ |
| Plans: duration/start/end/priority | M05 | M05 S1, S4 | ✅ |
| Plans: item done updates progress | M06 | M06 S1 | ✅ |
| Plans: remove | M05 | M05 S5 | ✅ |
| Plans: start notification | M06 | M06 S3 | ✅ |
| Plans: rest time counts down | M05 | M05 S2 | ✅ |
| Plans: progress = done/total | M05, M06 | M05 S1, M06 S1 | ✅ |
| Plans: item changes reflected in plan + dashboard | M06, M08, M09 | M06 S1, M08 S4, M09 S1.9–S1.13 | ✅ |
| Dashboard: today/overdue/habits shown | M08 | M08 S2, S3 | ✅ |
| Dashboard: metrics match data | M08, M09 | M08 S2, S5, M09 S1.7, S1.13 | ✅ |
| Dashboard: active plans live | M08 | M08 S4 | ✅ |
| Dashboard: learning snapshot | M08 | M08 S5 | ✅ |
| PRD §11 E2E journey | M09 | M09 S1.1–S1.13 | ✅ |
