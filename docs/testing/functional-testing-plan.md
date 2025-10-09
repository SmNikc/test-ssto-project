# План функционального тестирования «Тест ССТО»

## 1. Стратегия и охват
- **Цель релиза**: обеспечить цикл «заявка → тестовый сигнал → сверка → PDF → почта → журналы/права» в соответствии с ПП РФ № 746 и Приказом Минтранса № 115. Доп. требование из письма Минтранса от 29.05.2024 — использовать адрес `od_smrcc@morflot.ru` как первичный канал отправки ССТО.
- **Объект тестирования**: сервисы `backend-nest` (API, PDF, почта) и фронтенд `frontend` (React/Vite/MUI).
- **Нефункциональные ограничения**: smoke ≤ 3 мин, UI/E2E ≤ 8 мин, ретрай 1 для нестабильных UI, покрытие unit-тестов backend ≥ 60 % (Jest). CI фейлится, если проваливаются AC S1–S4/S6.
- **Подход**:
  - Автоматизация слоёв API и UI (supertest/Jest, Playwright) + bash smoke.
  - Контракты REST валидацией схемы и проверкой заголовков нормативных PDF.
  - Использование детерминированных данных из сидов/скриптов.

## 2. Критерии приёмки (AC)
| ID | Формулировка (нормативная ссылка) | Автотест |
|----|-----------------------------------|----------|
| S1 | `/health` возвращает `200` и статус `ok` (готовность сервиса) | `tests/__tests__/functional-cycle.test.js` |
| S2 | Оператор может авторизоваться (упрощённый режим, письмо Минтранса 29.05.2024) | тот же тест |
| S3 | По заявке создаётся и связывается тестовый сигнал, статус заявки обновляется (ПП 746 §18) | тот же тест |
| S4 | `POST /api/requests/{id}/send-confirmation` генерирует PDF с шапкой Минтранса/Росморречфлота (Приказ 115) | тот же тест + `pdf-parse` |
| S5 | Некорректные операции отклоняются (валидация заявок/сигналов) | `tests/__tests__/negative.test.js` |
| S6 | Письмо отправляется на `od_smrcc@morflot.ru` через MailHog (письмо Минтранса 29.05.2024) | `functional-cycle.test.js` + `MailHog` |

Полная трассировка: см. [`docs/testing/ac-traceability.md`](./ac-traceability.md).

## 3. Тестовые данные
- **Docker seed**: Postgres инициализируется штатными миграциями. Для автотестов создаётся собственный набор данных через REST (уникальные MMSI/номера).
- **Учётные записи**: dev-auth принимает любой пароль, роли определяются по email. Для тестов используется `operator@test.com`.
- **MailHog**: контейнер `ssto-mailhog`, SMTP `mailhog:1025`, пользователь `od_smrcc@morflot.ru`, пароль `dev-password` (фиктивный, MailHog принимает любую пару).
- **Детерминированность**: идентификаторы заявок и сигналов вычисляются на основе timestamp; ожидания в тестах не зависят от автоинкрементов.

## 4. Каркас автоматизации
```
 tests/
 ├── README.md                # инструкции
 ├── package.json             # зависимости (jest, supertest, pdf-parse, playwright)
 ├── jest.config.cjs          # конфиг API/контрактных тестов + JUnit
 ├── config.js                # централизованные URL/пути
 ├── smoke/smoke.sh           # bash+curl smoke (S1–S3)
 ├── __tests__/
 │   ├── functional-cycle.test.js  # S1–S4/S6 (контракт+интеграция)
 │   └── negative.test.js          # негативные сценарии
 ├── lib/
 │   └── mailhog.js                # утилиты работы с MailHog
 ├── e2e/
 │   └── full-cycle.spec.ts        # Playwright UI
 └── playwright.config.ts          # конфиг UI (JUnit, retry=1)
```

## 5. Smoke-тестирование
- Скрипт `tests/smoke/smoke.sh` выполняет:
  1. `/health` → 200 (S1).
  2. `/auth/login` → accessToken (S2).
  3. `/requests` создание заявки и проверка ответа (S3 light).
- Логи выводятся в `tests/artifacts/smoke.log`; при ошибке скрипт завершает работу с ненулевым кодом.

## 6. Негативные сценарии
- Попытка создать заявку без обязательных полей → `400` с сообщением.
- Линковка сигнала к несуществующей заявке → `400` (контроль качества данных).
- Отправка подтверждения по несуществующей заявке → `404`.

## 7. Контрактные/интеграционные тесты
- `functional-cycle.test.js` формирует полный happy-path:
  - Авторизация оператора → Bearer токен.
  - Создание и одобрение заявки.
  - Создание тестового сигнала (auto-link) + принудительная линковка.
  - Запуск отправки подтверждения и копирование PDF через `docker cp`.
  - Парсинг PDF (`pdf-parse`) и проверка реквизитов Минтранса/Росморречфлота.
  - Ожидание письма в MailHog (REST API `/api/v2/messages`).
- Результаты: `tests/artifacts/confirmation-*.pdf`, `mailhog-summary.json`, `functional-cycle.log`.

## 8. UI / E2E (Playwright)
- `tests/e2e/full-cycle.spec.ts`:
  - Переход на `/login` → ввод `operator@test.com`.
  - Проверка редиректа на `/operator` и наличия заголовка «Панель оператора ССТО».
  - Переход к списку заявок (кнопка «Открыть заявки») и проверка таблицы.
- Конфигурация: headless, retry = 1, JUnit отчёт `tests/artifacts/playwright-results.xml`, скриншоты/трейсы — артефакты при падении.

## 9. CI (GitHub Actions)
Workflow `.github/workflows/auto-unify.yml` (см. репозиторий):
1. Вводные параметры: `base_branch` (по умолчанию `main`), `run_e2e` (bool).
2. Шаги:
   - Checkout репо.
   - Настройка Node 20 + Docker Buildx.
   - `npm ci` в `backend-nest` + запуск `npm run test:ci` (coverage ≥ 60 %).
   - `npm ci` в `frontend` (для сборки статик).
   - `npm ci` в `tests` + установка Playwright (`npx playwright install --with-deps`).
   - `docker compose up -d --build`.
   - Ожидание health чеков backend/frontend/MailHog.
   - `npm run smoke --prefix tests`.
   - `npm test --prefix tests` (контрактные/негативные).
   - Если `run_e2e=true` → `npm run e2e --prefix tests`.
   - Сбор артефактов: `tests/artifacts/**/*`, `backend-nest/reports/**/*`, docker-compose логи.
3. Workflow завершает сборку со статусом failure при невыполнении любого AC из тестов.

## Дополнительные отчёты и контроль
- Формат отчётности:
  - Backend unit: JUnit `backend-nest/reports/junit/backend-tests.xml`, coverage `backend-nest/reports/coverage/lcov-report` + `lcov.info`.
  - Functional/negative: `tests/reports/junit/functional-tests.xml` (см. `jest.config.cjs`).
  - Playwright: `tests/artifacts/playwright-results.xml`, trace/screenshot каталоги.
- Coverage пороги: backend ≥ 60 %. Для функциональных тестов покрытие не агрегируется (HTTP black-box).
- Журнал изменений тестовой документации: текущий файл + [`docs/testing/ac-traceability.md`](./ac-traceability.md).

## Предпосылки и зависимости
- Docker ≥ 24, docker compose plugin.
- Node ≥ 20 (локально и на CI).
- Порт `80`, `3001`, `5432`, `1025`, `8025` свободны.

## Запуск локально
1. `docker compose up -d --build`.
2. `npm ci --prefix backend-nest && npm run test:ci --prefix backend-nest` (optional локальный запуск unit).
3. `npm ci --prefix tests`.
4. `npm run smoke --prefix tests`.
5. `npm test --prefix tests`.
6. `npm run e2e --prefix tests` (при необходимости UI).

В случае отсутствия нужных артефактов (например, сидов с `TST-0001`) тесты создают собственные сущности и логируют дефициты.
