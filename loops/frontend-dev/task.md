# Task: frontend-dev

Edit the block below to point the loop at new work. The orchestrator rewrites it when it dispatches.

```yaml
input:
  type: prd                          # prd | user_story
  path: requirements/PRD.md
  scope: ALL                         # ALL, or comma-separated PRD areas / pages
  ref: null                          # user_story only: e.g. US-PLAN-03
  text: null                         # user_story only
contract: backend/openapi/openapi.json   # backend Swagger: the ONLY source for endpoints and models
decisions: requirements/DECISIONS.md
stack_profile: loops/_shared/stack-profiles/frontend-angular.md
orchestrator_plan: null              # set by the orchestrator: loops/orchestrator/outputs/02-milestone-plan.md
app_url: http://localhost:4200       # the UI URL tested with Playwright MCP
ui_reference: null                   # optional design mockup / UI artifact URL to follow visually
unit_tests: off                      # off | smoke | full   (optional per the brief)
```

## Goal
Build the frontend for everything in scope against the backend contract. Verify every milestone in a real browser through the Playwright MCP server before the next one starts.

## Done when
- Every milestone in `state/state.json` is `done`, with a green trial recorded in its file.
- `cd frontend && npx ng build` passes.
- Every page in the PRD is reachable from persistent navigation.
- The end-to-end journey scenario passes against a fresh stack, with screenshots in `outputs/evidence/`.
- `outputs/00-coverage.md` maps every in-scope story, UX requirement and acceptance criterion to a passing scenario step.
- `outputs/FINAL-report.md` exists.

## Out of scope
- Anything in `backend/` (request changes through `outputs/REQUESTS.md`).
- The PRD's "Non-Goals" and "Future Enhancements".
