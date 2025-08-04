markdown
CopyEdit
# Руководство администратора — Развёртывание и обновление модуля "Тест ССТО"
## Установка
1. Клонировать репозиторий:
git clone https://github.com/SmNikc/test-ssto-project
markdown
CopyEdit
2. Перейти в папку проекта:
cd test-ssto-project
markdown
CopyEdit
3. Установить зависимости и поднять сервисы:
docker-compose up --build -d
markdown
CopyEdit
## Переменные окружения
- Настройте файл `.env` в `backend-nest`:
DB_URL=postgres://ssto:sstopass@localhost:5432/sstodb
markdown
CopyEdit
## Настройка Keycloak
- Поднимите сервер Keycloak (можно через docker).
- Создайте realm и пользователей для "Тест ССТО" по внутренней политике.
## Проверка доступности
- Frontend: http://localhost:5173/
- Backend API: http://localhost:3000/api/health
## Обновление
1. Остановите сервисы: `docker-compose down`
2. Выполните `git pull`
3. Запустите: `docker-compose up --build -d`
