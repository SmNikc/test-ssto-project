#!/usr/bin/env bash
set -euo pipefail
URL="$1"; TIMEOUT="${2:-60}"
echo "[WAIT] $URL (timeout ${TIMEOUT}s)"
end=$((SECONDS+TIMEOUT))
while [ $SECONDS -lt $end ]; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$URL" || true)
  if [ "$code" = "200" ]; then
    echo "[WAIT][OK] $URL"
    exit 0
  fi
  sleep 2
done
echo "[WAIT][FAIL] $URL"; exit 1
