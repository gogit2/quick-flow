# Mxx: <Milestone title>

| Field | Value |
|---|---|
| Loop | backend-dev / frontend-dev |
| Status | pending |
| Depends on | M01, backend-dev:M02 |
| Stories | US-XXX-01, US-XXX-02 |
| Requirements | FR-01, FR-02, BR-1, BR-4 |

## 1. Spec (what and why)
2–6 sentences: the user-visible outcome of this milestone and its boundaries (what is explicitly NOT included).

## 2. Design notes (how)
- Key entities, endpoints, or components, with file locations.
- Business rules to enforce, and where they live.
- Decisions used (link to `requirements/DECISIONS.md` IDs).

## 3. Tasks
- [ ] Mxx-T01 <small, concrete, verifiable task>
- [ ] Mxx-T02 ...
- [ ] Mxx-T0n Write the acceptance suite for this milestone (see §4)

## 4. Acceptance checks
Each check is objective and runnable. Link each one to the requirement it proves.

| # | Check | Proves | How |
|---|---|---|---|
| A1 | Create with valid body returns 201 and the body echoes the fields | FR-01 | `outputs/curl/Mxx-<slug>.sh` case 1 |
| A2 | Title > 200 chars returns 400 with a field error | BR-1 | case 2 |

Regression: all suites of earlier `done` milestones stay green.

## 5. Verification trials
<!-- One section per trial, appended by VERIFY. Maximum 3 trials. -->

### Trial 1 (<date>)
- Commands: ...
- Result: A1 ✅ A2 ❌ (reason)
- Evidence: `outputs/evidence/Mxx/trial-1/`

## 6. Notes / Blocked
<!-- Files touched per task, surprises, or (if blocked) root cause + what a human must decide. -->
