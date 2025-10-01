#!/bin/bash
# tests/smoke.sh - Smoke tests for SSTO API

set -e

# Настройки
API_BASE="${API_BASE:-http://localhost:3001/api}"
LOG_FILE="tests/smoke.log"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция логирования
log() {
    echo -e "${1}" | tee -a "${LOG_FILE}"
}

# Очистка лога
> "${LOG_FILE}"

log "${GREEN}[SMOKE] Starting smoke tests${NC}"
log "[SMOKE] API Base: ${API_BASE}"

# 1. Проверка health endpoint
echo "[SMOKE] Checking health endpoint..."
HEALTH_RESPONSE=$(curl -fsS "http://localhost:3001/health" || echo '{"error": "Failed to connect"}')
log "[SMOKE] Health response: ${HEALTH_RESPONSE}"

if echo "${HEALTH_RESPONSE}" | grep -q '"status":"ok"'; then
    log "${GREEN}✓ Health check passed${NC}"
else
    log "${RED}✗ Health check failed${NC}"
    exit 1
fi

# 2. Авторизация оператора
echo "[SMOKE] Testing operator login..."
LOGIN_PAYLOAD='{"email":"operator@ssto.ru","password":"operator"}'
# Альтернативный вариант для обратной совместимости
# LOGIN_PAYLOAD='{"username":"operator","email":"operator@ssto.ru","password":"operator"}'

TOKEN_RESPONSE=$(curl -fsS -X POST "${API_BASE}/auth/login" \
    -H 'Content-Type: application/json' \
    -d "${LOGIN_PAYLOAD}" || echo '{"error": "Login failed"}')

TOK=$(echo "${TOKEN_RESPONSE}" | ./jq.exe -r '.access_token // .token // empty')

if [[ -z "${TOK}" ]]; then
    log "${RED}✗ Failed to obtain access token${NC}"
    log "[SMOKE] Login response: ${TOKEN_RESPONSE}"
    exit 2
fi

log "${GREEN}✓ Login successful, token obtained${NC}"

# 3. Создание тестовой заявки
echo "[SMOKE] Creating test request..."
REQUEST_PAYLOAD=$(cat <<EOF
{
    "vessel_name": "Test Vessel $(date +%s)",
    "mmsi": "273$(shuf -i 100000-999999 -n 1)",
    "imo": "IMO$(shuf -i 1000000-9999999 -n 1)",
    "call_sign": "TEST$(shuf -i 100-999 -n 1)",
    "owner_organization": "Test Organization",
    "ship_owner": "Test Organization",
    "owner_email": "owner@test.ru",
    "contact_person": "Test Contact",
    "contact_phone": "+7 (900) 123-45-67",
    "contact_email": "contact@test.ru",
    "test_date": "$(date -d '+7 days' +%Y-%m-%d)",
    "start_time": "10:00",
    "end_time": "14:00",
    "notes": "Smoke test request"
}
EOF
)

CREATE_RESPONSE=$(curl -fsS -X POST "${API_BASE}/requests" \
    -H "Authorization: Bearer ${TOK}" \
    -H 'Content-Type: application/json' \
    -d "${REQUEST_PAYLOAD}" || echo '{"error": "Failed to create request"}')

REQUEST_ID=$(echo "${CREATE_RESPONSE}" | ./jq.exe -r '.data.id // .id // empty')

if [[ -z "${REQUEST_ID}" ]]; then
    log "${RED}✗ Failed to create request${NC}"
    log "[SMOKE] Create response: ${CREATE_RESPONSE}"
    exit 3
fi

log "${GREEN}✓ Request created with ID: ${REQUEST_ID}${NC}"

# 4. Получение списка заявок
echo "[SMOKE] Fetching requests list..."
LIST_RESPONSE=$(curl -fsS -X GET "${API_BASE}/requests" \
    -H "Authorization: Bearer ${TOK}" || echo '{"error": "Failed to fetch requests"}')

REQUEST_COUNT=$(echo "${LIST_RESPONSE}" | ./jq.exe -r '.data | length // 0')

if [[ "${REQUEST_COUNT}" -gt 0 ]]; then
    log "${GREEN}✓ Fetched ${REQUEST_COUNT} requests${NC}"
else
    log "${YELLOW}⚠ No requests found or failed to fetch${NC}"
fi

# 5. Получение конкретной заявки
if [[ -n "${REQUEST_ID}" ]]; then
    echo "[SMOKE] Fetching request ${REQUEST_ID}..."
    GET_RESPONSE=$(curl -fsS -X GET "${API_BASE}/requests/${REQUEST_ID}" \
        -H "Authorization: Bearer ${TOK}" || echo '{"error": "Failed to fetch request"}')
    
    FETCHED_ID=$(echo "${GET_RESPONSE}" | ./jq.exe -r '.data.id // .id // empty')
    
    if [[ "${FETCHED_ID}" == "${REQUEST_ID}" ]]; then
        log "${GREEN}✓ Successfully fetched request ${REQUEST_ID}${NC}"
    else
        log "${RED}✗ Failed to fetch request ${REQUEST_ID}${NC}"
        log "[SMOKE] Get response: ${GET_RESPONSE}"
    fi
fi

# 6. Проверка эндпоинта сигналов (если доступен)
echo "[SMOKE] Checking signals endpoint..."
SIGNALS_RESPONSE=$(curl -fsS -X GET "${API_BASE}/signals" \
    -H "Authorization: Bearer ${TOK}" || echo '{"error": "Signals endpoint not available"}')

if echo "${SIGNALS_RESPONSE}" | grep -q '"error"'; then
    log "${YELLOW}⚠ Signals endpoint not available (optional)${NC}"
else
    SIGNAL_COUNT=$(echo "${SIGNALS_RESPONSE}" | ./jq.exe -r '.data | length // 0')
    log "${GREEN}✓ Signals endpoint available, found ${SIGNAL_COUNT} signals${NC}"
fi

# 7. Проверка генерации отчета PDF (если доступен)
if [[ -n "${REQUEST_ID}" ]]; then
    echo "[SMOKE] Testing PDF report generation..."
    PDF_RESPONSE=$(curl -fsS -X GET "${API_BASE}/requests/${REQUEST_ID}/report" \
        -H "Authorization: Bearer ${TOK}" \
        -o "/tmp/test-report.pdf" \
        -w "%{http_code}" || echo "0")
    
    if [[ "${PDF_RESPONSE}" == "200" ]] && [[ -f "/tmp/test-report.pdf" ]]; then
        PDF_SIZE=$(stat -c%s "/tmp/test-report.pdf" 2>/dev/null || stat -f%z "/tmp/test-report.pdf" 2>/dev/null || echo "0")
        if [[ "${PDF_SIZE}" -gt 1000 ]]; then
            log "${GREEN}✓ PDF report generated (${PDF_SIZE} bytes)${NC}"
        else
            log "${YELLOW}⚠ PDF file too small or empty${NC}"
        fi
    else
        log "${YELLOW}⚠ PDF generation not available (optional)${NC}"
    fi
fi

# 8. Очистка - удаление тестовой заявки
if [[ -n "${REQUEST_ID}" ]]; then
    echo "[SMOKE] Cleaning up test request..."
    DELETE_RESPONSE=$(curl -fsS -X DELETE "${API_BASE}/requests/${REQUEST_ID}" \
        -H "Authorization: Bearer ${TOK}" \
        -w "%{http_code}" || echo "0")
    
    if [[ "${DELETE_RESPONSE}" == "200" ]] || [[ "${DELETE_RESPONSE}" == "204" ]]; then
        log "${GREEN}✓ Test request deleted${NC}"
    else
        log "${YELLOW}⚠ Could not delete test request (HTTP ${DELETE_RESPONSE})${NC}"
    fi
fi

# Итоги
echo ""
log "${GREEN}[SMOKE] =============================${NC}"
log "${GREEN}[SMOKE] Smoke tests completed${NC}"
log "${GREEN}[SMOKE] =============================${NC}"

# Проверка критических ошибок
if grep -q "✗" "${LOG_FILE}"; then
    log "${RED}[SMOKE] Some critical tests failed${NC}"
    exit 1
else
    log "${GREEN}[SMOKE] All critical tests passed${NC}"
    exit 0
fi
