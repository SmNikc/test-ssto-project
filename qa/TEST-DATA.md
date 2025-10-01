# Тестовые данные

## 1. Исходные данные из сидов

| Сущность | Поля | Источник |
|----------|------|----------|
| Заявка `TST-0001` | `mmsi=273123456`, `vessel_name="M/V TESTER"`, `owner_email=owner@example.com` | `backend-nest/scripts/insert-demo-data.js` |
| Учетные записи | `operator@test.com`, `client@test.com`, `admin@test.com` с упрощённым логином | `backend-nest/test-data-demo.js` |
| MailHog | SMTP хост `localhost:1025`, UI `http://localhost:8025` | `docker-compose.yml` |

## 2. Данные для автотестов

### Unit tests
- `CreateRequestDto` — базовый валидный DTO:
  ```json
  {
    "mmsi": "273123456",
    "vessel_name": "M/V TESTER",
    "owner_organization": "ФГБУ \"Морспасслужба\"",
    "contact_person": "Иванов И.И.",
    "email": "owner@example.com",
    "phone": "+7 (495) 123-45-67",
    "test_date": "2025-10-01",
    "start_time": "10:00",
    "end_time": "11:00"
  }
  ```
- Негативные случаи: MMSI длиной < 9, неверный email, время `25:00`.
- `RequestService` — таблица в памяти (мок), статусы `DRAFT`, `SUBMITTED`, `APPROVED`.

### Integration tests
- Используется SQLite (`storage=':memory:'`), модели `SSASRequest`, `Signal`, `Vessel`.
- Запрос создания:
  ```json
  {
    "vessel_name": "M/V TESTER",
    "mmsi": "273123456",
    "owner_organization": "ФГБУ \"Морспасслужба\"",
    "contact_person": "Иванов И.И.",
    "contact_phone": "+7 (495) 123-45-67",
    "contact_email": "owner@example.com",
    "planned_test_date": "2025-10-01T08:00:00Z"
  }
  ```
- Сигнал: `{ "signal_type": "TEST", "terminal_number": "TST-9001", "mmsi": "273123456", "is_test": true }`.

### Smoke
- Параметры окружения по умолчанию: `API_BASE=http://localhost:3001/api`, `MAILHOG=http://localhost:8025`, `SMOKE_PRIMARY_EMAIL=od_smrcc@morflot.ru`.
- Формируемая заявка: `terminal_number=TST-9001`, `planned_test_date=2025-10-01T08:00:00Z`.
- PDF сохраняется в `/tmp/confirmation.pdf` (удаляется по завершении).

### E2E/UI
- BaseURL: `E2E_BASE_URL=http://localhost` (доступен фронтенд из Docker).
- Данные входа: `operator@test.com` / `operator` (по умолчанию). Можно переопределить через `E2E_OPERATOR_LOGIN`, `E2E_OPERATOR_PASSWORD`.

## 3. Недостающие данные / допущения

- Нет фикстур для реального письма на `od_smrcc@morflot.ru` — используется MailHog snapshot. При отсутствии письма smoke упадёт.
- Не загружены браузеры Playwright — требуется запуск `npx playwright install --with-deps` перед CI.
- Не реализованы тестовые данные для SOS/PIRACY сигналов и напоминаний T-30/T-0 (запланировано в backlog).

