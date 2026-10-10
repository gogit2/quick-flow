# M03: Habits page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
| Depends on | M01, backend-dev:M03 |
| Stories | US-HABIT-01..05 |
| Requirements | FR-03, FR-04, BR-6, BR-7, UX Habits Page, AC Habits |

## 1. Spec (what and why)
The Habits page: habit cards with name, frequency label (Daily/Weekly), completion toggle for today, progress (progressPercent) and streak (currentStreak); add/edit dialog; deactivate/activate; remove with confirm; empty state pointing at Add Habit.

## 2. Design notes (how)
- Contract: `HabitRequest`, `HabitResponse`, `CompletionRequest/Response`; `/habits`, `/{id}/completions`, `/{id}/completions/today` (DELETE = un-complete), `/{id}/deactivate|activate`.
- Validators: name required ≤ 150 (BR-6), description ≤ 1000 (A-05), frequency required.
- Toggle: done → `DELETE completions/today`; not done → `POST completions`. A 409 (duplicate, BR-7) shows a snackbar and refreshes, never a second record.
- Inactive habits shown greyed with an Activate action (A-03).
- testids: `habit-add-btn`, `habit-form-name|description|frequency|save|cancel`, `habit-card-<id>`, `habit-toggle-<id>`, `habit-frequency-<id>`, `habit-streak-<id>`, `habit-progress-<id>`, `habit-edit-<id>`, `habit-deactivate-<id>`, `habit-activate-<id>`, `habit-delete-<id>`, `empty-state-habits`.

## 3. Tasks
- [x] M03-T01 Habit models + `HabitApi` service. Files: `core/models/habit.ts`, `core/api/habit-api.service.ts`
- [x] M03-T02 Habits page: card grid (frequency label, streak, progress), empty state. Files: `features/habits/habits-page.component.ts` (active first, inactive greyed with "Inactive" chip; weekly shows "Done this week")
- [x] M03-T03 Add/edit dialog with validators and backend errors. Files: `features/habits/habit-form-dialog.component.ts` (frequency defaults to Daily)
- [x] M03-T04 Complete/un-complete toggle (409 handling), deactivate/activate, delete with confirm. Files: `habits-page.component.ts` (toggle keyed on `doneToday`, disabled while in flight; errors → interceptor snackbar + reload)
- [x] M03-T05 Write scenario file `outputs/e2e/M03-habits.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: empty state → create daily habit → card shows "Daily" | US-HABIT-01, US-HABIT-02, FR-03 | e2e S1 |
| A2 | S2: create weekly habit → "Weekly" label; empty name shows required error | US-HABIT-02, BR-6 | e2e S2 |
| A3 | S3: toggle complete → card done, streak 1, progress > 0; toggle again → undone (no duplicate) | US-HABIT-03, US-HABIT-04, FR-04, BR-7 | e2e S3 |
| A4 | S4: deactivate → marked inactive; activate restores; delete removes card | US-HABIT-05, AC Habits | e2e S4 |
| A5 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01 S1, M02 S1 smoke.

## 5. Verification trials
### Trial 1 (2026-10-10T17:48:37+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M03-habits.md` S1–S4 with Playwright MCP; M01 S1 + M02 S1 smoke; servers stopped.
- A1 S1 ✅ · A2 S2 ✅ (required error; 151-char name blocked, 0 API calls; weekly card "Weekly") · A3 S3 ✅ (done → "1 day streak", 14%; undo → 0 completions; duplicate POST → 409, still 1 completion; weekly → "Done this week", "1 week streak", 25%) · A4 S4 ✅ (Inactive chip + Activate; activate restores; edit; delete with confirm) · A5 ✅ no 5xx, no console errors from the app
- Check corrections made during this trial (the app's behaviour was not changed):
  - S2.2: the first attempt typed the long name by hand. It was only 147 chars, so the habit was (correctly) created. It was deleted in the UI and the step was redone with exactly 151 chars set from code: blocked as expected.
  - S3.3: the duplicate POST was first sent with `fetch` inside the page, so Chromium logged "Failed to load resource: 409". That is the only console error in the trial, and the check itself caused it. The step now sends the probe with curl (re-run: 409, 1 record) and the scenario file says so.
- Regression: M01 S1 8/8 ✅, M02 S1 ✅
- Evidence: `evidence/M03/trial-1/M03-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
