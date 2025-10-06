#!/usr/bin/env bash
set -euo pipefail
BASE="${API_BASE:-http://localhost:3001/api}"
TOKEN="${E2E_SEED_TOKEN:-ci-token}"
SEED_FILE="${SEED_FILE:-tests/e2e/fixtures/unmatched.seed.json}"

if [[ ! -f "$SEED_FILE" ]]; then
  echo "[SEED][FAIL] seed file not found: $SEED_FILE" >&2
  exit 1
fi

echo "[SEED] POST $BASE/__e2e__/seed/unmatched"
BODY=$(node -e "const fs=require('fs');const f=process.env.SEED_FILE;const t=process.env.E2E_SEED_TOKEN||'ci-token';const o=JSON.parse(fs.readFileSync(f,'utf8'));o.token=t;process.stdout.write(JSON.stringify(o));")
code=$(curl -sS -w "%{http_code}" -o /tmp/seed.out -X POST "$BASE/__e2e__/seed/unmatched"   -H "Content-Type: application/json"   --data-binary "$BODY" || true)

echo "[SEED] HTTP $code"
cat /tmp/seed.out || true

if [[ "$code" != "200" ]]; then
  echo "[SEED][FAIL] unexpected HTTP $code" >&2
  exit 1
fi

echo "[SEED][OK]"
