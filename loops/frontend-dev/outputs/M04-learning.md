# M04: Learning Resources page

| Field | Value |
|---|---|
| Loop | frontend-dev |
| Status | done |
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
- [x] M04-T01 Learning models + `LearningApi` service. Files: `core/models/learning.ts`, `core/api/learning-api.service.ts`
- [x] M04-T02 Card grid with status chip, milestone count, expand/collapse, empty state; add/remove card (confirm). Files: `features/learning/learning-page.component.ts`, `learning-card.component.ts`, `learning-form-dialog.component.ts` (also edit title/description)
- [x] M04-T03 Milestones panel: add (title + optional date), toggle complete, remove. Files: `learning-card.component.ts` (card swapped in place from the response; after 204 the card is fetched again)
- [x] M04-T04 Notes panel: add, list with timestamp, remove; manual status select. Files: `learning-card.component.ts` (`learning-status-select-<id>` → PUT with status)
- [x] M04-T05 Write scenario file `outputs/e2e/M04-learning.md` (§4)

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
### Trial 1 (2026-10-10T18:16:37+03:00)
- Commands: `npx ng build` (green); `scripts/backend.sh start-stable --fresh`; `scripts/frontend.sh start`; scenario `outputs/e2e/M04-learning.md` S1–S4 with Playwright MCP; M01 S1, M02 S1 and M03 S1 smoke; servers stopped.
- A1 S1 ✅ (card "Not started", 0 / 0) · A2 S2 ✅ (empty milestone blocked, no request; 2 milestones → 1 done "In progress" 50% → 2 done "Completed" 100% → undo "In progress" → remove → "1 / 1 · 100%" "Completed"; manual "Not started" persisted, API status NOT_STARTED) · A3 S3 ✅ (empty note blocked; note with timestamp Oct 10, 2026 6:15:32 PM, input cleared; removed) · A4 S4 ✅ (empty title error, no POST; delete with confirm leaves 1 card) · A5 ✅ no console errors, no 5xx (20 API calls, all 2xx)
- Regression: M01 S1 8/8 ✅, M02 S1 ✅, M03 S1 ✅
- Evidence: `evidence/M04/trial-1/M04-trial-1-final.png`
- Result: PASS

## 6. Notes / Blocked
