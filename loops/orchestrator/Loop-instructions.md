# Loop: orchestrator

The orchestrator **does not write application code**. It turns an input (a full PRD or a single user story) into a cross-loop plan, points the worker loops at it, routes problems between them, and runs the final integration verification.
The worker loops (`backend-dev`, `frontend-dev`) can also be run directly without the orchestrator. See each loop's `task.md`.

Follow `loops/_shared/LOOP_PROTOCOL.md` (state file, logging, one-iteration rule). The orchestrator uses its own milestones:

| Milestone | Orchestrator status while working | What happens |
|---|---|---|
| `O1` Analyze & plan | `not_started` → `dispatched` | Requirements map, milestone plan, dependency graph, worker `task.md` updates |
| (worker loops run) | `dispatched` | `scripts/orchestrate.sh` runs the workers. The orchestrator is not invoked. When the workers stop, the script sets `reviewing` |
| `O2` Route & re-dispatch | `reviewing` → `dispatched` | Only if a worker is blocked or has open REQUESTS (at most 2 rounds) |
| `O3` Integrate & verify | `integrating` → `complete` / `blocked` | Full-stack regression, the PRD's E2E journey, final report |

---

## Each iteration: decide what to do from state

```
status not_started                                  → O1
status reviewing AND every worker loop is complete     → set status integrating → O3
status reviewing AND a worker is blocked / has open REQUESTS → O2 (if round < 3) else status blocked
status reviewing AND a worker stopped unfinished (iteration cap, stuck) → status blocked, explain in blocked_reason
status dispatched                                   → log WAIT, exit (workers are running; you should not have been called)
status integrating                                  → O3 (next trial)
```
Read the workers' state from `loops/backend-dev/state/state.json` and `loops/frontend-dev/state/state.json`.

## O1: Analyze & plan (one iteration)
Read `task.md` (input), the PRD, and `requirements/DECISIONS.md`. Produce:

1. **`outputs/01-requirements-map.md`**
   - Every user story with a deterministic ID (protocol §7), every FR, BR, UX requirement, NFR and acceptance criterion.
   - For each item: area, layer (`backend` / `frontend` / `both`), and the milestone(s) it goes to.
   - Ambiguities: for each, either the DECISIONS.md ID that resolves it, or a new "Assumed" entry you add to DECISIONS.md.
   - In `user_story` mode: only that story plus its dependencies. Mark everything else as existing.
2. **`outputs/02-milestone-plan.md`**: the authoritative milestone list for BOTH workers:
   `loop | id | title | stories | requirements | depends_on | acceptance focus`.
   Use the decomposition rules in each worker's Loop-instructions (foundation → domain slices in reference order → aggregates → hardening / E2E).
   Each frontend feature milestone depends on the backend milestone that provides its endpoints. Keep IDs stable. In `user_story` mode, continue the existing numbering.
3. **`outputs/03-dependency-graph.md`**: a Mermaid `flowchart LR` of every milestone across both loops (dependency arrows), plus an execution-waves table showing what can run in parallel (for example: backend M03 ∥ frontend M02).
4. **Update each worker's `task.md` yaml block**: same `input`, and `orchestrator_plan: loops/orchestrator/outputs/02-milestone-plan.md`. Do not change their other options unless the input requires it.
   In incremental runs (a new story after a finished run), also set each affected worker's `state.json` status to `in_progress` so its runner picks the story up. Workers not affected stay `complete`.
5. Choose `dispatch.mode` in state: `parallel` if the graph lets the frontend overlap the backend, otherwise `sequential`. The human can override it with `scripts/orchestrate.sh --mode`.
6. State: milestones `O1` (done), `O2` (pending, optional), `O3` (pending); `status = dispatched`; `dispatch: {mode, round: 1, loops: ["backend-dev","frontend-dev"]}`.

## O2: Route & re-dispatch (one iteration per round, maximum 2 rounds)
- Collect `loops/*/outputs/REQUESTS.md` items that are still open, and the `Blocked` sections of blocked milestones.
- For each backend request coming from the frontend: append a new user story to `loops/backend-dev/task.md` (`type: user_story`, `text:` the request), and add the backend milestone plus the dependency to `02-milestone-plan.md`.
- Unblock a worker milestone only when the root cause has been addressed upstream: set its status back to `in_progress`, set `trials` to 0, and write the reason in its file under "Notes / Blocked" ("reset by orchestrator round N because …"). Only the orchestrator may reset trials.
- Worker loop status `blocked` → `in_progress`. Mark the handled requests `[routed round N]`.
- `dispatch.round += 1`, `status = dispatched`. If round would exceed 2 → `status = blocked` with a summary for the human.

## O3: Integrate & verify (= 1 trial, maximum 3)
1. Fresh stack: `scripts/backend.sh start-stable --fresh`, `scripts/frontend.sh start`.
2. `BASE_URL=http://localhost:8080/api/v1 scripts/curl-regression.sh` (all backend suites against the stable build).
3. The PRD's end-to-end journey with the **Playwright MCP tools**, as one continuous scenario written to `outputs/e2e-journey.md` (same format as the frontend scenarios). Walk through the full user flow the PRD's testing section lists, and check that the dashboard reflects every change.
4. Cross-check the Definition of Done in the PRD item by item.
5. Stop the servers. Save evidence to `outputs/evidence/O3/trial-<n>/`.
6. PASS → write `outputs/99-final-report.md` (coverage: every requirement → worker milestone → check → ✅; the metrics summary from `scripts/loopctl.py summary`; known gaps) → `status = complete`.
   FAIL → record it. If the defect is inside one worker's scope, route it as in O2 (this consumes an O2 round); else trials += 1; at 3 → `blocked`.

## Scope
The orchestrator writes only inside `loops/` and `requirements/DECISIONS.md`. It never edits `backend/` or `frontend/`.
