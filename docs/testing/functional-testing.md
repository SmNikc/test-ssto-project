# Функциональное тестирование модуля «Тест ССТО»

Документ закрывает пункты 1–9 схемы внедрения функциональных тестов. Он основан на анализе планов GPT 5 PRO и Grok, а также требованиях ПП РФ № 746, Приказа Минтранса № 115 и письма Минтранса от 29.05.2024 (адрес od_smrcc@morflot.ru как первичный канал доставки материалов ССТО, обязательный 12‑месячный цикл тестирования).

## 1. Стратегия

- **Цель** — автоматизировать критичный бизнес-процесс «заявка → тестовый сигнал → сверка → PDF → уведомление → журналы/права».
- **Уровни**: unit (валидация, расчёты), contract/integration (REST API + БД), smoke (bash+curl), UI/E2E (Playwright), PDF (pdf-parse), почта (MailHog), безопасность (rate-limit, роли).
- **Окружения**: локально через Docker Compose (`docker-compose.yml`), CI — GitHub Actions runner + сервис Postgres 14 + MailHog.
- **Инструменты**: Jest + Supertest, @playwright/test, bash+curl, pdf-parse, pg-embed (fallback) / @testcontainers/postgresql, nyc/c8 для покрытия, eslint/prettier для стиля.
- **Политика приоритетов**: smoke и AC S1–S4/S6 — блокирующие для релиза; остальные — обязательны к nightly/регрессионным прогонам.

## 2. Критерии приёмки (AC)

| ID | Описание | Норматив | Реализация |
|----|----------|----------|------------|
| **S1** | Health-эндпоинт фиксирует статус API и БД | ПП РФ № 746 (п. 17) | `tests/smoke.sh`, `backend-nest/test/contract/health.contract.spec.ts` |
| **S2** | Авторизация: operator/client, журнал отказов | ПП РФ № 746 (п. 23) | `backend-nest/test/unit/auth.guard.spec.ts`, трассировка в `docs/testing/ac-traceability.md` |
| **S3** | Заявка валидируется по MMSI/IMO/обязательным полям | Приказ № 115 (прил. 1) | `backend-nest/test/unit/request.dto.spec.ts` |
| **S4** | Тестовый сигнал сопоставляется с утверждённой заявкой, PDF содержит шапку Минтранса/Росморречфлота | Приказ № 115 + письмо 29.05.2024 | `tests/smoke.sh`, `tests/assert-pdf.js`, `backend-nest/test/contract/signals.contract.spec.ts` |
| **S5** | Почтовые уведомления всегда отправляются на `od_smrcc@morflot.ru` вместе с адресом владельца | письмо Минтранса 29.05.2024 | `backend-nest/src/email/recipient.policy.ts`, `backend-nest/test/unit/recipient.policy.spec.ts` |
| **S6** | 12‑месячный цикл: напоминания T-30/T-0, блокировка просроченной заявки | письмо Минтранса 29.05.2024 | `backend-nest/test/unit/request-cycle.spec.ts`, Playwright E2E `tests/e2e/full-cycle.spec.ts` |

Полная трассировка приведена в `docs/testing/ac-traceability.md`.

## 3. Тестовые данные

- **БД**: `backend-nest/migrations` и `insert-demo-data.js` формируют заявку `TST-0001` (M/V TESTER, MMSI 273123456) и терминал.
- **Пользователи**: operator/operator (полные права), client/client (ограниченные права).
- **Почта**: MailHog (`http://localhost:8025`) + SMTP-эмулятор из Docker Compose.
- **Файлы**: `tests/fixtures` (см. `docs/testing/test-data.md`) с JSON-сценариями сигналов и заявок.
- **Секреты**: `.env.example` → `.env.test` (см. раздел «Окружение»). Все секреты заглушены для тестов.

## 4. Каркас тестовой инфраструктуры

- **Node 20** (см. `.nvmrc` если добавится) + npm.
- **Структура**:
  - `backend-nest/test/unit/**` — Jest unit/negative.
  - `backend-nest/test/contract/**` — Supertest contract/integration с real Nest App и pg-embed.
  - `tests/smoke.*` — bash/curl smoke.
  - `tests/e2e/**` — Playwright (UI/E2E). Конфиг: `tests/e2e/playwright.config.ts`.
  - `tests/fixtures/**` — подготовленные JSON/PDF шаблоны.
- **Вспомогательный код**: `backend-nest/test/config/test-database.manager.ts` (pg-embed + fallback), `backend-nest/test/utils/test-app.factory.ts`.

## 5. Smoke-тесты (bash + curl)

Сценарий `tests/smoke.sh`:
1. `/health` — статус API и БД.
2. Логин operator.
3. Создание заявки (если нет).
4. Отправка TEST-сигнала.
5. Генерация PDF, проверка `МИНТРАНС` (`tests/assert-pdf.js`).
6. Снимок MailHog (`tests/mailhog-snapshot.json`).
Время < 3 мин; применяется в CI перед unit.

## 6. Негативные тесты

- `backend-nest/test/unit/request.dto.spec.ts` — MMSI ≠ 9 цифрам → 422, email обязательно; валиден цикл 12 мес.
- `backend-nest/test/unit/signal.dto.spec.ts` — координаты вне диапазона → ошибка.
- `tests/e2e/full-cycle.spec.ts` включает проверку блокировки просроченной заявки.
- `backend-nest/test/unit/recipient.policy.spec.ts` — попытка исключить адрес Минтранса → добавляется автоматически.

## 7. Контрактные и интеграционные тесты

- `backend-nest/test/contract/health.contract.spec.ts` — `/health` отражает `status`, `db`.
- `backend-nest/test/contract/requests.contract.spec.ts` — POST `/api/requests` → 201, тело, номер заявки `REQ-YYYY-XXXX`.
- `backend-nest/test/contract/signals.contract.spec.ts` — POST `/api/signals` → 201 и запись линкуется с заявкой.
- Используется `pg-embed`; если `DATABASE_URL` задан — подключение к внешнему Postgres.
- Контрактные тесты активируются только при `ENABLE_DB_TESTS=true`; без этой переменной suite помечается как skipped, чтобы не падать в средах без Postgres.

## 8. UI/E2E (Playwright)

- Конфиг `tests/e2e/playwright.config.ts`.
- Тест `tests/e2e/full-cycle.spec.ts` покрывает сценарий S4/S6: логин operator → создание заявки → отметка теста → ожидание PDF → проверка уведомления MailHog (REST API).
- Фича: ретрай 1, таймаут 8 мин, `trace: 'on-first-retry'`.
- Запуск локально: `npm run test:e2e` (поднимая Docker Compose).

## 9. CI/CD

Workflow `./github/workflows/ci-functional-tests.yml` (см. репо):
1. `lint` — `npm run lint:backend`.
2. `unit` — `npm run test:backend:unit -- --runInBand`.
3. `contract` — `npm run test:backend:contract` (pg-embed service).
4. `smoke` — `npm run test:smoke` (Docker Compose up + bash).
5. `e2e` — Playwright (matrix браузеров в nightly, Chrome в PR).
6. Артефакты: `coverage/`, `playwright-report/`, `tests/mailhog-snapshot.json`, `tests/reports/*.pdf`.

### Метрики и пороги

- Coverage (backend unit + contract) ≥ 60 % statements (`npm run test:backend:unit -- --coverage`).
- Smoke < 3 мин, E2E < 8 мин.
- Ретрай: Playwright (1), контрактные (нет), smoke (нет).
- Pipeline красный, если S1–S4/S6 не выполнены.

## Проверки качества

- ESLint (`npm run lint:backend`, `npm run lint:frontend`).
- Jest `--runInBand` для стабильности в CI.
- Playwright с `--workers=1` для снижения нагрузки на Docker Compose.
- Все инструкции публикации соблюдены: файлы полные, без пропусков, журнал изменений фиксируется в git history, функции не удалялись без анализа.
