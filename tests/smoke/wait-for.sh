#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <url> [timeout]" >&2
  exit 1
fi

URL="$1"
TIMEOUT="${2:-120}"
INTERVAL=3

end=$((SECONDS + TIMEOUT))
while (( SECONDS < end )); do
  if curl -fsS "$URL" >/dev/null 2>&1; then
    exit 0
  fi
  sleep "$INTERVAL"
done

echo "[wait-for] Timeout waiting for $URL" >&2
exit 1
