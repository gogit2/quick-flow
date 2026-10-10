# Loop Protocol (shared by every loop)

Every loop in `loops/` follows this protocol. Each loop's `Loop-instructions.md` adds only the domain-specific parts.
The protocol is **project-agnostic**: nothing here is specific to one application.

---

## 1. Mental model

- A **loop** is a directory: `Loop-instructions.md`, `task.md`, `progress.md`, `state/`, `outputs/`.
- An **iteration** is ONE fresh Claude session (started by `scripts/run-loop.sh`) that reads the files, does one unit of work, writes the files, and exits.
  You have **no memory** of previous iterations. The files are your memory. If you did not write it down, it did not happen.
- A **milestone** (= phase) is a vertical slice of work with its own task list and its own **acceptance checks**.
  Each milestone has one file in `outputs/` (from `loops/_shared/templates/milestone-template.md`).
- The loop runner (bash) owns control flow: when to start, stop, wait, and how to record tokens and session IDs.
  You own the content: planning, code, verification, state updates.

## 2. Files and who writes them

| File | Written by | Purpose |
|---|---|---|
| `task.md` | Human / orchestrator | The INPUT: what to build (full PRD or a single user story), scope, options |
| `Loop-instructions.md` | Human (fixed) | How this loop works. Never edit during a run |
| `state/state.json` | **You** (agent) | Machine-readable memory. Source of truth for status |
| `state/iterations.jsonl` | Runner (`loopctl.py`) | One line per iteration: session id, tokens, cost, time. **Never edit** |
| `progress.md` | Both | Metrics table between `METRICS` markers = runner (never edit it). Action Log = you (append only) |
| `outputs/Mxx-*.md` | **You** | One file per milestone: spec, tasks (checkboxes), acceptance checks, verification trials |
| `outputs/*` (other) | **You** | Loop-specific artifacts (curl suites, evidence, screenshots, reports) |

## 3. `state/state.json` schema

```json
{
  "loop": "backend-dev",
  "status": "not_started",
  "input": { "type": "prd", "path": "requirements/PRD.md", "scope": "ALL" },
  "iteration": 0,
  "current_milestone": null,
  "milestones": [
    {
      "id": "M01",
      "title": "Foundation",
      "file": "outputs/M01-foundation.md",
      "status": "pending",
      "depends_on": [],
      "stories": ["US-TASK-01"],
      "tasks_total": 0,
      "tasks_done": 0,
      "trials": 0,
      "last_error": null
    }
  ],
  "blocked_reason": null,
  "last_iteration": { "milestone": null, "mode": null, "summary": null, "result": null },
  "updated_at": null
}
```

- Loop `status`: `not_started` → `in_progress` → `complete` | `blocked`. Also `waiting` (dependencies owned by another loop are not done yet).
  The orchestrator adds `dispatched` and `integrating`.
- Milestone `status`: `pending` | `in_progress` | `verifying` | `done` | `blocked`.
- `depends_on` entries: `"M02"` (same loop) or `"backend-dev:M02"` (another loop). The runner checks cross-loop dependencies without spending tokens.
- **Always** set `last_iteration` before you exit. `milestone` is the milestone ID you worked on, or `"PLANNING"` / `"FINAL"`. The runner uses it to assign tokens and time to milestones.
- Write valid JSON (check with `jq . state/state.json`). A corrupted state file stops the loop.

## 4. The iteration algorithm (follow in order)

```
0. ORIENT
   - Read: this protocol → Loop-instructions.md → task.md → state/state.json → progress.md (last ~30 log rows).
   - Read CLAUDE.md at repo root and the stack profile named in task.md.
   - Get the time with `date -Iseconds` (use it for log rows). Increment state.iteration.
   - If state.status is complete or blocked: print LOOP_DONE and exit without changes.

1. PLAN   (only when state.status == not_started, or task.md input changed → see §7)
   - Break the input into milestones (see Loop-instructions for decomposition rules).
   - Write one outputs/Mxx-<slug>.md per milestone from the template. Tasks as `- [ ] Mxx-Tnn ...`.
   - Fill state.milestones, set status = in_progress. Log it. EXIT (planning is a full iteration).

2. SELECT
   - current = the milestone with status in_progress|verifying, else the first pending milestone whose
     depends_on are all done (across loops: read loops/<other>/state/state.json).
   - Human override: if task.md has `priority_override: [Mxx, ...]`, pick pending milestones from that
     list first (in list order, only if their depends_on are done). Once a listed milestone is done, remove it
     from the list in task.md. Never skip a milestone's depends_on because of the override.
   - If no milestone can start because of cross-loop dependencies → status = waiting, log, EXIT.
   - If every milestone is done → go to step 5 (FINAL).

3. BUILD   (milestone status in_progress)
   - Do the next unchecked tasks, in order. Batch size: finish whole tasks only. Stop after ~5 tasks, or
     earlier if the next task is large. Leave the codebase COMPILING at the end of every iteration.
   - After each task: tick it `[x]` in the milestone file, write a short note of the files it touched, update tasks_done.
   - When every task is ticked → set milestone status = verifying and go to step 4 in the SAME iteration
     if there is room left, otherwise EXIT.

4. VERIFY  (milestone status verifying) — one run of this step = one TRIAL
   - trials += 1. Run the milestone's acceptance checks exactly as the milestone file describes them.
   - Save evidence (logs, screenshots) under outputs/evidence/Mxx/trial-<n>/.
   - Write a "Trial n" section in the milestone file: date, commands, pass/fail per check, evidence paths.
   - PASS (every check green, plus regression of earlier milestones) → status = done, commit (§8), log. EXIT.
   - FAIL and trials < 3 → add fix tasks `- [ ] Mxx-FIXn ...` that name the root cause,
     status = in_progress, set last_error, log. EXIT (the next iteration fixes, then verifies again).
   - FAIL and trials == 3 → STOP CONDITION: milestone status = blocked, write a "Blocked" section
     (root cause, what you tried, what a human must decide). Then:
       * if other milestones do not depend on it, continue with them in the next iteration;
       * if every remaining milestone depends on it → loop status = blocked, blocked_reason set.

5. FINAL   (every milestone is done)
   - Run the loop's full regression (all acceptance suites), write outputs/FINAL-report.md
     (what was built, requirement coverage matrix, open issues), set status = complete. EXIT.
```

## 5. Hard rules

1. **One iteration, then exit.** Never start the next milestone after committing one. The runner starts a fresh session.
2. **Never mark a task `[x]` without doing it**, and never mark a milestone `done` without a green trial recorded in its file.
3. **The trial limit is 3 per milestone.** Do not reset `trials`. Do not weaken or delete acceptance checks to make them pass. If a check is wrong, record why in the milestone file and fix the check. That still counts as the current trial.
4. **Stay inside your scope.** A backend loop never edits `frontend/` and a frontend loop never edits `backend/`.
   If you need something from the other side (for example a missing endpoint), write it in `outputs/REQUESTS.md` and make the dependency explicit.
5. **Requirements are the source of truth.** If something is ambiguous, check `requirements/DECISIONS.md` first.
   If it is not covered there, choose the simplest reasonable option, append it to DECISIONS.md under
   "Assumed during loop runs" (with loop and milestone ID), and continue. Do not stop to ask.
6. **No secrets or credentials** in code or logs.
7. **Stop every process you start** (servers) before you exit. Use the helper scripts in `scripts/`, which manage PID files.
8. Keep the files short and factual. Future iterations read them, and bloated state wastes tokens.

## 6. Action Log format (`progress.md`, append only)

```
| 2026-09-26T19:04:11+04:00 | 7 | M03 | BUILD | M03-T01..T04 done (Habit entity, repo, service, controller) | ok |
| 2026-09-26T19:31:40+04:00 | 8 | M03 | VERIFY | trial 1: 11/12 curl checks, duplicate completion returned 500 | fail |
```
Columns: `Time | Iter | Milestone | Mode | Action | Result`. Mode is one of PLAN, BUILD, VERIFY, FIX, FINAL, WAIT.
Start and end times, token usage and cost per milestone are **added automatically** by the runner to the metrics table. Do not add them yourself.

## 7. Inputs: full PRD or a single user story

`task.md` declares the input:
- `type: prd`: plan the whole document (limited by `scope` if one is given, for example `scope: Tasks, Habits`).
- `type: user_story`: `ref` is a story ID (for example `US-PLAN-03`) and/or `text` is the story itself.
  This is an **incremental** run. Read the existing code and the existing milestone files first. Add new milestone(s) continuing the numbering (for example M08). Do not re-plan finished milestones. Include a regression of the existing suites in the new milestone's checks.
- If `task.md` has an `orchestrator_plan` path, **adopt its milestone IDs, titles, stories and depends_on exactly**, and only detail the tasks and checks.

When `task.md`'s input differs from `state.input` (new story added), set status = in_progress and run PLAN for only the new scope.

### Story ID convention (shared by all loops)
`US-<AREA>-<NN>`. AREA is an uppercase short code for the PRD section heading the story sits under (for example Tasks → TASK, Learning Resources → LEARN). NN is the story's position within that section (01, 02, …), in document order. Functional requirements keep the PRD's own IDs (FR-01 …).
Because the IDs are deterministic, every loop derives the same IDs from the same PRD.

## 8. Committing

If the repo is a git repository, when a milestone becomes `done`:
```
git add <your scope dirs> loops/<this-loop>
git commit -m "<loop> <Mxx>: <milestone title>"
```
Only add paths you own. Another loop may be running in parallel. If `index.lock` exists, wait a few seconds and retry once.
Never push.
