#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"
ARTIFACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/artifacts"
LOG_FILE="$ARTIFACTS_DIR/smoke.log"

mkdir -p "$ARTIFACTS_DIR"
: > "$LOG_FILE"

log() {
  echo "[$(date -Is)] $*" | tee -a "$LOG_FILE"
}

fail() {
  log "ERROR: $*"
  exit 1
}

log "SMOKE: using API base $BASE_URL"

log "S1: health check"
health_status=$(curl -s -o "$ARTIFACTS_DIR/health.json" -w "%{http_code}" "$BASE_URL/health") || fail "health request failed"
if [[ "$health_status" != "200" ]]; then
  fail "Health endpoint returned $health_status"
fi
if ! grep -q '"status"' "$ARTIFACTS_DIR/health.json"; then
  fail "Health payload does not contain status"
fi

log "S2: operator login"
login_payload='{"email":"operator@test.com","password":"secret"}'
login_response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$login_payload" "$BASE_URL/auth/login") || fail "login request failed"
login_body=$(echo "$login_response" | head -n1)
login_code=$(echo "$login_response" | tail -n1)
if [[ "$login_code" != "200" ]]; then
  fail "Login failed with code $login_code"
fi
access_token=$(node -e "const r=$login_body;const data=typeof r==='string'?JSON.parse(r):r; if(!data.accessToken&&!data.access_token) process.exit(1); console.log(data.accessToken||data.access_token);") || fail "Access token missing"
log "Token acquired (${#access_token} chars)"

ts=$(date +%s)
request_payload=$(cat <<JSON
{
  "vessel_name": "SMOKE TEST VESSEL $ts",
  "mmsi": "273${ts: -6}",
  "ssas_number": "SMOKE-$ts",
  "contact_email": "smoke+$ts@example.com",
  "contact_person": "Smoke Tester",
  "contact_phone": "+79990000000"
}
JSON
)

log "S3: create request"
request_response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" -d "$request_payload" "$BASE_URL/requests") || fail "Create request failed"
request_body=$(echo "$request_response" | head -n1)
request_code=$(echo "$request_response" | tail -n1)
if [[ "$request_code" != "201" ]]; then
  fail "Unexpected status $request_code while creating request"
fi
request_id=$(node -e "const data=JSON.parse(process.argv[1]); if(!data.data||!data.data.id){process.exit(1);} console.log(data.data.id);" "$request_body") || fail "Request id missing"
log "Request created with id $request_id"

log "Smoke suite finished"
