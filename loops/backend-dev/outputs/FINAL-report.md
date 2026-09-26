# FINAL report: backend-dev

Date: 2026-09-26 (iteration 10). Evidence: `outputs/evidence/FINAL/` (`verify.log`, `regression.log`).

## Result of the final run
| Step | Command | Result |
|---|---|---|
| 1 | `cd backend && ./mvnw verify` | BUILD SUCCESS, 33 tests, 0 failures |
| 2 | `scripts/backend.sh start-dev` (fresh DB, :8081) | up |
| 3 | `scripts/export-swagger.sh` | `backend/openapi/openapi.json` refreshed, 41 operations, all with summaries |
| 5 | `scripts/curl-regression.sh` | REGRESSION PASSED: 8 suites, 606 checks, 0 failed |
| 6 | `scripts/backend.sh stop-dev` | stopped |

Suite counts: M01 9, M02 69, M03 50, M04 58, M05 64, M06 51, M07 51, M08 254.

## What was built
Spring Boot 3 / Java 17 REST API under `/api/v1`. It uses Flyway migrations V1–V6, ProblemDetail errors, an injectable `Clock`, CORS for :4200, and a springdoc OpenAPI contract. Milestones M01–M08 are all `done` on trial 1.

## Endpoints (from openapi.json)
- **Tasks**: `GET/POST /tasks` (list/search/filter/sort, create), `GET/PUT/DELETE /tasks/{id}`, `POST /tasks/{id}/complete|archive|restore`
- **Habits**: `GET/POST /habits`, `GET/PUT/DELETE /habits/{id}`, `POST /habits/{id}/activate|deactivate`, `GET/POST /habits/{id}/completions`, `DELETE /habits/{id}/completions/today`, `DELETE /habits/{id}/completions/{date}`
- **Learning cards**: `GET/POST /learning-cards`, `GET/PUT/DELETE /learning-cards/{id}`, `POST /learning-cards/{id}/milestones`, `PUT/DELETE /learning-cards/{id}/milestones/{milestoneId}`, `POST …/milestones/{milestoneId}/complete|uncomplete`, `POST /learning-cards/{id}/notes`, `DELETE …/notes/{noteId}`
- **Plans**: `GET/POST /plans`, `GET /plans/history`, `GET/PUT/DELETE /plans/{id}`, `PATCH /plans/{id}/items/{itemId}`
- **Dashboard / settings**: `GET /dashboard`, `GET/PUT /settings`
- Health endpoint (outside the contract), plus `/v3/api-docs` and Swagger UI.

## Coverage matrix
`outputs/00-coverage.md` maps every in-scope story, FR and BR to a check:
- 34 user stories: US-TASK 1–7, US-HABIT 1–5, US-LEARN 1–5, US-PLAN 1–10, US-DASH 1–6.
- FR-01..FR-09 and BR-1..BR-14.
- Settings (D-51), NFR performance and reliability, and the error and Swagger contract.

Every row is `pass`. The final regression re-ran all of these checks green on a fresh instance.

## Unit tests (domain rules, fixed Clock)
PlanRulesTest 10, HabitRulesTest 7, DashboardRulesTest 5, TaskRulesTest 4, LearningRulesTest 4, AppTimeTest 3. Total: 33.

## Known limitations
- No authentication, because this is a single-user app (DECISIONS).
- Notifications are not pushed from the backend. Plans expose `status`, `startsInSeconds` and `serverTime`, and the UI raises the notification itself (D-46, A-01).
- Plan status is derived from the clock when a plan is read. There is no background scheduler.
- Flyway runs with `out-of-order: true` (A-04).
- Interpretations made during the run are listed in `requirements/DECISIONS.md` as A-01..A-10.
- `outputs/REQUESTS.md` does not exist: no cross-loop requests are open.

## How to run
```bash
cd backend && ./mvnw verify                 # build + unit tests
scripts/backend.sh start-dev                # fresh instance on :8081  (stop-dev to stop)
scripts/backend.sh publish                  # publish jar for the stable :8080 instance
scripts/curl-regression.sh                  # all curl suites (BASE_URL overridable)
# Swagger UI: http://localhost:8081/swagger-ui.html ; contract: backend/openapi/openapi.json
```
