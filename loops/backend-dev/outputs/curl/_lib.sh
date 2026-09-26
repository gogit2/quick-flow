#!/usr/bin/env bash
# Shared helpers for curl acceptance suites. Source it: source "$(dirname "$0")/_lib.sh"
#   req METHOD PATH [BODY]          -> sets STATUS, BODY, HEADERS (PATH relative to BASE_URL, or absolute http URL)
#   expect_status ID DESC CODE      -> PASS/FAIL on $STATUS (CODE may be "200|302")
#   expect_json ID DESC JQ EXPECTED -> PASS/FAIL on jq -r "$JQ" of $BODY
#   expect_header ID DESC NAME VAL  -> PASS/FAIL on a response header (case-insensitive name, substring value)
#   iso_in "+10 min"                -> UTC ISO-8601 instant relative to now
#   uniq                            -> unique suffix for titles
#   summary                         -> prints totals, exit 1 if any check failed
set -uo pipefail
BASE_URL="${BASE_URL:-http://localhost:8081/api/v1}"
ROOT_URL="${BASE_URL%/api/v1}"
PASS_COUNT=0; FAIL_COUNT=0
STATUS=""; BODY=""; HEADERS=""
_HDR_FILE="$(mktemp)"; trap 'rm -f "$_HDR_FILE"' EXIT

req() {  # METHOD PATH [BODY] [extra curl args...]
  local method=$1 path=$2 data=${3:-}; shift $(( $# < 3 ? $# : 3 ))
  local url; [[ "$path" == http* ]] && url="$path" || url="$BASE_URL$path"
  local args=(-s -o - -D "$_HDR_FILE" -w '\n%{http_code}' -X "$method" -H 'Accept: application/json, application/problem+json')
  [[ -n "$data" ]] && args+=(-H 'Content-Type: application/json' --data "$data")
  local out; out="$(curl "${args[@]}" "$@" "$url")"
  STATUS="${out##*$'\n'}"; BODY="${out%$'\n'*}"; HEADERS="$(tr -d '\r' < "$_HDR_FILE")"
}

_pass() { PASS_COUNT=$((PASS_COUNT+1)); echo "PASS $1 $2"; }
_fail() { FAIL_COUNT=$((FAIL_COUNT+1)); echo "FAIL $1 $2 ($3)"; }

expect_status() {  # ID DESC CODE
  if [[ "$STATUS" =~ ^($3)$ ]]; then _pass "$1" "$2"; else _fail "$1" "$2" "got $STATUS, want $3; body: ${BODY:0:200}"; fi
}

expect_json() {  # ID DESC JQ EXPECTED
  local got; got="$(jq -r "$3" <<<"$BODY" 2>/dev/null)"
  if [[ "$got" == "$4" ]]; then _pass "$1" "$2"; else _fail "$1" "$2" "$3 = '$got', want '$4'"; fi
}

expect_header() {  # ID DESC NAME VALUE
  local got; got="$(grep -i "^$3:" <<<"$HEADERS" | head -1 | cut -d' ' -f2-)"
  if [[ -n "$got" && "$got" == *"$4"* ]]; then _pass "$1" "$2"; else _fail "$1" "$2" "header $3 = '$got', want '*$4*'"; fi
}

iso_in() { date -u -d "$1" +%Y-%m-%dT%H:%M:%SZ; }
uniq() { echo "$(date +%s%N | tail -c 10)$RANDOM"; }

summary() {
  echo "--- $PASS_COUNT passed, $FAIL_COUNT failed"
  (( FAIL_COUNT == 0 ))
}
