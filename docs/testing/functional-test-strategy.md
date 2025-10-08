# Функциональная стратегия тестирования модуля «Тест ССТО»

_Обновлено: $(date +%Y-%m-%d)_

## 1. Стратегия и нормативная база

Функциональное тестирование обеспечивает контроль полного цикла «заявка → тестовый сигнал → сверка → PDF → уведомление → журналы» в соответствии с:

* Постановлением Правительства РФ № 746 от 26.05.2018 — организационные обязанности ФГБУ «Морская спасательная служба» и ГМСКЦ.
* Приказом Минтранса № 115 от 23.03.2021 — порядок обработки сигналов ССТО и требования к фиксации координат/UTC.
* Письмом Минтранса от 29.05.2024 — годовой цикл тестирования и обязательный адрес доставки подтверждений `od_smrcc@morflot.ru`.

Проверки автоматизированы в четыре слоя:

1. **Smoke** — bash + `curl` подтверждают доступность API и журналирования без подключения к внешним сервисам (AC S1).
2. **Negative & business unit** — Jest + in-memory репозиторий проверяют валидацию MMSI/статусов и переходы (AC S2, S3).
3. **Контрактные / интеграционные** — Supertest валидирует структуру REST-ответов и обработку ошибок (AC S1, S2).
4. **UI/E2E** — Playwright подтверждает сценарий оператора (AC S4) с маршрутом `/login → /operator` и моками API.
5. **PDF** — Node + побайтовая проверка PDF проверяют обязательную шапку Минтранса/Росморречфлота и поля подтверждения (AC S5).

## 2. Критерии приёмки и трассировка

| AC | Формулировка | Нормативное основание | Тесты |
| --- | --- | --- | --- |
| S1 | API `/health` возвращает статус «ok», `/requests` доступен без 500 | ПП РФ № 746, п. 7 | Smoke `tests/smoke/api-health.sh`; Contract `health.contract.spec.ts` |
| S2 | Создание заявки требует валидного MMSI и фиксирует статус `pending` | Приказ № 115, п. 24; письмо 29.05.2024 (валидация данных) | `request-service.spec.ts` («ошибка без MMSI», «нормализация статуса»); `requests.contract.spec.ts` (успешный/ошибочный ответ) |
| S3 | Нелегальные переходы статусов блокируются | Приказ № 115, п. 31 | `request-service.spec.ts` («запрет перехода pending → COMPLETED») |
| S4 | Оператор может пройти сценарий входа и попасть на панель управления | ПП РФ № 746, п. 13; письмо 29.05.2024 (операторский доступ) | Playwright `operator-login.spec.ts` |
| S5 | PDF подтверждение содержит реквизиты Минтранса/ГМСКЦ, MMSI, тип сигнала | Приказ № 115, п. 34; письмо 29.05.2024 | `report.service.pdf.spec.ts` |
| S6 | Smoke-файл фиксирует факт опроса и журналы на момент запуска | ПП РФ № 746, п. 16 | `tests/smoke/api-health.sh` (выгрузка JSON в `tests/artifacts`) |

Полная таблица трассировки доступна в `docs/testing/ac-traceability.csv`.

## 3. Тестовые данные

* БД тестов использует отдельную in-memory репозиторий моделей (unit/negative) и Postgres из Docker Compose (smoke/E2E).
* Фикстуры заявок/сигналов: `tests/functional/fixtures/request-fixture.json` содержит MMSI `273123456`, IMO `9123456`, плановую дату теста и контактные данные, совпадающие с демо-данными сидера.
* Для PDF-тестов используются минимальные объекты заявки/сигнала с обязательными полями (`request.id`, `signal.mmsi`, `signal.received_at`).

## 4. Каркас и инструменты

| Слой | Технологии | Особенности |
| --- | --- | --- |
| Smoke | Bash, `curl`, `jq` | переменные `API_BASE`, `MAILHOG_BASE`; ожидание готовности через `tests/smoke/wait-for.sh` |
| Unit/Negative | RequestService с in-memory репозиторием (без внешних БД) | `InMemoryRequestModel` в тесте эмулирует базу и повторяет бизнес-правила без зависимостей от Postgres |
| Contract | Supertest (`RequestsController`, `HealthController`) | моки сервисов фиксируют структуру ответов и сообщения об ошибках |
| PDF | Node.js, побайтовый анализ PDF (поиск ключевых фраз) | Читает итоговый файл, проверяет ключевые фразы и очищает ресурс |
| UI/E2E | Playwright | Использует `PLAYWRIGHT_BASE_URL`, моки `/api/auth/login`, проверяет редирект на `/operator` |

## 5. Smoke-сценарии

* `tests/smoke/api-health.sh`:
  1. Ожидает готовность `/health` (S1).
  2. Проверяет успешный ответ `/requests` (S2, доступность каталога заявок).
  3. Сохраняет журнал ответа в `tests/artifacts/requests.json` для аудита (S6).
* Скрипт совместим с локальным запуском (`docker compose up backend frontend postgres`).

## 6. Негативные и бизнес-тесты

* `request-service.spec.ts` — проверяет: отсутствие MMSI → `BadRequestException`; нормализацию статуса в `pending`; блокировку перехода в `COMPLETED` без утверждения (Приказ № 115).
* Тесты используют `RequestService` с in-memory репозиторием, повторяя бизнес-правила без подключения к СУБД.

## 7. Контрактные и интеграционные проверки

* `health.contract.spec.ts` — подтверждает контракт `/health` (структура `{ status: 'ok' }`).
* `requests.contract.spec.ts` — два сценария: успешное создание заявки (возвращает `request_number`, `mmsi`) и обработка `BadRequestException` (HTTP 400, сообщение).
* Контроллер тестируется через HTTP-слой NestJS + Supertest, что фиксирует формат ответов и заголовки.

## 8. UI / E2E

* `tests/e2e/operator-login.spec.ts` — сценарий оператора: ввод учётных данных, мок API `/api/auth/login`, переход на `/operator` и проверка заголовка «Панель оператора ССТО».
* Конфигурация Playwright: `tests/e2e/playwright.config.ts` (трассировки, HTML-отчёт, `baseURL`).
* Перед запуском требуется опубликованный фронтенд (`docker compose up frontend`).

## 9. CI/CD

* Workflow `.github/workflows/functional-tests.yml` выполняет:
  1. Установку зависимостей (root + backend).
  2. Сборку и запуск Docker Compose (`postgres`, `backend`, `frontend`).
  3. Ожидание готовности `/health`.
  4. `npm run test:smoke`, `test:contracts`, `test:negative`, `test:pdf`.
  5. Playwright E2E (`npm run test:e2e`).
  6. Грейсфул `docker compose down -v`.
* Отчётность: Jest → JUnit (по умолчанию в stdout, подготовлено к интеграции через `--reporters`); Playwright → HTML (`playwright-report`).
* Порог покрытия unit-слоя: `jest --coverage` (≥60 % statements). Команда `npm run test:negative -- --coverage` доступна локально.

## 10. Запуск локально

```bash
# 1. Подготовить окружение
cp backend-nest/.env.example backend-nest/.env
npm install && npm --prefix backend-nest install

# 2. Поднять инфраструктуру
docker compose up -d postgres backend frontend
./tests/smoke/wait-for.sh http://localhost:3001/health 120

# 3. Запустить проверки
npm run test:smoke
npm run test:functional
PLAYWRIGHT_BASE_URL=http://localhost npm run test:e2e
```

## 11. Журнал изменений (QA)

| Дата | Изменение |
| --- | --- |
| 2024-10-05 | Первичная версия стратегии, трассировки и автоматизированных тестов (smoke, unit, контрактные, PDF, E2E). |

