# Loop: frontend-dev

**Input:** a PRD (or a single user story) and the backend Swagger contract (`backend/openapi/openapi.json`), both named in `task.md`.
**Output:** a working frontend in `frontend/` served at the app URL, one milestone file per phase in `outputs/`, one Playwright scenario file per phase in `outputs/e2e/`, and evidence (snapshots/screenshots) in `outputs/evidence/`.

Follow `loops/_shared/LOOP_PROTOCOL.md` exactly. This file only adds the frontend-specific parts.
Stack details are in the stack profile named in `task.md`.

---

## PLAN: how to split the work into milestones

1. **M01 Shell.** Project setup, Material, app shell with **persistent navigation to every page in the PRD** (placeholder pages with `<h1>`), API base/proxy, error handling interceptor, NowService, NotificationService skeleton, shared empty-state component. Scenario: every nav link opens its page.
2. **One milestone per page/feature**, in the same order as the backend areas it depends on. Each milestone's `depends_on` names the backend milestone that provides its endpoints (`backend-dev:Mxx`). Cross-loop dependencies are checked automatically.
3. **Aggregate pages** (dashboard/summary) after the features they summarize.
4. **Last milestone: end-to-end journey.** The full user journey from the PRD's testing requirements, run as one continuous Playwright scenario, plus a UX pass (empty states, validation messages, the dashboard updating after mutations).

Rules for planning:
- Every in-scope user story, UX requirement and acceptance criterion must map to at least one milestone and one scenario step. Write `outputs/00-coverage.md` (requirement → milestone → scenario step).
- If `task.md` gives a `ui_reference` (a design mockup URL or file), follow its layout and visual language. Otherwise use clean Material defaults.
- Read `requirements/DECISIONS.md` (for example the notification and rest-time behaviour).

## BUILD: frontend specifics
- **Read the Swagger contract before each feature.** Models and services must match it exactly (field names, enum values, status codes).
- Add `data-testid` on every element a scenario will touch or assert (see the stack profile for the naming convention).
- Forms mirror the backend validation (required fields, max lengths, date ordering) and show backend field errors.
- Every list page has: add action, list, remove action, **empty state that points to the add action**.
- End every BUILD iteration with `cd frontend && npx ng build` succeeding.

## VERIFY: frontend acceptance procedure with Playwright MCP (= 1 trial)
1. `cd frontend && npx ng build`. It must succeed. (Optional: unit tests if `task.md` → `unit_tests` is not `off`.)
2. `scripts/backend.sh start-stable --fresh` (last published backend jar on :8080, empty DB) and `scripts/frontend.sh start` (`app_url`).
3. Run the milestone scenario `outputs/e2e/Mxx-<slug>.md` step by step with the **Playwright MCP tools**:
   - `browser_navigate` to `app_url` → act (`browser_click`, `browser_type`, `browser_fill_form`, `browser_select_option`) → assert with `browser_snapshot`.
   - After each scenario: check `browser_console_messages` (no errors) and `browser_network_requests` (no 5xx), and take a `browser_take_screenshot` of the final state.
   - Record each step as ✅/❌ in the scenario file's result table for this trial. Put evidence in `outputs/evidence/Mxx/trial-<n>/`.
4. Regression: re-run the **smoke path** of every earlier `done` milestone (the first scenario of each file, marked `[smoke]`).
5. `scripts/frontend.sh stop` and `scripts/backend.sh stop-stable`. Always stop them.
- PASS = the build is green, every step of this milestone's scenario is ✅, all smoke paths are ✅, and there are no console errors or 5xx responses.
- On PASS: commit (paths: `frontend loops/frontend-dev`).

### Scenario file format (`outputs/e2e/Mxx-<slug>.md`)
```markdown
# Mxx scenarios
## S1 [smoke] Create a task from the Tasks page
Proves: US-TASK-01, FR-01, UX Tasks Page
| Step | Action | Expected |
|---|---|---|
| 1 | navigate {app_url}/tasks | h1 "Tasks" visible; empty-state-tasks visible |
| 2 | click task-add-btn; type task-form-title "E2E task {ts}"; click task-form-save | row with "E2E task {ts}" visible |
### Results
| Trial | S1.1 | S1.2 | Console | 5xx | Screenshot |
|---|---|---|---|---|---|
```
Time-dependent scenarios (notifications, countdowns): create the data relative to now (for example start = now + 1 min), then `browser_wait_for` the expected text for up to 90 s.
If waiting is impractical, the backend's time-relative data plus a check that the countdown value changes between two snapshots is acceptable.

## If the backend is wrong or missing something
Do not work around it in the frontend. Write the gap in `outputs/REQUESTS.md` (endpoint, expected contract, which story needs it). Set the milestone's `last_error`. If the milestone cannot pass without the change, let it use its trials and block with that reason. The orchestrator routes requests back to the backend loop.

## FINAL
Run the end-to-end journey scenario once more against a fresh stack. Write `outputs/FINAL-report.md`: pages built, coverage matrix, scenario results with evidence links, known limitations, and how to run.
