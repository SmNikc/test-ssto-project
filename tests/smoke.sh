#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001/api}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-${API_BASE%/api}/health}"
MAILHOG="${MAILHOG:-http://localhost:8025}"
TMP_DIR="${SMOKE_TMP_DIR:-$(mktemp -d)}"
PDF_PATH="${TMP_DIR}/confirmation.pdf"
MAILHOG_SNAPSHOT="tests/mailhog-snapshot.json"
PRIMARY_EMAIL="${SMOKE_PRIMARY_EMAIL:-od_smrcc@morflot.ru}"

cleanup() {
  rm -rf "${TMP_DIR}" || true
}
trap cleanup EXIT

echo "[SMOKE] Health check ${HEALTH_ENDPOINT}"
HEALTH_STATUS=$(curl -fsS -w "%{http_code}" -o "${TMP_DIR}/health.json" "${HEALTH_ENDPOINT}")
if [[ "${HEALTH_STATUS}" != "200" ]]; then
  echo "[SMOKE] health endpoint returned ${HEALTH_STATUS}" >&2
  exit 1
fi
cat "${TMP_DIR}/health.json"

echo "[SMOKE] operator login"
LOGIN_PAYLOAD='{"username":"operator","password":"operator"}'
TOK=$(curl -fsS -X POST "${API_BASE}/auth/login" -H 'Content-Type: application/json' -d "${LOGIN_PAYLOAD}" | jq -r '.access_token // empty')
if [[ -z "${TOK}" ]]; then
  echo "[SMOKE] failed to obtain access token" >&2
  exit 2
fi

REQUEST_BODY='{"terminal_number":"TST-9001","vessel_name":"M/V TESTER","mmsi":"273123456","owner_email":"owner@example.com","planned_test_date":"2025-10-01T08:00:00Z"}'
echo "[SMOKE] create request"
REQUEST_RESPONSE=$(curl -fsS -X POST "${API_BASE}/requests" -H "Authorization: Bearer ${TOK}" -H 'Content-Type: application/json' -d "${REQUEST_BODY}")
echo "${REQUEST_RESPONSE}" > "${TMP_DIR}/request.json"
REQUEST_ID=$(node -pe "const data=JSON.parse(fs.readFileSync('${TMP_DIR}/request.json','utf8')); data.data?.id ?? data.data?.request?.id ?? data.id ?? ''")
if [[ -z "${REQUEST_ID}" ]]; then
  echo "[SMOKE] request creation failed" >&2
  cat "${TMP_DIR}/request.json"
  exit 3
fi

echo "[SMOKE] approve request ${REQUEST_ID}"
APPROVE_RESPONSE=$(curl -fsS -X PUT "${API_BASE}/requests/${REQUEST_ID}/status" -H "Authorization: Bearer ${TOK}" -H 'Content-Type: application/json' -d '{"status":"APPROVED"}')
echo "${APPROVE_RESPONSE}" > "${TMP_DIR}/approve.json"

SIGNAL_BODY='{"signal_type":"TEST","terminal_number":"TST-9001","mmsi":"273123456","is_test":true,"payload":{"source":"smoke"}}'
echo "[SMOKE] send test signal"
SIGNAL_RESPONSE=$(curl -fsS -X POST "${API_BASE}/signals" -H "Authorization: Bearer ${TOK}" -H 'Content-Type: application/json' -d "${SIGNAL_BODY}")

echo "${SIGNAL_RESPONSE}" > "${TMP_DIR}/signal.json"
SIGNAL_ID=$(node -pe "const data=JSON.parse(fs.readFileSync('${TMP_DIR}/signal.json','utf8')); data.id ?? data.data?.id ?? ''")
if [[ -z "${SIGNAL_ID}" ]]; then
  echo "[SMOKE] signal creation failed" >&2
  cat "${TMP_DIR}/signal.json"
  exit 4
fi

echo "[SMOKE] generate PDF for signal ${SIGNAL_ID}"
curl -fsS -X POST "${API_BASE}/signals/generate-report/${SIGNAL_ID}" -H "Authorization: Bearer ${TOK}" -o "${PDF_PATH}"
if [[ ! -s "${PDF_PATH}" ]]; then
  echo "[SMOKE] PDF file missing" >&2
  exit 5
fi
node tests/assert-pdf.js "${PDF_PATH}" 'МИНТРАНС РОССИИ'

sleep 2
echo "[SMOKE] snapshot MailHog"
curl -fsS "${MAILHOG}/api/v2/messages" > "${MAILHOG_SNAPSHOT}"
MAIL_COUNT=$(node -pe "JSON.parse(fs.readFileSync('${MAILHOG_SNAPSHOT}','utf8')).total ?? 0")
echo "[SMOKE] MailHog total messages: ${MAIL_COUNT}"
MAILHOG_EXPECTED_RECIPIENT="${PRIMARY_EMAIL}" node tests/assert-mailhog.js "${MAILHOG_SNAPSHOT}"

echo "[SMOKE] completed successfully"
