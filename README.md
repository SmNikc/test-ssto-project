--- FILE: README.md ---
# Тест ССТО

## 1. Описание проекта
Проект **«Тест ССТО»** — это веб-приложение для автоматизации тестирования аппаратуры судовой тревожной сигнализации и оповещения (ССТО).  
Система предназначена для:
- подачи заявок на тестирование ССТО судовладельцами;
- обработки поступающих тревожных сигналов оперативными дежурными ГМСКЦ;
- ведения журнала тестов и формирования отчётности;
- интеграции с Keycloak для аутентификации пользователей.

## 2. Технологии
- **Frontend**: React (Vite, Material UI)
- **Backend**: NestJS, Sequelize (sequelize-typescript), PostgreSQL
- **Аутентификация**: Keycloak (SSO)
- **Уведомления**: Email (SMTP), SMS (Twilio), Telegram
- **Безопасность**: HTTPS, OWASP ZAP
- **Docker**: docker-compose для сборки и запуска всех компонентов

## 3. Установка и запуск

### 3.1 Локальный запуск без Docker
#### Backend:
```bash
cd backend-nest
npm install
npm run build
npm run start:dev
Frontend:
bash
Copy
Edit
cd frontend
npm install
npm run dev
Frontend по умолчанию доступен на http://localhost:5173, backend API — на http://localhost:3000/api.

3.2 Запуск с помощью Docker
bash
Copy
Edit
docker-compose up --build
После запуска:

Frontend: https://test-ssto.local:5173

Backend API: https://test-ssto.local:3000/api/health

4. Настройка окружения
Для backend:

bash
Copy
Edit
cp backend-nest/.env.example backend-nest/.env
Для frontend:

bash
Copy
Edit
cp frontend/.env.example frontend/.env
Заполните значения переменных (адреса API, параметры подключения к Keycloak, SMTP).

5. Структура проекта
Copy
Edit
backend-nest/  - серверная часть (NestJS)
frontend/      - клиентская часть (React)
docs/          - документация
docker-compose.yml - сборка и запуск в Docker
6. Тестирование
6.1 Unit и e2e тесты (Backend)
Используются Jest и Supertest.

bash
Copy
Edit
cd backend-nest
npm run test         # unit-тесты
npm run test:e2e     # end-to-end тесты
npm run test:cov     # покрытие кода
6.2 Тестирование frontend (Cypress)
bash
Copy
Edit
cd frontend
npm run test
6.3 Smoke-тесты вручную
Запустите проект через Docker:

bash
Copy
Edit
docker-compose up --build
Проверьте доступность:

https://test-ssto.local:5173 (frontend)

https://test-ssto.local:3000/api/health (backend API)

Войдите в систему через Keycloak тестовым пользователем.

Создайте заявку на тест ССТО.

Отправьте тестовый тревожный сигнал (через API или форму).

Убедитесь, что сигнал обработан и создан отчёт.

7. CI/CD
Все изменения автоматически тестируются через GitHub Actions.

Конфигурация CI/CD находится в .github/workflows/ci.yml.

Поддерживается тестирование в Docker (single-container).

8. Полезные команды
bash
Copy
Edit
npm run build      # сборка проекта
npm run lint       # линтинг кода
npm run format     # автоформатирование
npm run test       # тестирование
9. Лицензия
Проект распространяется по лицензии MIT.