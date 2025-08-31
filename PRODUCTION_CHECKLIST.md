
# ЧЕКЛИСТ PRODUCTION ОБНОВЛЕНИЙ
=====================================

## 📁 Обновление файлов сервисов:

### 1. backend-nest/src/request/request.service.ts
- [ ] Добавить импорты: Sequelize, Transaction, Op
- [ ] Добавить enum RequestStatus
- [ ] Добавить матрицу STATUS_TRANSITIONS
- [ ] Добавить Sequelize в constructor
- [ ] Добавить метод transitionStatus()
- [ ] Добавить метод getAvailableTransitions()
- [ ] Обновить метод create() - добавить валидацию

### 2. backend-nest/src/signal/signal.service.ts
- [ ] Добавить enum SignalType
- [ ] Добавить enum SignalStatus
- [ ] Добавить метод processEmailSignal()
- [ ] Добавить метод parseEmailContent()
- [ ] Добавить метод matchSignalToRequest()

### 3. backend-nest/src/controllers/request.controller.ts
- [ ] Импортировать RequestStatus из сервиса
- [ ] Добавить POST /:id/submit
- [ ] Добавить POST /:id/approve
- [ ] Добавить POST /:id/reject
- [ ] Добавить POST /:id/cancel
- [ ] Добавить POST /:id/start-testing
- [ ] Добавить POST /:id/complete
- [ ] Добавить GET /:id/available-transitions

### 4. backend-nest/src/models/request.ts
- [ ] Добавить поле status (ENUM)
- [ ] Добавить поле status_updated_at (DATE)
- [ ] Добавить поле rejection_reason (TEXT)
- [ ] Добавить поле phone (STRING)

### 5. backend-nest/src/models/signal.model.ts
- [ ] Добавить поле status (ENUM)
- [ ] Добавить поле latitude (DECIMAL)
- [ ] Добавить поле longitude (DECIMAL)
- [ ] Добавить поле vessel_name (STRING)
- [ ] Добавить поле error_message (TEXT)

### 6. backend-nest/src/main.ts
- [ ] Импортировать ValidationPipe
- [ ] Добавить app.useGlobalPipes(new ValidationPipe())
- [ ] Добавить helmet
- [ ] Добавить compression
- [ ] Добавить rate limiting
- [ ] Добавить global exception filter

## ✅ Новые файлы (созданы автоматически):
- [x] src/dto/request.dto.ts
- [x] src/filters/all-exceptions.filter.ts

## 🧪 Тестирование:
- [ ] npm run build - компиляция успешна
- [ ] npm run test - тесты проходят
- [ ] npm run start:dev - приложение запускается
- [ ] Проверить GET /api/health
- [ ] Проверить новые endpoints статусов

## 📝 Финальные действия:
- [ ] Удалить временные файлы из Downloads
- [ ] Сделать git commit изменений
- [ ] Запустить миграции БД
