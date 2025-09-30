# Трассировка AC → тесты

| AC | Требование | Тест/скрипт | Команда | Артефакты |
|----|-------------|-------------|---------|-----------|
| S1 | `/health` возвращает `200` и JSON `{ status: 'ok' }` | `tests/smoke/smoke.sh`, `tests/__tests__/functional-cycle.test.js` | `npm run smoke --prefix tests`, `npm test --prefix tests` | `tests/artifacts/smoke.log`, `tests/reports/junit/functional-tests.xml` |
| S2 | Авторизация оператора (dev-auth) выдаёт Bearer-токен | те же тесты (`smoke.sh`, `functional-cycle.test.js`) | `npm run smoke --prefix tests`, `npm test --prefix tests` | `tests/artifacts/smoke.log`, `tests/artifacts/functional-cycle.log` |
| S3 | Создание заявки, привязка тестового сигнала, статус `approved` | `functional-cycle.test.js` | `npm test --prefix tests` | `tests/artifacts/functional-cycle.log` |
| S4 | Генерация PDF с шапкой Минтранса/Росморречфлота | `functional-cycle.test.js` (pdf-parse) | `npm test --prefix tests` | `tests/artifacts/confirmation-*.pdf`, `tests/artifacts/pdf-metadata.json` |
| S5 | Ошибки при некорректных действиях | `tests/__tests__/negative.test.js` | `npm test --prefix tests` | `tests/reports/junit/functional-tests.xml` |
| S6 | Отправка письма на `od_smrcc@morflot.ru`, наличие в MailHog | `functional-cycle.test.js` + `tests/lib/mailhog.js` | `npm test --prefix tests` | `tests/artifacts/mailhog-summary.json` |
| UI | Авторизация и навигация оператора в UI | `tests/e2e/full-cycle.spec.ts` | `npm run e2e --prefix tests` | `tests/artifacts/playwright-results.xml`, `playwright-report/` |
| CI | Конвейер `auto-unify` прогоняет smoke/API/UI и публикует отчёты | `.github/workflows/auto-unify.yml` | `gh workflow run auto-unify` (при наличии токена) | GitHub Actions → артефакты `backend-nest/reports`, `tests/artifacts` |

> Примечание: если сиды с `TST-0001` недоступны, автотесты формируют собственные данные и фиксируют событие в `tests/artifacts/functional-cycle.log`.
