# M04: Learning Resources page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | pending |
| Depends on | M01, backend-dev:M04 |
| Stories | US-LEARN-01..05 |
| Requirements | FR-05, FR-06, BR-8, BR-9, UX Learning Resources Page, AC Learning |

## 1. Spec (what and why)
The Learning Resources page: card grid (title, description/source, status chip, milestone progress), add card dialog, remove card, each card expandable to show milestones (add, complete/uncomplete, remove; optional target date) and notes (add, remove, timestamp). Card status is derived by the backend (D-31) and can be set manually. Empty state pointing at Add Learning Card.

## 2. Design notes (how)
- Contract: `LearningCardRequest/Response`, `MilestoneRequest/Response`, `NoteRequest/Response`; `/learning-cards` and sub-resources. Milestone mutations return the updated card (A-07): replace the card in the signal.
- Validators: card title required ≤ 200, description ≤ 2000, milestone title required ≤ 200, note text required ≤ 5000 (A-07).
- testids: `learning-add-btn`, `learning-form-title|description|save|cancel`, `learning-card-<id>`, `learning-status-<id>`, `learning-expand-<id>`, `learning-delete-<id>`, `milestone-input-<cardId>`, `milestone-date-<cardId>`, `milestone-add-<cardId>`, `milestone-row-<id>`, `milestone-toggle-<id>`, `milestone-delete-<id>`, `note-input-<cardId>`, `note-add-<cardId>`, `note-row-<id>`, `note-delete-<id>`, `empty-state-learning`.

## 3. Tasks
- [ ] M04-T01 Learning models + `LearningApi` service
- [ ] M04-T02 Card grid with status chip, milestone count, expand/collapse, empty state; add/remove card (confirm)
- [ ] M04-T03 Milestones panel: add (title + optional date), toggle complete, remove
- [ ] M04-T04 Notes panel: add, list with timestamp, remove; manual status select
- [ ] M04-T05 Write scenario file `outputs/e2e/M04-learning.md` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | S1 [smoke]: empty state → add card → card visible, status Not Started | US-LEARN-01, FR-05, BR-8 | e2e S1 |
| A2 | S2: expand card → add 2 milestones → complete one → status In Progress; complete both → Completed; remove one milestone | US-LEARN-03, US-LEARN-04, FR-06, D-31 | e2e S2 |
| A3 | S3: add note → visible with timestamp; remove note | US-LEARN-05, FR-06 | e2e S3 |
| A4 | S4: remove card → gone; empty title shows required error | US-LEARN-02, BR-8 | e2e S4 |
| A5 | No console errors, no 5xx; build green | — | each scenario |

Regression: M01–M03 smoke.

## 5. Verification trials

## 6. Notes / Blocked
