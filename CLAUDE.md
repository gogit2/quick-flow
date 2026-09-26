# QuickFlow: agent guide

This repository is built by **Claude Loops**. Read `README.md` for the design. If you were started by `scripts/run-loop.sh`, your instructions are in `loops/_shared/LOOP_PROTOCOL.md` and `loops/<loop>/Loop-instructions.md`. Follow those.

## Layout
- `requirements/`: `PRD.md` (source of truth), `DECISIONS.md` (settles the PRD's ambiguities; read it before designing), `task-brief.txt`.
- `loops/`: `orchestrator/`, `backend-dev/`, `frontend-dev/`, and `_shared/` (protocol, stack profiles, templates).
- `backend/`: Spring Boot API (Java 17, Maven wrapper). Contract: `backend/openapi/openapi.json`.
- `frontend/`: Angular 19 + Material.
- `scripts/`: runners and process helpers. Always start and stop servers through them.
- `run-artifacts/`: session and token logs (`sessions.csv`), per-iteration logs, Playwright output, the published backend jar.

## Ground rules
- Scope: backend loop → `backend/`. Frontend loop → `frontend/`. Orchestrator → `loops/` + `DECISIONS.md` only.
- Machine constraints: **Java 17** (no newer language features), **Node 18** (Angular 19 max; Playwright MCP pinned to 0.0.40).
- Ports: 8081 = backend verify instance, 8080 = stable backend for the UI and E2E, 4200 = Angular dev server.
- Never `git push`. Never edit `state/iterations.jsonl` or the METRICS block in any `progress.md`.
