# Stack profile: Backend (Java Spring Boot)

The backend loop uses this profile. To reuse the loop on another stack, copy this file, change it, and point `task.md` at the copy.

## Toolchain (checked on this machine)
- **Java 17** (installed JDK). Do not use features newer than Java 17.
- **Spring Boot 3.5.x**, **Maven** via the wrapper (`./mvnw`). Generate the wrapper once with `mvn -N wrapper:wrapper` if it is missing.
- Project root: `backend/`. Group `com.quickflow` (or the project's name), artifact `backend`.

## Dependencies
| Purpose | Dependency |
|---|---|
| REST | `spring-boot-starter-web` |
| Validation | `spring-boot-starter-validation` |
| Persistence | `spring-boot-starter-data-jpa`, `com.h2database:h2` (runtime) |
| Schema migrations | `org.flywaydb:flyway-core` (SQL files in `src/main/resources/db/migration/V<n>__<desc>.sql`) |
| Health | `spring-boot-starter-actuator` (expose `health` only) |
| Swagger / OpenAPI | `org.springdoc:springdoc-openapi-starter-webmvc-ui` (2.8.x) |
| Tests | `spring-boot-starter-test` (JUnit 5, AssertJ, Mockito, MockMvc) |

No Lombok, no MapStruct. Use Java `record`s for DTOs and explicit mappers.

## Package layout (feature-first)
```
com.quickflow
├── common/        error/ (GlobalExceptionHandler → ProblemDetail), time/ (Clock bean), config/ (CORS, OpenAPI)
├── <feature>/     one package per domain area, e.g. task/, habit/
│   ├── api/       <Feature>Controller, request/response records, mapper
│   ├── domain/    JPA entities, enums, <Feature>Rules (pure business rules, no Spring)
│   ├── service/   <Feature>Service (transactions, orchestration)
│   └── repo/      Spring Data repositories
└── QuickflowApplication.java
```
**Business rules live in `domain/` as pure, clock-injected code** (the PRD's maintainability requirement), so they can be unit-tested without Spring.

## API conventions
- Base path `/api/v1`. JSON is camelCase. Enums are serialized UPPER_SNAKE (`TODO`, `IN_PROGRESS`, `DONE`).
- Dates: `LocalDate` → `"2026-09-26"`. Timestamps: `Instant` → ISO-8601 UTC `"2026-09-26T15:00:00Z"`.
- `POST` → 201 + `Location` header + body. `GET` → 200. `PUT`/`PATCH` → 200 + body. `DELETE` → 204.
- Errors use RFC 7807 `ProblemDetail`: 400 validation / business rule (with an `errors: {field: message}` map), 404 not found, 409 conflict (duplicates).
  Never return a 500 for bad input.
- Every controller has `@Tag`, every operation has `@Operation(summary=...)`, and request records have `@Schema` examples. The Swagger document is the contract the frontend loop uses.
- Swagger UI: `/swagger-ui.html`. JSON: `/v3/api-docs`. YAML: `/v3/api-docs.yaml`.
- CORS: allow `http://localhost:4200`.
- Time: inject `java.time.Clock` everywhere. Never call `Instant.now()` / `LocalDate.now()` without the clock. Zone = `app.zone` property (default: system zone).

## Profiles and data
| Instance | Port | DB file | Started by |
|---|---|---|---|
| dev/verify (backend loop) | 8081 | `backend/data/verify` (wiped at each start) | `scripts/backend.sh start-dev` |
| stable (frontend loop / E2E) | 8080 | `run-artifacts/data/stable` | `scripts/backend.sh start-stable` (runs the last **published** jar) |

The ports are set with `SERVER_PORT` and the DB URL with `SPRING_DATASOURCE_URL`. The scripts already do this. Do not hard-code the ports in `application.yml`; the default there is 8080.

## Commands
```bash
cd backend && ./mvnw -q -DskipTests package   # compile + jar
cd backend && ./mvnw -q verify                # compile + unit tests (must pass before a trial)
scripts/backend.sh start-dev                  # build + run on :8081, waits for /actuator/health
scripts/backend.sh stop-dev
scripts/export-swagger.sh                     # :8081/v3/api-docs → backend/openapi/openapi.{json,yaml}
scripts/curl-regression.sh [Mxx]              # run all (or one) curl suites against :8081
scripts/backend.sh publish                    # copy the jar to run-artifacts/backend-latest.jar (on milestone done)
```

## Curl acceptance suites
One executable script per milestone: `loops/backend-dev/outputs/curl/Mxx-<slug>.sh`. Rules:
- Start with `source "$(dirname "$0")/_lib.sh"`. `_lib.sh` gives `BASE_URL` (default `http://localhost:8081/api/v1`) and the helpers `req`, `expect_status`, `expect_json`, `summary`. Create `_lib.sh` in M01.
- Self-contained: create the data you need, and use unique titles (for example with a timestamp suffix).
- Check status codes AND body fields with `jq`. Exit non-zero if any check fails. Print one line per check: `PASS A1 ...` / `FAIL A2 ... (got 500)`.
- Checks that depend on time create data relative to "now" (for example a plan with start = now − 10 min). Use `date -u -d '+10 min' +%Y-%m-%dT%H:%M:%SZ`.
