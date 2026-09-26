#!/usr/bin/env bash
# Run every backend curl acceptance suite (or those matching a prefix) against BASE_URL.
#   scripts/curl-regression.sh            all suites
#   scripts/curl-regression.sh M03        only M03-*.sh
#   BASE_URL=http://localhost:8080/api/v1 scripts/curl-regression.sh   (against the stable build)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/loops/backend-dev/outputs/curl"
export BASE_URL="${BASE_URL:-http://localhost:8081/api/v1}"
shopt -s nullglob
suites=("$DIR"/${1:-M}*.sh)
(( ${#suites[@]} )) || { echo "no suites found in $DIR"; exit 1; }
failed=()
for s in "${suites[@]}"; do
  echo "=== $(basename "$s") ==="
  bash "$s" || failed+=("$(basename "$s")")
done
echo
if (( ${#failed[@]} )); then echo "REGRESSION FAILED: ${failed[*]}"; exit 1; fi
echo "REGRESSION PASSED: ${#suites[@]} suite(s)"
