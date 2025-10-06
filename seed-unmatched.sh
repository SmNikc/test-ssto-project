#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001/api}"
COUNT="${COUNT:-5}"

echo "[SEED] Seeding UNMATCHED signals via $API_BASE/_dev/seed/unmatched (count=$COUNT)"
code=$(curl -sS -o /tmp/seed-unmatched.json -w "%{http_code}" -X POST "$API_BASE/_dev/seed/unmatched"   -H "Content-Type: application/json"   -d "{"count":$COUNT,"withSuggestions":true,"tag":"e2e-fixture"}")
cat /tmp/seed-unmatched.json || true
echo

if [[ "$code" != "200" ]]; then
  echo "[SEED][FAIL] HTTP $code" >&2
  exit 1
fi

echo "[SEED][OK]"
