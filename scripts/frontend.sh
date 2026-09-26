#!/usr/bin/env bash
# Frontend dev server manager.
#   scripts/frontend.sh start    ng serve on :4200 (proxy /api → :8080), waits until the app is served
#   scripts/frontend.sh stop
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN="$ROOT/run-artifacts/run"; mkdir -p "$RUN"
PIDF="$RUN/frontend.pid" LOGF="$RUN/frontend.log" PORT="${FRONTEND_PORT:-4200}"

stop() {
  if [[ -f "$PIDF" ]]; then
    # ng serve spawns children: kill the whole process group
    kill -- -"$(cat "$PIDF")" 2>/dev/null || kill "$(cat "$PIDF")" 2>/dev/null || true
    rm -f "$PIDF"; echo "frontend stopped"
  else
    echo "frontend not running"
  fi
}

case "${1:-}" in
  start)
    stop > /dev/null
    [[ -d "$ROOT/frontend/node_modules" ]] || (cd "$ROOT/frontend" && npm ci --no-audit --no-fund)
    cd "$ROOT/frontend"
    setsid nohup npx ng serve --port "$PORT" --proxy-config proxy.conf.json > "$LOGF" 2>&1 &
    echo $! > "$PIDF"
    for _ in $(seq 1 180); do
      curl -fs "http://localhost:$PORT" > /dev/null 2>&1 && { echo "frontend up on http://localhost:$PORT"; exit 0; }
      sleep 1
    done
    echo "frontend failed to start. Last log lines:"; tail -40 "$LOGF"; exit 1 ;;
  stop) stop ;;
  *) sed -n '2,4p' "$0"; exit 1 ;;
esac
