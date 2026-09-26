# M01: Foundation

| Field | Value |
|---|---|
| Loop | backend-dev |
| Status | done |
| Depends on | — |
| Stories | — (enables all) |
| Requirements | D-01..D-05, NFR Reliability (H2 file DB), NFR Maintainability |

## 1. Spec (what and why)
A runnable Spring Boot 3.5 / Java 17 skeleton in `backend/` that starts, reports health, serves Swagger, and has the cross-cutting plumbing every later milestone relies on: ProblemDetail errors, an injectable `Clock` in zone `app.zone`, CORS for `:4200`, Flyway baseline on H2 file DB. No domain features.

## 2. Design notes (how)
- `backend/pom.xml`: deps from the stack profile. Maven wrapper (`mvn -N wrapper:wrapper`).
- `com.quickflow.QuickflowApplication`.
- `common/time/TimeConfig`: `@Bean Clock` = `Clock.system(ZoneId.of(app.zone))`; `app.zone` default = system zone. Helper `AppTime` (today(), now(), zone()).
- `common/error/GlobalExceptionHandler` (`@RestControllerAdvice`): `MethodArgumentNotValidException`/`HandlerMethodValidationException`/`ConstraintViolationException` → 400 with `errors` map; `HttpMessageNotReadableException` (bad JSON, bad enum) → 400; `MethodArgumentTypeMismatchException` → 400; `NotFoundException` → 404; `BusinessRuleException(field,msg)` → 400; `ConflictException` → 409; `NoResourceFoundException` → 404; fallback → 500 (never for bad input).
- `common/config/CorsConfig` (allow `http://localhost:4200`, all methods), `OpenApiConfig` (title "QuickFlow API", version).
- `application.yml`: default port 8080, H2 file `./data/quickflow`, `ddl-auto: validate`, Flyway on, actuator exposes `health` only, `spring.jackson.serialization.write-dates-as-timestamps=false`, `app.zone`.
- `db/migration/V1__baseline.sql`: creates a tiny `app_meta(meta_key, meta_value)` table so the baseline is a real migration.
- `outputs/curl/_lib.sh`: `BASE_URL`, `ROOT_URL` (BASE_URL without `/api/v1`), `req METHOD PATH [BODY]` (sets `$STATUS`, `$BODY`), `expect_status ID DESC CODE`, `expect_json ID DESC JQ_EXPR EXPECTED`, `summary` (exit 1 on any fail), `iso_in "+10 min"`.

## 3. Tasks
- [x] M01-T01 Create Maven project (`pom.xml`, wrapper, `QuickflowApplication`, `application.yml`), build with `./mvnw -q -DskipTests package`
- [x] M01-T02 Flyway `V1__baseline.sql`, H2 file DB config, actuator health only
- [x] M01-T03 `Clock` bean + `app.zone` property + `AppTime` helper; unit test with a fixed clock
- [x] M01-T04 `GlobalExceptionHandler` + exception types (`NotFoundException`, `BusinessRuleException`, `ConflictException`) producing ProblemDetail with `errors` map
- [x] M01-T05 CORS config + OpenAPI config (title, version, server-agnostic)
- [x] M01-T06 `outputs/curl/_lib.sh` helpers
- [x] M01-T07 Smoke suite `outputs/curl/M01-foundation.sh` (§4)

## 4. Acceptance checks
| # | Check | Proves | How |
|---|---|---|---|
| A1 | `GET /actuator/health` → 200, `status == "UP"` | D-03 boot | `outputs/curl/M01-foundation.sh` case 1 |
| A2 | `GET /v3/api-docs` → 200, `.info.title == "QuickFlow API"` | D-05 Swagger | case 2 |
| A3 | `GET /swagger-ui.html` → 200 or 302 | Swagger UI | case 3 |
| A4 | `GET /api/v1/does-not-exist` → 404 with `application/problem+json` | D-05 ProblemDetail | case 4 |
| A5 | CORS preflight `OPTIONS /api/v1/x` with `Origin: http://localhost:4200` → `Access-Control-Allow-Origin` echoed | CORS | case 5 |
| A6 | `./mvnw -q verify` passes (Clock test) | D-04 | verify.log |

Regression: none (first milestone).

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->
### Trial 1 (2026-09-26T19:38+03:00): PASS
Commands: `./mvnw verify` → `scripts/backend.sh start-dev` → `scripts/export-swagger.sh` → `scripts/curl-regression.sh M01` → `scripts/curl-regression.sh` → `stop-dev`.
| Check | Result |
|---|---|
| A1 health UP | PASS |
| A2 api-docs title | PASS |
| A3 swagger-ui | PASS |
| A4 404 problem+json | PASS |
| A5 CORS preflight | PASS |
| A6 `./mvnw verify` (AppTimeTest 3/3) | PASS |
Swagger check: no endpoints added in M01 (`.paths` empty, expected). Evidence: `outputs/evidence/M01/trial-1/{verify,curl-M01,regression}.log`. Jar published.

## 6. Notes / Blocked
- Files: `backend/{pom.xml,mvnw,.mvn/,.gitignore}`, `QuickflowApplication`, `application.yml`, `db/migration/V1__baseline.sql`, `common/time/{TimeConfig,AppTime}` + `AppTimeTest`, `common/error/{GlobalExceptionHandler,NotFoundException,BusinessRuleException,ConflictException}`, `common/config/{CorsConfig,OpenApiConfig}`, `outputs/curl/{_lib.sh,M01-foundation.sh}`.
- `GlobalExceptionHandler` extends `ResponseEntityExceptionHandler` (covers 404 route/405/415/type mismatch). `_lib.sh` also has `expect_header` and `uniq`; `req` passes extra curl args after BODY.
