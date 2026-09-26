# Task: backend-dev

Edit the block below to point the loop at new work. The orchestrator rewrites it when it dispatches.

```yaml
input:
  type: prd                      # prd | user_story
  path: requirements/PRD.md      # the PRD (always given, for context, even for a single story)
  scope: ALL                     # ALL, or comma-separated PRD areas, e.g. "Tasks, Habits"
  ref: null                      # user_story only: e.g. US-PLAN-03
  text: null                     # user_story only: the story text if it is not in the PRD
decisions: requirements/DECISIONS.md
stack_profile: loops/_shared/stack-profiles/backend-springboot.md
orchestrator_plan: null          # set by the orchestrator: loops/orchestrator/outputs/02-milestone-plan.md
priority_override: [M03]          # human override: do these pending milestones next (LOOP_PROTOCOL §4 step 2)
unit_tests: rules                # off | rules (domain rules only, default) | full (plus controller tests)
```

## Goal
Build the backend for everything in scope, as a REST API documented with Swagger. Each milestone must be verified with curl before the next one starts.

## Done when
- Every milestone in `state/state.json` is `done`, with a green trial recorded in its file.
- `cd backend && ./mvnw verify` passes.
- `scripts/curl-regression.sh` passes against a fresh instance.
- `backend/openapi/openapi.json` documents every endpoint (with summaries and schemas).
- `outputs/00-coverage.md` maps every in-scope story, FR and BR to a passing check.
- `outputs/FINAL-report.md` exists.

## Out of scope
- Anything in `frontend/`.
- The PRD's "Non-Goals" and "Future Enhancements".
- Authentication (single-user app; see DECISIONS).
