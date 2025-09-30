#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
MAILHOG="${MAILHOG:-http://localhost:8025}"

echo "[SMOKE] /health"
curl -fsS "${API_BASE}/health" | jq .

echo "[SMOKE] login (operator)"
TOK=$(curl -fsS -X POST "${API_BASE}/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"operator","password":"operator"}' | jq -r '.access_token')
test -n "$TOK"

echo "[SMOKE] create request"
REQ=$(curl -fsS -X POST "${API_BASE}/api/requests" -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"terminal_number":"TST-0001","vessel_name":"M/V TESTER","mmsi":"273123456","owner_email":"owner@example.com"}' | jq -r '.id')
echo "request id=$REQ"

echo "[SMOKE] send TEST signal (matched)"
SIG=$(curl -fsS -X POST "${API_BASE}/api/signals" -H "Authorization: Bearer $TOK" -H 'Content-Type: application/json' \
  -d '{"signal_type":"TEST","terminal_number":"TST-0001","payload":{"source":"smoke"}}' | jq -r '.id')
echo "signal id=$SIG"

echo "[SMOKE] generate PDF"
curl -fsS -X POST "${API_BASE}/api/signals/generate-report/$SIG" -H "Authorization: Bearer $TOK" -o /tmp/report.pdf
test -s /tmp/report.pdf && echo "PDF ok: /tmp/report.pdf"

echo "[SMOKE] snapshot MailHog"
curl -fsS "${MAILHOG}/api/v2/messages" | tee tests/mailhog-snapshot.json >/dev/null

echo "[SMOKE] done"
