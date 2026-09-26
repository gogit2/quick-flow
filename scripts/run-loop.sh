#!/usr/bin/env bash
# Run one loop: each iteration is a fresh headless Claude session. Records session id, tokens and cost for every iteration.
#
#   scripts/run-loop.sh <loop> [options]
#     --max-iter N       max agent iterations (default 80)
#     --until STATUS     also stop when the loop reaches STATUS (e.g. dispatched)
#     --input PATH       override task.md input: full requirements file (type=prd)
#     --story "TEXT"     override task.md input: a single new user story (type=user_story)
#     --ref US-XXX-NN    override task.md input: an existing story from the PRD (type=user_story)
#     --scope "A, B"     override task.md input scope
#     --model NAME       claude model (default: CLI default)
#
# Env: LOOP_PERMISSION_MODE (default acceptEdits; Bash rules come from .claude/settings.json)
#      LOOP_SKIP_PERMISSIONS=1  use --dangerously-skip-permissions (only in a sandbox/container)
#      LOOP_WAIT_SECONDS (60)  LOOP_MAX_WAIT_MIN (240)  LOOP_MAX_STUCK (3)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOOP="${1:?usage: run-loop.sh <loop> [options]}"; shift
[[ -d "loops/$LOOP" ]] || { echo "unknown loop: $LOOP"; exit 1; }

MAX_ITER=80 UNTIL="" OVERRIDE="" MODEL_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --max-iter) MAX_ITER="$2"; shift 2 ;;
    --until)    UNTIL="$2"; shift 2 ;;
    --input)    OVERRIDE+="type=prd path=$2 "; shift 2 ;;
    --story)    OVERRIDE+="type=user_story text=\"$2\" "; shift 2 ;;
    --ref)      OVERRIDE+="type=user_story ref=$2 "; shift 2 ;;
    --scope)    OVERRIDE+="scope=\"$2\" "; shift 2 ;;
    --model)    MODEL_ARGS=(--model "$2"); shift 2 ;;
    *) echo "unknown option $1"; exit 1 ;;
  esac
done

PERM_ARGS=(--permission-mode "${LOOP_PERMISSION_MODE:-acceptEdits}")
[[ "${LOOP_SKIP_PERMISSIONS:-0}" == 1 ]] && PERM_ARGS=(--dangerously-skip-permissions)
MCP_ARGS=()
[[ "$LOOP" != backend-dev && -f .mcp.json ]] && MCP_ARGS=(--mcp-config "$ROOT/.mcp.json")

# A new input reopens a finished loop for incremental planning (LOOP_PROTOCOL §7).
if [[ -n "$OVERRIDE" && "$(python3 scripts/loopctl.py status "$LOOP")" =~ ^(complete|blocked)$ ]]; then
  f="loops/$LOOP/state/state.json"; jq '.status="in_progress"' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
fi

WAIT_S="${LOOP_WAIT_SECONDS:-60}" MAX_WAIT_S=$(( ${LOOP_MAX_WAIT_MIN:-240} * 60 )) MAX_STUCK="${LOOP_MAX_STUCK:-3}"
LOGDIR="run-artifacts/logs/$LOOP"; mkdir -p "$LOGDIR"
state() { python3 scripts/loopctl.py status "$LOOP"; }
log()   { echo "[$(date +%H:%M:%S)] [$LOOP] $*"; }

iter=0 waited=0 stuck=0
while (( iter < MAX_ITER )); do
  s="$(state)"
  if [[ "$s" == complete || "$s" == blocked || ( -n "$UNTIL" && "$s" == "$UNTIL" ) ]]; then
    log "stop: status=$s"; break
  fi

  # Dependency gate: no tokens spent while waiting for another loop.
  set +e; python3 scripts/loopctl.py ready "$LOOP"; rc=$?; set -e
  if (( rc == 2 )); then log "deadlock: every pending milestone depends on a blocked milestone"; break; fi
  if (( rc == 1 )); then
    (( waited >= MAX_WAIT_S )) && { log "gave up waiting after $((waited/60)) min"; break; }
    log "waiting on other loops (${waited}s)"; sleep "$WAIT_S"; waited=$((waited + WAIT_S)); continue
  fi
  waited=0

  iter=$((iter + 1))
  PROMPT_FILE="$LOGDIR/prompt-$iter.txt"
  {
    echo "You are running exactly ONE iteration of the '$LOOP' loop in this repository."
    echo "Read loops/_shared/LOOP_PROTOCOL.md, then loops/$LOOP/Loop-instructions.md, and follow them for one iteration only."
    if [[ -n "$OVERRIDE" && $iter -eq 1 ]]; then
      echo "Runtime input override for this run: $OVERRIDE"
      echo "First write it into the input block of loops/$LOOP/task.md, then follow the protocol (§7: a changed input means incremental planning)."
    fi
    echo "Before you exit, make sure loops/$LOOP/state/state.json is valid JSON and last_iteration is filled in. End with a one-line summary."
  } > "$PROMPT_FILE"

  before="$(sha1sum "loops/$LOOP/state/state.json" | cut -d' ' -f1)"
  start="$(date -Iseconds)"
  log "iteration $iter start (status=$s)"
  set +e
  claude -p "$(cat "$PROMPT_FILE")" --output-format json "${PERM_ARGS[@]}" "${MCP_ARGS[@]}" "${MODEL_ARGS[@]}" \
    > "$LOGDIR/iter-$iter.json" 2> "$LOGDIR/iter-$iter.stderr"
  set -e
  end="$(date -Iseconds)"
  python3 scripts/loopctl.py record "$LOOP" --start "$start" --end "$end" --runner-iter "$iter" \
    --prompt-file "$PROMPT_FILE" < "$LOGDIR/iter-$iter.json" || log "WARN: could not record iteration"

  after="$(sha1sum "loops/$LOOP/state/state.json" | cut -d' ' -f1)"
  if [[ "$before" == "$after" ]]; then
    stuck=$((stuck + 1)); log "WARN: state.json unchanged ($stuck/$MAX_STUCK)"
    (( stuck >= MAX_STUCK )) && { log "stop: no progress for $MAX_STUCK iterations. See $LOGDIR"; break; }
  else
    stuck=0
  fi
done

log "finished after $iter iteration(s), status=$(state)"
python3 scripts/loopctl.py metrics "$LOOP" > /dev/null
