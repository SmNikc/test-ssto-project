# Backend для "Тест ССТО"
## Быстрый старт
- Установить зависимости: `npm install`
- Запустить dev: `npm run start:dev`
- Собрать и запустить prod: `npm run start:prod` (скрипт автоматически выполнит `npm run build`, если отсутствует `dist/main.js`)
## Структура
- src/models — Sequelize модели (PostgreSQL)
- src/controllers — REST API-контроллеры
- src/services — бизнес-логика
- src/validators — валидация входных данных
## Лицензия
MIT
