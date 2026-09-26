# M08: Hardening

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | done |
| Depends on | M07 |
| Stories | all (cross-cutting) |
| Requirements | D-05, NFR Performance (<500 ms), NFR Reliability (restart), NFR Maintainability |

## 1. Spec (what and why)
Cross-cutting quality pass: every endpoint documented with a summary and schemas, validation on every write, no 500 on bad input, state survives restart, all suites green together on a fresh DB, `./mvnw verify` green.

## 2. Design notes (how)
- Scan `openapi.json`: every operation has `summary` and a `tags` entry; every request body has a schema.
- Fuzz-style curl: malformed JSON, wrong types, unknown enum, non-numeric ids on every write endpoint → 4xx ProblemDetail.
- Restart check: start-dev, create a plan, restart the jar on the SAME DB (`java -jar` with the verify DB path, via a small helper in the suite or a documented manual step), verify data and derived status. If the helper scripts cannot restart without wiping, record the check as a Flyway/H2-file config assertion instead (document in §6).
- Simple timing: each list endpoint responds < 500 ms (`curl -w %{time_total}`).

## 3. Tasks
- [x] M08-T01 Swagger audit: add missing `@Operation(summary)`, `@Tag`, `@Schema` examples; response codes (`@ApiResponse` 400/404/409) on write endpoints
  - Summaries/tags were complete. Found: 19 ops had no 2xx (springdoc drops the implicit 200 once any `@ApiResponse` exists), every 4xx showed the success schema, content was `*/*`. Fixed in `common/config/OpenApiConfig.java` (`OpenApiCustomizer`: add 200 with the return schema, 4xx/5xx → `application/problem+json` `ProblemDetail` component), `application.yml` (`springdoc.default-produces-media-type`), `HabitController` (404 on activate/deactivate).
- [x] M08-T02 Bad-input audit: fix any 500 found (malformed JSON, type mismatch, missing body, unknown enum, path id not numeric)
  - Probed ~120 bad inputs via the M08 suite: no 500s found, all return a ProblemDetail with 400/404/405/415. No code change needed.
- [x] M08-T03 Write `outputs/curl/M08-hardening.sh` (§4) including an openapi.json audit with jq
  - Adds A1 audits for 2xx presence, JSON content type, ProblemDetail errors, 400 on writes, 404 on `{id}` ops; plus 415 and empty-body cases.
- [x] M08-T04 Update `outputs/00-coverage.md` statuses; fill any gap found
  - M01–M07 rows → pass (trial 1). Added rows: D-05, Swagger contract, Done-when (M08).

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | Every operation in `/v3/api-docs` has a non-empty `summary` and at least one tag | Swagger contract | `outputs/curl/M08-hardening.sh` case 1 |
| A2 | Malformed JSON on every POST/PUT/PATCH → 400 ProblemDetail (no 500) | D-05 | case 2 |
| A3 | Non-numeric path id (`/tasks/abc`, `/habits/abc`, `/plans/abc`, `/learning-cards/abc`) → 400 | D-05 | case 3 |
| A4 | Unknown enum on each enum field → 400 | BR-3 | case 4 |
| A5 | List endpoints (`/tasks`, `/habits`, `/learning-cards`, `/plans`, `/dashboard`) each < 500 ms | NFR Performance | case 5 |
| A6 | Full regression on a fresh instance green; `./mvnw verify` green | Done-when | regression.log, verify.log |

Regression: M01–M07 suites stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

### Trial 1 (2026-09-26, iter 9): PASS
Commands: `./mvnw verify` → `scripts/backend.sh start-dev` → `scripts/export-swagger.sh` → `scripts/curl-regression.sh M08` → `scripts/curl-regression.sh` → `scripts/backend.sh stop-dev`.

| Check | Result |
|---|---|
| A1 OpenAPI audit (summary, tag, body schema, 2xx, JSON content, ProblemDetail 4xx, 400 on writes, 404 on `{id}` ops) | pass |
| A2 malformed / wrong-type / empty bodies on 14 write ops → 400; text/plain → 415 | pass |
| A3 non-numeric / overflow ids → 400, missing → 404, bad date path → 400, unknown route 404, wrong method 405 | pass |
| A4 unknown enums in bodies (6 fields) and query params → 400 | pass |
| A5 7 list endpoints < 500 ms (all < 15 ms) | pass |
| A6 `./mvnw verify` 33/33; regression M01–M08 green on a fresh DB (606 checks) | pass |

Swagger check on exported `backend/openapi/openapi.json`: 0 operations without summary or 2xx; `ProblemDetail` schema present.
Evidence: `outputs/evidence/M08/trial-1/{verify,curl-M08,regression}.log`.

## 6. Notes / Blocked
- Restart check (design note): not a separate check; NFR Reliability is covered by the file-based H2 DB plus derived-on-read status (M01-A1, M05-A11). `start-dev` always wipes the DB, so no restart-on-same-DB helper was added.
- Contract change for the frontend: additive only. Response schemas are unchanged; 200s were added where they were missing, success content is `application/json` (was `*/*`), and errors are typed `application/problem+json` → `ProblemDetail`.
