#!/usr/bin/env bash
set -euo pipefail

API_BASE="${API_BASE:-http://localhost:3001}"
MAILHOG_BASE="${MAILHOG_BASE:-http://localhost:8025}"
ARTIFACT_DIR="tests/artifacts"
mkdir -p "$ARTIFACT_DIR"

printf '[SMOKE] Проверка %s/health\n' "$API_BASE"
RESPONSE=$(curl -fsS "$API_BASE/health")
STATUS=$(printf '%s' "$RESPONSE" | jq -r '.status')
if [[ "$STATUS" != "ok" ]]; then
  printf '[SMOKE][ERROR] Ожидали status=ok, получили: %s\n' "$RESPONSE" >&2
  exit 1
fi

printf '[SMOKE] Срез заявок %s/requests\n' "$API_BASE"
REQUESTS=$(curl -fsS "$API_BASE/requests")
printf '%s' "$REQUESTS" | jq . >"$ARTIFACT_DIR/requests.json"
SUCCESS=$(printf '%s' "$REQUESTS" | jq -r '.success // false')
if [[ "$SUCCESS" != "true" ]]; then
  printf '[SMOKE][ERROR] /requests вернуло ошибку: %s\n' "$REQUESTS" >&2
  exit 1
fi

printf '[SMOKE] Проверка MailHog %s/api/v2/messages (необязательная)\n' "$MAILHOG_BASE"
if curl -fsS "$MAILHOG_BASE/api/v2/messages" >/dev/null 2>&1; then
  curl -fsS "$MAILHOG_BASE/api/v2/messages" >"$ARTIFACT_DIR/mailhog-messages.json" || true
else
  printf '[SMOKE][WARN] MailHog недоступен, продолжаем пониженным приоритетом\n'
fi

printf '[SMOKE] Проверка завершена успешно\n'
