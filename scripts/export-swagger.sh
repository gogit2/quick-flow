#!/usr/bin/env bash
# Export the OpenAPI contract from a running backend into backend/openapi/ (the frontend loop's input).
#   scripts/export-swagger.sh [port]   (default 8081 = backend loop's verify instance)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8081}" OUT="$ROOT/backend/openapi"
mkdir -p "$OUT"
curl -fsS "http://localhost:$PORT/v3/api-docs" | jq --sort-keys . > "$OUT/openapi.json"
curl -fsS "http://localhost:$PORT/v3/api-docs.yaml" > "$OUT/openapi.yaml"
echo "exported $(jq '.paths | length' "$OUT/openapi.json") paths → backend/openapi/openapi.{json,yaml}"
jq -r '.paths | to_entries[] | .key as $p | .value | to_entries[] | "\(.key|ascii_upcase)\t\($p)\t\(.value.summary // "!! MISSING SUMMARY")"' "$OUT/openapi.json"
