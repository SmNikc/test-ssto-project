--- FILE: .github/PULL_REQUEST_TEMPLATE.md
# Unify structure + fix build + CI for «Тест ССТО»

## Что сделано
- /api через Vite (dev) и nginx (Docker)
- MailHog в docker-compose.override.yml
- Smoke-скрипты + проверка PDF «шапки»
- CI: сборка, Docker-стек, smoke, артефакты

## Логи/артефакты
- `tests/smoke.log`
- `/tmp/report.pdf`
- `tests/mailhog-snapshot.json`

## Чек‑лист AC
- [ ] S1: TEST+заявка → PDF+письмо (MailHog)
- [ ] S2: TEST без заявки → fallback PDF
- [ ] S3: ALERT → PDF+письмо
- [ ] S4: CANCEL → закрытие/письмо
- [ ] S6: client /api/logs → 403

## Дальше
- Полные E2E (supertest/Playwright), Allure
