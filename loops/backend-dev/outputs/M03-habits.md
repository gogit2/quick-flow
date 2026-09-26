# M03: Habits

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | pending |
| Depends on | M01 |
| Stories | US-HABIT-01, US-HABIT-02, US-HABIT-03, US-HABIT-04, US-HABIT-05 |
| Requirements | FR-03, FR-04, BR-6, BR-7, BR-14, D-20..D-25 |

## 1. Spec (what and why)
Habit CRUD with daily/weekly frequency, deactivate/activate, completion for today or an explicit past date (duplicates → 409), un-complete today, and computed `doneToday`/`doneThisPeriod`, `currentStreak`, `progressPercent`. Hard delete cascades to completions. Not included: dashboard (M07), plan side effects (M06).

## 2. Design notes (how)
- `V3__habits.sql`: `habit(id, name varchar(150) not null, description, frequency, created_at, active boolean)`, `habit_completion(id, habit_id fk on delete cascade, completion_date date, created_at, unique(habit_id, completion_date))`.
- `habit/domain`: `Habit`, `HabitCompletion`, `HabitFrequency {DAILY, WEEKLY}`, `HabitRules` (pure, input = set of completion dates + today): `isDoneForPeriod` (D-21), `currentStreak` (D-22, ISO weeks), `progressPercent` (D-23, capped at 100), `validateCompletionDate` (not future → 400).
- `habit/api` `/api/v1/habits`: `GET` (`?active=true|false` optional), `GET /{id}`, `POST`, `PUT /{id}`, `DELETE /{id}`, `POST /{id}/deactivate`, `POST /{id}/activate`, `POST /{id}/completions` (body optional `{date}`; default today → 201; dup → 409), `DELETE /{id}/completions/today` (204; also `DELETE /{id}/completions/{date}`), `GET /{id}/completions`.
- `HabitResponse`: id, name, description, frequency, active, createdAt, `doneToday`, `doneThisPeriod`, `currentStreak`, `progressPercent`, `lastCompletedDate`.
- `HabitService.recordCompletionIfAbsent(habitId, today)` for M06 (D-47).

## 3. Tasks
- [ ] M03-T01 Migration `V3__habits.sql` + entities + enum + repositories
- [ ] M03-T02 `HabitRules` (done-for-period, streak daily/weekly, progress %, date validation) + unit tests with fixed Clock
- [ ] M03-T03 `HabitService` (CRUD, activate/deactivate, complete with 409 on dup, un-complete, `recordCompletionIfAbsent`)
- [ ] M03-T04 `HabitController` + records + mapper + Swagger annotations
- [ ] M03-T05 Curl suite `outputs/curl/M03-habits.sh` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | POST daily habit → 201, `frequency: DAILY`, `active: true`; POST weekly → `WEEKLY` | US-HABIT-01/02, FR-03 | `outputs/curl/M03-habits.sh` case 1 |
| A2 | Blank name → 400; name 151 chars → 400; bad frequency → 400 | BR-6 | case 2 |
| A3 | POST /completions (no body) → 201; habit shows `doneToday: true`, `currentStreak ≥ 1` | US-HABIT-03, FR-04 | case 3 |
| A4 | Second completion same date → 409 ProblemDetail | BR-7, D-20 | case 4 |
| A5 | Completion with future date → 400; with yesterday → 201 and streak becomes 2 | D-20, D-22 | case 5 |
| A6 | `progressPercent` for daily with 2 completions in last 7 days = 29 | US-HABIT-04, D-23 | case 6 |
| A7 | DELETE /completions/today → 204; `doneToday: false` | D-20 | case 7 |
| A8 | Deactivate → `active: false`; activate → true; PUT updates name | FR-03 | case 8 |
| A9 | DELETE habit → 204; GET → 404; its completions gone (GET completions → 404) | US-HABIT-05, BR-14, D-25 | case 9 |
| A10 | Unit tests for `HabitRules` (daily/weekly streak, progress, period done) pass | PRD §11 | verify.log |

Regression: M01, M02 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

## 6. Notes / Blocked
