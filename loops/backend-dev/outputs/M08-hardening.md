# M08: Hardening

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | pending |
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
- [ ] M08-T01 Swagger audit: add missing `@Operation(summary)`, `@Tag`, `@Schema` examples; response codes (`@ApiResponse` 400/404/409) on write endpoints
- [ ] M08-T02 Bad-input audit: fix any 500 found (malformed JSON, type mismatch, missing body, unknown enum, path id not numeric)
- [ ] M08-T03 Write `outputs/curl/M08-hardening.sh` (§4) including an openapi.json audit with jq
- [ ] M08-T04 Update `outputs/00-coverage.md` statuses; fill any gap found

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

## 6. Notes / Blocked
