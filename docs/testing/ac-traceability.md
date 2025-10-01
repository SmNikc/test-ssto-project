# Трассировка AC → тесты

| AC | Краткое описание | Связанные тесты | Покрытые файлы/модули |
|----|-------------------|-----------------|------------------------|
| **S1** | Health API сообщает статус приложения и подключения к БД | `tests/smoke.sh`, `backend-nest/test/contract/health.contract.spec.ts` | `backend-nest/src/controllers/health.controller.ts`, `backend-nest/src/app.module.ts`
| **S2** | Ролевая модель operator/client, отказ в доступе логируется | `backend-nest/test/unit/auth.guard.spec.ts`, `tests/e2e/full-cycle.spec.ts` | `backend-nest/src/security/auth.guard.ts`, `frontend/src/pages/LoginPage.tsx`
| **S3** | Заявка проверяется на MMSI=9, IMO=7, обязательные контакты | `backend-nest/test/unit/request.dto.spec.ts`, `backend-nest/test/contract/requests.contract.spec.ts` | `backend-nest/src/dto/request.dto.ts`, `backend-nest/src/controllers/requests.controller.ts`
| **S4** | Тестовый сигнал совпадает с заявкой, PDF содержит шапку Минтранс/Росморречфлот | `backend-nest/test/contract/signals.contract.spec.ts`, `tests/smoke.sh`, `tests/assert-pdf.js` | `backend-nest/src/signal/signal.controller.ts`, `backend-nest/src/services/report.service.ts`
| **S5** | Письма обязательного дистрибутива включают `od_smrcc@morflot.ru` | `backend-nest/test/unit/recipient.policy.spec.ts`, `tests/e2e/full-cycle.spec.ts` | `backend-nest/src/email/recipient.policy.ts`, `backend-nest/src/services/email.service.ts`
| **S6** | 12‑месячный цикл + напоминания T-30/T-0, блокировка просрочки | `backend-nest/test/unit/request-cycle.spec.ts`, `tests/e2e/full-cycle.spec.ts` | `backend-nest/src/services/request-processing.service.ts`, `frontend/src/features/requests/RequestList.tsx`

Дополнительно:
- Матрица модуль × тип теста — см. `docs/testing/functional-testing.md`.
- Вспомогательные данные и фикстуры — `docs/testing/test-data.md`.
