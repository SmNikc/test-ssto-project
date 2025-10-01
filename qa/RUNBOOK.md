# Runbook: запуск тестового пакета

## 1. Локальная подготовка

```bash
# 1. зависимости
npm install              # корень, для Playwright и вспомогательных утилит
npm install --prefix backend-nest
npm install --prefix frontend
# офлайн-кейсы: подготовьте бинарь sqlite3 (npm install sqlite3 --prefix backend-nest)

# 2. загрузка браузеров для Playwright
npx playwright install --with-deps

# 3. поднять инфраструктуру
cp backend-nest/.env.example backend-nest/.env   # при необходимости скорректировать SMTP/DB
docker compose up -d postgres backend frontend mailhog
```

## 2. Запуск тестов по уровням

| Команда | Назначение | Выходные артефакты |
|---------|------------|--------------------|
| `npm run test:backend:unit` | Юнит-тесты DTO/сервисов, покрытие ≥60% | `backend-nest/coverage/*`, JUnit (через Jest) |
| `npm run test:backend:integration` | Контракты `/requests` + `/signals`, sqlite in-memory | отчёты Jest, временные файлы в `uploads/reports` |
| `npm run test:smoke` | Сквозной сценарий S1–S5: health → login → заявка → сигнал → PDF → MailHog | `/tmp/confirmation.pdf`, `tests/mailhog-snapshot.json` |
| `npm run test:e2e` | UI/E2E (Playwright) | `tests/artifacts/playwright-report`, `playwright-report.zip` |
| `npm run test:coverage` | Полный прогон backend с отчетом покрытия | `backend-nest/coverage` |

**Важно.** Для smoke и E2E серверы должны быть доступны: API на `http://localhost:3001`, фронтенд на `http://localhost` (порт 80 в docker-compose).

## 3. CI/CD (GitHub Actions)

Workflow `.github/workflows/qa-validation.yml` выполняет этапы:

1. Checkout и настройка Node 20.
2. Установка зависимостей (`npm install`, `npm install --prefix backend-nest`).
3. Установка браузеров Playwright.
4. Запуск Docker Compose (postgres + backend + frontend + mailhog).
5. **Gates:**
   - `npm run test:backend:unit`
   - `npm run test:backend:integration`
   - `npm run test:smoke:ci`
   - `npm run test:e2e`
6. Сбор артефактов: `backend-nest/coverage`, `tests/mailhog-snapshot.json`, `tests/artifacts/playwright-report`.

Если любой gate падает либо покрытие < 60%, workflow отмечается как failed.

## 4. Уборка

```bash
docker compose down
docker volume rm ssto-net || true
rm -rf backend-nest/coverage tests/mailhog-snapshot.json tests/artifacts
```

## 5. Триггеры ручного расследования

- Smoke упал на шаге MailHog → проверить, что backend реально отправляет письмо на `od_smrcc@morflot.ru`.
- Интеграционный тест не может создать PDF → проверить права на `backend-nest/uploads/reports`.
- Playwright не логинит → убедиться, что dev-auth режим включён и API `POST /api/auth/login` доступен.

