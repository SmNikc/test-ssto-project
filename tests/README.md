# Автотесты функционального цикла «Тест ССТО»

## Команды
- `npm ci` — установка зависимостей.
- `npm run smoke` — bash smoke (`tests/smoke/smoke.sh`).
- `npm test` — Jest (контрактные и негативные сценарии, отчёт JUnit в `tests/reports/junit`).
- `npm run e2e` — Playwright UI (`tests/e2e/full-cycle.spec.ts`).

Для выполнения команд из корня репозитория используйте флаг `--prefix tests`, например `npm run smoke --prefix tests`.

## Переменные окружения
| Имя | Назначение | Значение по умолчанию |
|-----|------------|------------------------|
| `TEST_SSTO_BASE_URL` | Базовый URL API | `http://localhost:3001` |
| `TEST_SSTO_WEB_URL` | URL фронтенда | `http://localhost` |
| `TEST_SSTO_MAILHOG_URL` | MailHog API | `http://localhost:8025` |
| `TEST_SSTO_ARTIFACTS_DIR` | Каталог артефактов | `tests/artifacts` |

## Артефакты
- Smoke лог: `tests/artifacts/smoke.log`.
- Контрактные тесты: `tests/artifacts/functional-cycle.log`, `confirmation-*.pdf`, `pdf-metadata.json`, `mailhog-summary.json`.
- Playwright: `tests/artifacts/playwright-results.xml`, `tests/artifacts/playwright-output/*`, `playwright-report`.

## Предусловия
1. `docker compose up -d --build` — развёртывание Postgres, backend, frontend, MailHog.
2. Открыты порты `3001`, `80`, `1025`, `8025`.
3. Node.js ≥ 20 (для запуска Jest/Playwright).

## Отладка
- Проверка контейнеров: `docker compose ps`.
- Логи backend: `docker logs ssto-backend`.
- MailHog UI: http://localhost:8025.

## Ограничения
Если сиды с заявкой `TST-0001` отсутствуют, сценарии создают собственные сущности и фиксируют это в `functional-cycle.log`.
