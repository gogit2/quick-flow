#!/usr/bin/env bash
# Backend process manager (PID files, health waits) so loops never leave orphan servers.
#   scripts/backend.sh start-dev              build current code, run on :8081 with a fresh verify DB (backend loop)
#   scripts/backend.sh stop-dev
#   scripts/backend.sh start-stable [--fresh] run the last PUBLISHED jar on :8080 (frontend loop / E2E)
#   scripts/backend.sh stop-stable
#   scripts/backend.sh publish                build the jar and copy it to run-artifacts/backend-latest.jar
#   scripts/backend.sh status
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUN="$ROOT/run-artifacts/run"; mkdir -p "$RUN" "$ROOT/run-artifacts/data"
JAR_STABLE="$ROOT/run-artifacts/backend-latest.jar"

build_jar() {
  (cd "$ROOT/backend" && ./mvnw -q -DskipTests package) >&2
  ls "$ROOT"/backend/target/*.jar 2>/dev/null | grep -v -- '-plain' | head -1
}

wait_health() {  # port name logfile
  for _ in $(seq 1 90); do
    curl -fs "http://localhost:$1/actuator/health" 2>/dev/null | grep -q '"UP"' && { echo "$2 up on :$1"; return 0; }
    sleep 1
  done
  echo "$2 failed to start on :$1. Last log lines:"; tail -40 "$3"; return 1
}

start() {  # name port jar dbpath fresh
  local name=$1 port=$2 jar=$3 db=$4 fresh=$5 pidf="$RUN/$1.pid" logf="$RUN/$1.log"
  stop "$name" quiet
  [[ -f "$jar" ]] || { echo "jar not found: $jar"; exit 1; }
  [[ "$fresh" == 1 ]] && rm -f "$db".mv.db "$db".trace.db
  SERVER_PORT=$port SPRING_DATASOURCE_URL="jdbc:h2:file:$db;AUTO_SERVER=FALSE" \
    nohup java -jar "$jar" > "$logf" 2>&1 &
  echo $! > "$pidf"
  wait_health "$port" "$name" "$logf"
}

stop() {
  local pidf="$RUN/$1.pid"
  if [[ -f "$pidf" ]]; then
    kill "$(cat "$pidf")" 2>/dev/null && { for _ in $(seq 1 20); do kill -0 "$(cat "$pidf")" 2>/dev/null || break; sleep 0.5; done; }
    kill -9 "$(cat "$pidf")" 2>/dev/null || true
    rm -f "$pidf"; [[ "${2:-}" == quiet ]] || echo "$1 stopped"
  else
    [[ "${2:-}" == quiet ]] || echo "$1 not running"
  fi
}

case "${1:-}" in
  start-dev)    start backend-dev 8081 "$(build_jar)" "$ROOT/backend/data/verify" 1 ;;
  stop-dev)     stop backend-dev ;;
  start-stable) start backend-stable 8080 "$JAR_STABLE" "$ROOT/run-artifacts/data/stable" "$([[ "${2:-}" == --fresh ]] && echo 1 || echo 0)" ;;
  stop-stable)  stop backend-stable ;;
  publish)      cp "$(build_jar)" "$JAR_STABLE" && echo "published $JAR_STABLE" ;;
  status)       for n in backend-dev backend-stable; do
                  [[ -f "$RUN/$n.pid" ]] && kill -0 "$(cat "$RUN/$n.pid")" 2>/dev/null && echo "$n: running" || echo "$n: stopped"
                done ;;
  *) sed -n '2,8p' "$0"; exit 1 ;;
esac
