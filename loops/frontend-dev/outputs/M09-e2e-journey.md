# M09: End-to-end journey and UX pass

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
| Depends on | M08 |
| Stories | all (journey) |
| Requirements | PRD §11 E2E coverage, §13 DoD, NFR Usability, UX empty states / validation |

## 1. Spec (what and why)
One continuous Playwright scenario on a fresh stack covering PRD §11: create task, complete task, create habit, complete habit, add learning card with milestones, build a plan from existing items, mark plan items done, verify plan achievement and dashboard update. Plus a UX pass: every list page has add + remove + empty state pointing at add, validation messages visible, dashboard updates after mutations, no console errors.

## 2. Design notes (how)
- Scenario data suffixed with a timestamp. Plan start = now − 1 min so it is In Progress immediately.
- UX pass fixes go in as small FIX tasks; no new features.

## 3. Tasks
- [ ] M09-T01 Write journey scenario `outputs/e2e/M09-e2e-journey.md` (S1 journey, S2 UX pass checklist)
- [ ] M09-T02 UX pass: review each page for empty state → add action link, validation messages, loading/error states; fix gaps
- [ ] M09-T03 Update `outputs/00-coverage.md` with final scenario step references

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: full journey passes step by step; final dashboard shows task completion %, habit done, plan 100%/Completed, learning milestones | PRD §11, AC Plans "reflected in dashboard" | e2e S1 |
| A2 | S2: on each list page, empty state shows and its button opens the add form; remove works from the page | NFR Usability, DoD | e2e S2 |
| A3 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M08 smoke.

## 5. Verification trials

## 6. Notes / Blocked
