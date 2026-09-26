# Task: orchestrator

```yaml
input:
  type: prd                        # prd | user_story
  path: requirements/PRD.md        # the full project requirements
  scope: ALL                       # ALL, or comma-separated PRD areas
  ref: null                        # user_story: e.g. US-PLAN-03 (story already in the PRD)
  text: null                       # user_story: the story text if it is new
decisions: requirements/DECISIONS.md
workers: [backend-dev, frontend-dev]
dispatch_mode: auto                # auto | sequential | parallel
```

`scripts/orchestrate.sh --input <path> | --story "<text>" | --ref US-XXX-NN` overrides this block for one run.

## Goal
Deliver the input end to end: plan it across the worker loops, let them build and verify it, then prove the integrated application satisfies the PRD's Definition of Done with a full-stack Playwright journey.

## Done when
- `outputs/01-requirements-map.md`, `02-milestone-plan.md` and `03-dependency-graph.md` exist and cover every in-scope requirement.
- Every worker loop is `complete`.
- O3 passed: the backend regression against the stable build, and the PRD's E2E journey through Playwright MCP, with evidence.
- `outputs/99-final-report.md` exists.
