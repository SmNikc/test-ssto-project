# Тестовые данные

| Артефакт | Назначение | Комментарии |
|----------|------------|-------------|
| `backend-nest/.env.test` | Конфигурация для автотестов (Postgres, SMTP, MailHog) | Создаётся из `.env.example`, заменяет пароли на тестовые, `DATABASE_URL` указывает на pg-embed/CI Postgres |
| `tests/fixtures/request-tst-0001.json` | Базовая заявка (M/V TESTER, MMSI 273123456, IMO 9876543) | Совпадает с демо-данными `insert-demo-data.js`; используется в smoke/contract тестах |
| `tests/fixtures/signal-test.json` | Тестовый сигнал `TEST` с координатами, временем UTC | Имитация тестового сигнала согласно Приказу № 115 (UTC, MMSI, координаты) |
| `tests/fixtures/signal-sos.json` | Негатив: сигнал `SOS` → проверка блокировки и уведомлений | Триггерит сценарий S4/S6 в E2E |
| `tests/fixtures/mailhog-message.json` | Ожидаемая структура письма MailHog | Проверяется `to` содержит `od_smrcc@morflot.ru` |

## Значения переменных окружения

| Переменная | Значение по умолчанию | Где используется |
|------------|----------------------|------------------|
| `DATABASE_URL` | `postgres://postgres:postgres@127.0.0.1:5433/ssto_test` | Контрактные тесты, smoke |
| `PG_EMBED_CACHE` | `./.pg-embed` | Кэш бинарей pg-embed |
| `SMTP_HOST` | `localhost` | Docker Compose MailHog |
| `SMTP_PORT` | `1025` | Smoke/contract |
| `SMTP_USER` | `test-ssto@localhost` | EmailService |
| `SMTP_PASS` | `secret` | EmailService |
| `MAILHOG_URL` | `http://localhost:8025` | smoke.sh, Playwright |
| `PLAYWRIGHT_BASE_URL` | `http://localhost:5173` | E2E |
| `ENABLE_DB_TESTS` | `false` | Установите `true` для запуска контрактных тестов (требуется Postgres/pg-embed) |

## Начальные данные БД

- Миграции создают таблицы `requests`, `signals`, `confirmation_documents`, `ssas_terminals` и триггеры `next_request_number`, `next_signal_number`.
- `insert-demo-data.js` добавляет:
  - пользователя `operator` (роль operator) и `client` (роль client);
  - заявку `TST-0001` со статусом `approved` на дату текущего месяца;
  - сигнал `TEST` для сверки.
- Для воспроизводимости в тестах `RequestNumber` и `SignalNumber` генерируются на основе года (формат `REQ-YYYY-XXXX`).

## Недостающие данные

На момент подготовки пакета отсутствуют:
- Перечень реальных SMTP-учётных записей (используем MailHog).
- Тестовые сертификаты/подписи для PDF (пока проверяем текстовую шапку).
- Логины Keycloak (при необходимости интеграции)

Эти артефакты необходимо предоставить или согласовать мокирование перед запуском тестов в продуктивном стенде.
