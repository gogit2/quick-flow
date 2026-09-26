# M04: Learning resources

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | pending |
| Depends on | M01 |
| Stories | US-LEARN-01, US-LEARN-02, US-LEARN-03, US-LEARN-04, US-LEARN-05 |
| Requirements | FR-05, FR-06, BR-8, BR-9, BR-14, D-30..D-32 |

## 1. Spec (what and why)
Learning cards with nested milestones and notes. Cards can be added, updated (incl. manual status), removed (cascade). Milestones can be added, completed/un-completed, removed; notes added and removed. Card status is re-derived on milestone changes. Not included: dashboard snapshot (M07), plan items (M05/M06).

## 2. Design notes (how)
- `V4__learning.sql`: `learning_card(id, title not null, description varchar(2000), status, created_at)`, `learning_milestone(id, card_id fk cascade, title not null, done boolean, target_date date, completed_at, position)`, `learning_note(id, card_id fk cascade, text varchar(5000) not null, created_at)`.
- `learning/domain`: entities, `LearningStatus {NOT_STARTED, IN_PROGRESS, COMPLETED}`, `LearningRules` (pure): `deriveStatus(milestones)` (D-31), `markMilestone(m, done, now)` (sets/clears `completedAt`, D-30), `progressPercent`.
- `learning/api` `/api/v1/learning-cards`: `GET`, `GET /{id}`, `POST`, `PUT /{id}` (title, description, optional status), `DELETE /{id}`;
  `POST /{id}/milestones`, `PUT /{id}/milestones/{mid}` (title/targetDate/done), `POST /{id}/milestones/{mid}/complete`, `POST /{id}/milestones/{mid}/uncomplete`, `DELETE /{id}/milestones/{mid}`;
  `POST /{id}/notes`, `DELETE /{id}/notes/{nid}`.
- `LearningCardResponse`: id, title, description, status, createdAt, `milestones[]`, `notes[]` (newest first), `milestonesTotal`, `milestonesDone`, `progressPercent`.
- A milestone/note id that belongs to another card → 404 (BR-9).

## 3. Tasks
- [ ] M04-T01 Migration `V4__learning.sql` + entities + enum + repositories
- [ ] M04-T02 `LearningRules` (derive status, mark milestone, progress) + unit tests with fixed Clock
- [ ] M04-T03 `LearningService` (card CRUD, milestone add/update/complete/uncomplete/remove, note add/remove, status re-derivation)
- [ ] M04-T04 `LearningCardController` + records + mapper + Swagger annotations
- [ ] M04-T05 Curl suite `outputs/curl/M04-learning.sh` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | POST card → 201, `status: NOT_STARTED`, empty milestones/notes | US-LEARN-01, FR-05 | `outputs/curl/M04-learning.sh` case 1 |
| A2 | Blank title → 400 with `errors.title` | BR-8 | case 2 |
| A3 | Add 2 milestones (one with targetDate) → 201; card shows `milestonesTotal: 2` | US-LEARN-03, FR-06 | case 3 |
| A4 | Complete 1 milestone → `done: true`, `completedAt` set, card `IN_PROGRESS`, 50%; complete both → `COMPLETED`; uncomplete one → `IN_PROGRESS` | US-LEARN-04, D-30, D-31 | case 4 |
| A5 | PUT card with `status: COMPLETED` manually → saved | D-31 | case 5 |
| A6 | Add note → 201 with `createdAt`; delete note → 204, gone from card | US-LEARN-05, FR-06 | case 6 |
| A7 | Delete milestone → 204; milestone id used under a different card → 404 | FR-06, BR-9 | case 7 |
| A8 | DELETE card → 204; GET → 404 | US-LEARN-02, BR-14, D-32 | case 8 |
| A9 | Unit tests for `LearningRules` pass | PRD §11 | verify.log |

Regression: M01–M03 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

## 6. Notes / Blocked
