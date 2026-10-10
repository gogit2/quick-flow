# M04 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{id}` = the card id read from the card testid; `{m1}`, `{m2}`, `{n1}` = milestone / note ids read from row testids.

## S1 [smoke] Empty state → add a learning card
Proves: US-LEARN-01, FR-05, BR-8, UX Learning Resources Page (Add Learning Card, empty state)
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/learning | h1 "Learning Resources"; empty-state-learning with "Add Learning Card" action |
| 2 | click empty-state-learning-action; type learning-form-title "Angular course {ts}"; learning-form-description "angular.dev tutorial"; click learning-form-save | card "Angular course {ts}" visible; learning-status-{id} "Not started"; "0 / 0 milestones"; empty state gone |

## S2 Milestones drive the status
Proves: US-LEARN-03, US-LEARN-04, FR-06, D-31, A-07
| Step | Action | Expected |
|---|---|---|
| 1 | click learning-expand-{id} | details visible: status select, milestones-empty-{id}, notes-empty-{id} |
| 2 | click milestone-add-{id} with empty input | milestone-input-error-{id} "Milestone title is required"; no request sent |
| 3 | add "Basics" (target date today + 7) and "Signals" | 2 milestone rows; Basics shows "Target …"; "0 / 2 milestones"; status "Not started" |
| 4 | click milestone-toggle-{m1} | Basics checked; status "In progress"; "1 / 2 · 50%" |
| 5 | click milestone-toggle-{m2} | status "Completed"; "2 / 2 · 100%" |
| 6 | click milestone-toggle-{m2} (undo) | status "In progress"; "1 / 2" |
| 7 | click milestone-delete-{m2} | Signals row gone; "1 / 1 · 100%"; status "Completed" (re-derived on removal, A-07) |
| 8 | learning-status-select-{id} → Not started (manual, D-31) | status chip "Not started" |

## S3 Notes
Proves: US-LEARN-05, FR-06
| Step | Action | Expected |
|---|---|---|
| 1 | click note-add-{id} with empty input | note-input-error-{id} "Note text is required" |
| 2 | type note-input-{id} "Chapter 3 is key"; click note-add-{id} | note-row-{n1} with that text and a note-time timestamp (today); input cleared |
| 3 | click note-delete-{n1} | note row gone; notes-empty-{id} |

## S4 Remove card and validation
Proves: US-LEARN-02, BR-8, D-32
| Step | Action | Expected |
|---|---|---|
| 1 | click learning-add-btn; click learning-form-save with empty title | learning-form-title-error "Title is required"; dialog stays open; no POST |
| 2 | type title "Book {ts}"; save | 2 cards |
| 3 | click learning-delete-{id}; click confirm-ok | "Angular course" card gone; 1 card left |

### Results
| Trial | S1.1 | S1.2 | S2.1 | S2.2 | S2.3 | S2.4 | S2.5 | S2.6 | S2.7 | S2.8 | S3.1 | S3.2 | S3.3 | S4.1 | S4.2 | S4.3 | M01 S1 | M02 S1 | M03 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 8/8 | ✅ | ✅ | ✅ none | ✅ none | evidence/M04/trial-1/M04-trial-1-final.png |
