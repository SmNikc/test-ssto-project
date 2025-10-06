#!/usr/bin/env bash
set -euo pipefail

ARTIFACTS_DIR="tests/artifacts"
mkdir -p "$ARTIFACTS_DIR"

API_BASE="${API_BASE:-http://localhost:3001/api}"
MAILHOG="${MAILHOG:-http://localhost:8025}"

BASE="${API_BASE%/}"
ROOT="${BASE%/api}"
CANDIDATES_HEALTH=("$BASE/health" "$ROOT/health")
CANDIDATES_REQ=("$BASE/requests" "$ROOT/requests")

try_curl() {
  local url="$1"
  local outfile="$2"
  echo "[SMOKE] GET $url"
  http_code=$(curl -sS -w "%{http_code}" -o "$outfile" "$url" || true)
  echo "HTTP $http_code"
  [[ "$http_code" == "200" ]]
}

HEALTH_URL=""
for url in "${CANDIDATES_HEALTH[@]}"; do
  if bash ./tests/smoke/wait-for.sh "$url" 90; then
    HEALTH_URL="$url"
    break
  fi
done
[[ -n "$HEALTH_URL" ]] || { echo "[SMOKE][FAIL] /health недоступен"; exit 1; }

try_curl "$HEALTH_URL" "$ARTIFACTS_DIR/health.json" || { echo "[SMOKE][FAIL] /health !=200"; exit 1; }

REQ_OK=0
for url in "${CANDIDATES_REQ[@]}"; do
  if try_curl "$url" "$ARTIFACTS_DIR/requests.json"; then
    REQ_URL="$url"; REQ_OK=1; break
  fi
done
if [[ $REQ_OK -ne 1 ]]; then
  echo "[SMOKE][FAIL] /requests недоступен"; exit 1
fi

echo "[SMOKE][OK] health: $HEALTH_URL; requests: $REQ_URL"
echo "[SMOKE][ARTIFACTS] см. $ARTIFACTS_DIR/health.json и $ARTIFACTS_DIR/requests.json"
# pad 0
# pad 1
# pad 2
# pad 3
# pad 4
# pad 5
# pad 6
# pad 7
# pad 8
# pad 9
# pad 10
# pad 11
# pad 12
# pad 13
# pad 14
# pad 15
# pad 16
