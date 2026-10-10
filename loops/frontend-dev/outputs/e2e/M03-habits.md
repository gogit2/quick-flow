# M03 scenarios
Fresh DB. `{ts}` = a unique suffix per run. `{id}` = the habit id read from the card testid.

## S1 [smoke] Empty state → create a daily habit
Proves: US-HABIT-01, US-HABIT-02, FR-03, UX Habits Page (Add Habit, empty state)
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/habits | h1 "Habits"; empty-state-habits visible with "Add Habit" action |
| 2 | click empty-state-habits-action | dialog "Add habit" open; frequency defaults to Daily |
| 3 | type habit-form-name "Read {ts}"; click habit-form-save | dialog closed; habit-card-{id} "Read {ts}"; habit-frequency-{id} "Daily"; streak "0 days"; progress "0%"; empty state gone |

## S2 Weekly habit and validation
Proves: US-HABIT-02, BR-6, AC "required fields are validated"
| Step | Action | Expected |
|---|---|---|
| 1 | click habit-add-btn; click habit-form-save (name empty) | habit-form-name-error "Name is required"; dialog stays open; no POST sent |
| 2 | type habit-form-name 151 × "a"; click habit-form-save | habit-form-name-error "at most 150 characters"; no POST sent |
| 3 | set name "Gym {ts}"; habit-form-frequency → Weekly; click habit-form-save | card "Gym {ts}" with habit-frequency "Weekly"; 2 cards |

## S3 Complete / un-complete today (no duplicates)
Proves: US-HABIT-03, US-HABIT-04, FR-04, BR-7, D-20, D-22
| Step | Action | Expected |
|---|---|---|
| 1 | click habit-toggle-{read} | toggle "Done today" (aria-pressed=true); habit-streak "1 day streak"; habit-progress > 0% (14%) |
| 2 | click habit-toggle-{read} again | toggle "Mark done"; streak 0; progress 0%; `GET /habits/{read}/completions` → 0 records |
| 3 | click habit-toggle-{read}; then a duplicate `POST /habits/{read}/completions` sent with curl (outside the browser, so the expected 409 does not log a console error) | UI "Done today"; duplicate POST → 409; completions still 1 record |
| 4 | click habit-toggle-{gym} | "Done today"; habit-done-period "Done this week"; streak "1 week streak"; progress 25% |

## S4 Deactivate, activate, edit, delete
Proves: US-HABIT-05, AC Habits, A-03, D-25
| Step | Action | Expected |
|---|---|---|
| 1 | click habit-deactivate-{gym} | habit-inactive-{gym} "Inactive"; toggle hidden; activate button shown |
| 2 | click habit-activate-{gym} | inactive chip gone; toggle back |
| 3 | click habit-edit-{read}; name → "Read more {ts}"; save | card shows "Read more {ts}" |
| 4 | click habit-delete-{gym}; click confirm-ok | Gym card gone; 1 card left |

### Results
| Trial | S1.1 | S1.2 | S1.3 | S2.1 | S2.2 | S2.3 | S3.1 | S3.2 | S3.3 | S3.4 | S4.1 | S4.2 | S4.3 | S4.4 | M01 S1 | M02 S1 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | ✅ | ✅ | ✅ | ✅ | ✅ (see note) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ 8/8 | ✅ | ✅ app: none (see note) | ✅ none | evidence/M03/trial-1/M03-trial-1-final.png |
