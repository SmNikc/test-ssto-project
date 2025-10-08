#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="tests/artifacts"
mkdir -p "$ARTIFACTS_DIR"

API_BASE="${API_BASE:-http://localhost:3001/api}"
BASE="${API_BASE%/}"
ROOT="${BASE%/api}"

HEALTH_CANDIDATES=("$BASE/health" "$ROOT/health")
UNMATCHED_URL="$BASE/signals/unmatched?sort=score&dir=desc&limit=100"

for url in "${HEALTH_CANDIDATES[@]}"; do
  if ./tests/smoke/wait-for.sh "$url" 60; then
    HEALTH_URL="$url"
    break
  fi
done

if [[ -z "${HEALTH_URL:-}" ]]; then
  echo "[SMOKE][FAIL] /health недоступен"; exit 1
fi

echo "[SMOKE] GET $UNMATCHED_URL"
http_code=$(curl -sS -w "%{http_code}" -o "$ARTIFACTS_DIR/unmatched.json" "$UNMATCHED_URL" || true)
echo "[SMOKE] /signals/unmatched HTTP $http_code"
if [[ "$http_code" != "200" ]]; then
  echo "[SMOKE][FAIL] /signals/unmatched != 200"; exit 1
fi

if [[ ! -s "$ARTIFACTS_DIR/unmatched.json" ]]; then
  echo "[SMOKE][FAIL] unmatched.json пустой"; exit 1
fi

TOP=$(grep -o '"requestId":[0-9][0-9]*' "$ARTIFACTS_DIR/unmatched.json" | head -n 3 | tr '\n' ' ')
echo "[SMOKE][OK] /signals/unmatched; TOP SUGGESTIONS: $TOP"
echo "[SMOKE][ARTIFACTS] см. $ARTIFACTS_DIR/unmatched.json"
