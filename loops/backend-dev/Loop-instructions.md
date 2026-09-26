# Loop: backend-dev

**Input:** a PRD (or a single user story) given in `task.md`.
**Output:** a working backend in `backend/`, a Swagger/OpenAPI contract in `backend/openapi/`, one milestone file per phase in `outputs/`, a curl acceptance suite per phase in `outputs/curl/`, and evidence in `outputs/evidence/`.

Follow `loops/_shared/LOOP_PROTOCOL.md` exactly. This file only adds the backend-specific parts.
Stack details (versions, layout, commands, conventions) are in the stack profile named in `task.md`.

---

## PLAN: how to split the work into milestones

Decompose into **vertical slices that each end in a runnable, curl-testable API**, in this order:

1. **M01 Foundation.** Project skeleton, build, health, global error handling (ProblemDetail), Clock bean, CORS, OpenAPI config, Flyway baseline, `outputs/curl/_lib.sh`, and a smoke suite (health + `/v3/api-docs` return 200).
2. **One milestone per independent domain area**, ordered so that referenced entities come first (an aggregate that references other entities comes AFTER them).
   Each one covers: migration → entity → rules → service → controller + DTOs + Swagger annotations → unit tests for rules → curl suite.
3. **Aggregate / read-model milestones** (dashboards, summaries, reports) after the areas they read from.
4. **Last milestone: hardening.** Cross-cutting checks: every endpoint documented in Swagger, validation on every write, no 500s on bad input, all suites green together, `./mvnw verify` green.

Rules for planning:
- Aim for milestones of 5–10 tasks. Split any milestone with more than 12 tasks.
- Every PRD user story, functional requirement (FR-xx) and business rule (BR-n) that has a backend part must appear in **at least one** milestone's `Stories`/`Requirements` row. Write `outputs/00-coverage.md`: a table of requirement → milestone → acceptance check ID. The FINAL step checks it again.
- Put time-dependent and computed rules (status transitions, percentages, countdowns, streaks, "today"/"overdue") in pure domain classes, with unit tests that use a fixed `Clock`.
- Read `requirements/DECISIONS.md` before designing. It settles the PRD's ambiguities.
- Plan the frontend's needs too. The frontend loop builds only from Swagger, so each response must carry what the UI must show (for example computed flags, percentages, remaining seconds).

## BUILD: backend specifics
- Build the database schema only through Flyway migrations. Never edit a migration that belongs to a `done` milestone; add a new one.
- Keep controllers thin: controller → service → domain rules → repository.
- Add Swagger annotations while writing each endpoint, not afterwards.
- Unit tests: **required** for domain rules (PRD §11). Controller/integration tests are optional (`task.md` → `unit_tests`).
- End every BUILD iteration with `cd backend && ./mvnw -q -DskipTests package` succeeding.

## VERIFY: backend acceptance procedure (= 1 trial)
```bash
cd backend && ./mvnw -q verify                        # 1. compile + unit tests
scripts/backend.sh start-dev                          # 2. fresh DB on :8081
scripts/export-swagger.sh                             # 3. refresh the contract
bash loops/backend-dev/outputs/curl/Mxx-<slug>.sh     # 4. this milestone's suite
scripts/curl-regression.sh                            # 5. every suite (regression)
scripts/backend.sh stop-dev                           # 6. always stop
```
- Save each command's output to `outputs/evidence/Mxx/trial-<n>/` (for example `verify.log`, `curl-Mxx.log`, `regression.log`).
- Also check that each endpoint added in this milestone appears in `backend/openapi/openapi.json` with a summary (`jq '.paths | keys'`).
- PASS = steps 1, 4 and 5 all exit 0 and the Swagger check holds.
- On PASS: `scripts/backend.sh publish` (makes the jar available to the frontend loop), then commit (paths: `backend loops/backend-dev`).

## FINAL
Run the full procedure once more. Write `outputs/FINAL-report.md` with: the endpoint list (from openapi.json), the coverage matrix (requirement → milestone → check → status), unit test counts, known limitations, and how to run.
