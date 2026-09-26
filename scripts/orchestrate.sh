#!/usr/bin/env bash
# Full pipeline: orchestrator plans → worker loops build (sequential or parallel) → orchestrator routes/integrates.
#
#   scripts/orchestrate.sh                              # full PRD from loops/orchestrator/task.md
#   scripts/orchestrate.sh --input requirements/PRD.md  # full project requirements
#   scripts/orchestrate.sh --ref US-PLAN-07             # one existing user story (incremental)
#   scripts/orchestrate.sh --story "As a user I want tags on tasks"   # one new story (incremental)
#   scripts/orchestrate.sh --mode parallel|sequential   # override the orchestrator's choice
#   scripts/orchestrate.sh --only backend-dev           # run just one worker after planning
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
MODE="" ONLY="" PASS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) MODE="$2"; shift 2 ;;
    --only) ONLY="$2"; shift 2 ;;
    --input|--story|--ref|--scope|--model) PASS+=("$1" "$2"); shift 2 ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
done
log() { echo "[$(date +%H:%M:%S)] [orchestrate] $*"; }
status() { python3 scripts/loopctl.py status "$1"; }
set_orch_status() {
  local f=loops/orchestrator/state/state.json
  jq --arg s "$1" '.status=$s' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
}

# If a new input is given after a finished run, reopen the orchestrator for incremental planning.
if [[ ${#PASS[@]} -gt 0 && "$(status orchestrator)" =~ ^(complete|blocked)$ ]]; then
  set_orch_status not_started
fi

log "phase 1: analyze and plan"
scripts/run-loop.sh orchestrator --until dispatched --max-iter 3 "${PASS[@]}"
[[ "$(status orchestrator)" == dispatched ]] || { log "orchestrator did not dispatch (status=$(status orchestrator))"; exit 1; }

for round in 1 2 3; do
  mode="${MODE:-$(jq -r '.dispatch.mode // "sequential"' loops/orchestrator/state/state.json)}"
  log "phase 2 (round $round): workers, mode=$mode"
  # A re-dispatched worker was re-opened by the orchestrator; a finished one exits immediately.
  if [[ -n "$ONLY" ]]; then
    scripts/run-loop.sh "$ONLY"; exit 0
  elif [[ "$mode" == parallel ]]; then
    scripts/run-loop.sh backend-dev > >(sed 's/^/  /') 2>&1 &
    b=$!
    scripts/run-loop.sh frontend-dev > >(sed 's/^/  /') 2>&1 &
    f=$!
    wait $b || true; wait $f || true
  else
    scripts/run-loop.sh backend-dev
    scripts/run-loop.sh frontend-dev
  fi

  log "phase 3: route / integrate"
  set_orch_status reviewing            # workers have stopped: hand control back to the orchestrator
  scripts/run-loop.sh orchestrator --max-iter 4 --until dispatched
  s="$(status orchestrator)"
  [[ "$s" == dispatched ]] || break      # complete or blocked
  log "orchestrator re-dispatched workers"
done

log "done: orchestrator=$(status orchestrator) backend=$(status backend-dev) frontend=$(status frontend-dev)"
python3 scripts/loopctl.py summary
