# Тест ССТО
## Описание проекта
Проект «Тест ССТО» — это веб-приложение для автоматизации тестирования аппаратуры судовой тревожной сигнализации и оповещения (ССТО). Приложение позволяет судовладельцам подавать заявки на тестирование, оперативным дежурным ГМСКЦ обрабатывать сигналы, а администраторам управлять системой.
## Технологии
- Frontend: React, Vite, Material UI
- Backend: NestJS, Sequelize, PostgreSQL
- Аутентификация: Keycloak (SSO)
- Уведомления: Email (SMTP), SMS (Twilio), Telegram
- Безопасность: HTTPS, OWASP ZAP
## Установка и запуск
1. Клонируйте репозиторий:
    git clone https://github.com/SmNikc/test-ssto-project
2. Установите зависимости:
    - Frontend:
        cd frontend
        npm install
    - Backend:
        cd backend-nest
        npm install
3. Настройте окружение:
    - Скопируйте .env.example в .env:
        cp backend-nest/.env.example backend-nest/.env
    - Заполните параметры (см. [AdminGuide_Deployment.md](backend-nest/docs/AdminGuide_Deployment.md)).
4. Запустите приложение:
    docker-compose up -d
5. Проверьте доступ:
    - Frontend: https://test-ssto.local:5173
    - Backend API: https://test-ssto.local:3000/api/health
## Документация
- Руководство пользователя: backend-nest/docs/UserGuide_Introduction.md
- Руководство администратора: backend-nest/docs/AdminGuide_Introduction.md
## Лицензия
Проект распространяется под лицензией MIT.
