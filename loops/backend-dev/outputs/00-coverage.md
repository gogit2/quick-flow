# Requirement coverage (backend-dev)

Status is filled in by VERIFY / FINAL (`pending` → `pass`). Check IDs point to the milestone file §4.

| Requirement | Milestone | Check(s) | Status |
|---|---|---|---|
| US-TASK-01 create task | M02 | A1 | pending |
| US-TASK-02 edit task | M02 | A5 | pending |
| US-TASK-03 complete task | M02 | A6 | pending |
| US-TASK-04 delete/archive task | M02 | A7, A8 | pending |
| US-TASK-05 filter status/priority | M02 | A9 | pending |
| US-TASK-06 search | M02 | A9 | pending |
| US-TASK-07 overdue | M02 | A11 | pending |
| US-HABIT-01 create habit | M03 | A1 | pass (M03 trial 1) |
| US-HABIT-02 daily/weekly | M03 | A1 | pass (M03 trial 1) |
| US-HABIT-03 complete today | M03 | A3 | pass (M03 trial 1) |
| US-HABIT-04 progress | M03 | A6 | pass (M03 trial 1) |
| US-HABIT-05 remove habit | M03 | A9 | pass (M03 trial 1) |
| US-LEARN-01 add card | M04 | A1 | pending |
| US-LEARN-02 remove card | M04 | A8 | pending |
| US-LEARN-03 add milestones | M04 | A3 | pending |
| US-LEARN-04 complete milestones | M04 | A4 | pending |
| US-LEARN-05 notes | M04 | A6 | pending |
| US-PLAN-01 create plan from items | M05 | A1 | pending |
| US-PLAN-02 estimated time | M05 | A1, A6 | pending |
| US-PLAN-03 start/end | M05 | A1, A5 | pending |
| US-PLAN-04 priority order | M05 | A1, A7 | pending |
| US-PLAN-05 mark item done | M06 | A1 | pending |
| US-PLAN-06 remove plan | M05 | A9 | pending |
| US-PLAN-07 start notification (backend data: status, startsInSeconds, serverTime) | M05 | A2, A10 | pending |
| US-PLAN-08 rest time | M05 | A1, A2, A3 | pending |
| US-PLAN-09 completion progress | M05, M06 | M05-A1, M06-A1 | pending |
| US-PLAN-10 history | M06 | A7 | pending |
| US-DASH-01 today's tasks | M07 | A3 | pending |
| US-DASH-02 overdue tasks | M07 | A3 | pending |
| US-DASH-03 today's habits | M07 | A5 | pending |
| US-DASH-04 completion % | M07 | A4 | pending |
| US-DASH-05 active plans + rest time | M07 | A6 | pending |
| US-DASH-06 learning snapshot | M07 | A7 | pending |
| FR-01 task entity + CRUD/archive/restore | M02 | A1, A5–A8 | pending |
| FR-02 search/filter/sort | M02 | A9, A10 | pending |
| FR-03 habit entity + CRUD/deactivate | M03 | A1, A8, A9 | pass (M03 trial 1) |
| FR-04 habit completion, no duplicates | M03 | A3, A4 | pass (M03 trial 1) |
| FR-05 learning card | M04 | A1, A8 | pending |
| FR-06 milestones + notes | M04 | A3, A4, A6, A7 | pending |
| FR-07 plan composition | M05, M06 | M05-A1, A8; M06-A1 | pending |
| FR-08 progress, rest time, auto status | M05, M06, M07 | M05-A1–A3; M06-A6; M07-A6 | pending |
| FR-09 dashboard | M07 | A2–A7 | pending |
| BR-1 task title required ≤200 | M02 | A2, A3 | pending |
| BR-2 description ≤2000 | M02 | A3 | pending |
| BR-3 valid status/priority | M02, M08 | M02-A4; M08-A4 | pending |
| BR-4 archived excluded by default | M02 | A7 | pending |
| BR-5 completed = DONE | M02 | A6 | pending |
| BR-6 habit name required ≤150 | M03 | A2 | pass (M03 trial 1) |
| BR-7 one completion per date | M03 | A4 | pass (M03 trial 1) |
| BR-8 card title required | M04 | A2 | pending |
| BR-9 milestone belongs to one card | M04 | A7 | pending |
| BR-10 plan ≥1 existing item | M05 | A4 | pending |
| BR-11 end after start | M05 | A5 | pending |
| BR-12 rest time only between start/end | M05 | A2, A3 | pending |
| BR-13 plan item side effects | M06 | A2–A5 | pending |
| BR-14 deleted not returned | M02, M03, M04, M05, M06 | M02-A8, M03-A9, M04-A8, M05-A9, M06-A8 | pending |
| Settings (D-51) | M07 | A1 | pending |
| NFR Performance <500 ms | M08 | A5 | pending |
| NFR Reliability (derived status, file DB) | M01, M05 | M01-A1, M05-A11 | pending |
| PRD §11 unit tests for rules | M01–M07 | verify.log each | pending |
