# Руководство администратора модуля «Тест ССТО»: Развертывание системы

## Введение
Этот раздел описывает процесс развертывания модуля «Тест ССТО» на сервере с «Астра Линукс» с использованием Docker. Развертывание включает установку зависимостей, настройку окружения и запуск приложения.

## Требования
- Сервер: «Астра Линукс» (версия 1.7 или выше).
- Docker: Docker и Docker Compose (версия 1.29 или выше).
- Сеть: Доступ к интернету для загрузки зависимостей.
- Порты: 5173 (frontend), 3000 (backend), 5432 (PostgreSQL).
- Хранилище: Минимум 10 ГБ свободного места.

## Подготовка сервера
1. Установите Docker:
    sudo apt-get update
    sudo apt-get install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker

2. Проверьте установку:
    docker --version
    docker-compose --version
    Ожидаемый вывод: Docker version 20.x.x, docker-compose version 1.29.x.

3. Настройте права доступа:
    sudo usermod -aG docker $USER
    Перезайдите в систему, чтобы применить изменения.

## Копирование проекта
1. Создайте директорию:
    sudo mkdir -p /opt/test-ssto
    sudo chown $USER:$USER /opt/test-ssto

2. Скопируйте файлы проекта:
    - Скопируйте архив test-ssto-full-project.zip на сервер (например, через SCP):
        scp test-ssto-full-project.zip user@server:/opt/test-ssto/
    - Распакуйте архив:
        cd /opt/test-ssto
        unzip test-ssto-full-project.zip

## Настройка окружения
1. Создайте файл .env:
    - Скопируйте шаблон:
        cp backend-nest/.env.example backend-nest/.env
    - Отредактируйте backend-nest/.env:
        DB_URL=postgres://user:password@localhost:5432/test_ssto
        JWT_SECRET=your_jwt_secret
        REFRESH_SECRET=your_refresh_secret
        IMAP_USER=od_smrcc@morflot.ru
        IMAP_PASS=your_imap_password
        SMTP_HOST=smtp.morflot.ru
        SMTP_PORT=587
        SMTP_USER=od_smrcc@morflot.ru
        SMTP_PASS=your_smtp_password
        TWILIO_SID=your_twilio_sid
        TWILIO_TOKEN=your_twilio_token
        TWILIO_PHONE=your_twilio_phone
        TELEGRAM_BOT_TOKEN=your_telegram_token
        KEYCLOAK_URL=http://localhost:8080/auth
        KEYCLOAK_REALM=your_realm
        KEYCLOAK_CLIENT_ID=your_client_id
        KEYCLOAK_CLIENT_SECRET=your_client_secret
        REPORT_DIR=/opt/test-ssto/reports
        BACKUP_DIR=/opt/test-ssto/backups
    - Замените значения (например, your_jwt_secret) на реальные.

2. Настройте сертификаты HTTPS:
    - Поместите SSL-сертификаты в /opt/test-ssto/certs:
        mkdir /opt/test-ssto/certs
        cp /path/to/server.crt /opt/test-ssto/certs/
        cp /path/to/server.key /opt/test-ssto/certs/
    - Укажите пути в docker-compose.yml (см. ниже).

## Запуск приложения
1. Настройте docker-compose.yml:
    - Файл docker-compose.yml находится в корне проекта. Пример:
        version: '3.8'
        services:
          frontend:
            build: ./frontend
            ports:
              - "5173:5173"
            depends_on:
              - backend
          backend:
            build: ./backend-nest
            ports:
              - "3000:3000"
            depends_on:
              - db
            volumes:
              - ./certs:/app/certs
            environment:
              - NODE_ENV=production
          db:
            image: postgres:13
            ports:
              - "5432:5432"
            environment:
              - POSTGRES_USER=user
              - POSTGRES_PASSWORD=password
              - POSTGRES_DB=test_ssto
            volumes:
              - pgdata:/var/lib/postgresql/data
        volumes:
          pgdata:
    - Убедитесь, что порты и пути к сертификатам соответствуют вашей конфигурации.

2. Запустите контейнеры:
    cd /opt/test-ssto
    docker-compose up -d

3. Проверьте работу:
    - Frontend: Откройте https://test-ssto.local:5173 в браузере.
    - Backend: Проверьте API: https://test-ssto.local:3000/api/health.
    - Ожидаемый ответ: {"status":"ok"}.

## Настройка Nginx (опционально)
1. Установите Nginx:
    sudo apt-get install -y nginx

2. Настройте прокси:
    - Создайте файл конфигурации:
        sudo nano /etc/nginx/sites-available/test-ssto
    - Вставьте:
        server {
            listen 443 ssl;
            server_name test-ssto.local;

            ssl_certificate /opt/test-ssto/certs/server.crt;
            ssl_certificate_key /opt/test-ssto/certs/server.key;

            location / {
                proxy_pass http://localhost:5173;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }

            location /api {
                proxy_pass http://localhost:3000;
                proxy_set_header Host $host;
                proxy_set_header X-Real-IP $remote_addr;
            }
        }
    - Активируйте конфигурацию:
        sudo ln -s /etc/nginx/sites-available/test-ssto /etc/nginx/sites-enabled/
        sudo systemctl restart nginx

3. Проверьте доступ:
    - Откройте https://test-ssto.local — должен загрузиться frontend.

## Устранение неполадок
- Контейнер не запускается:
    - Проверьте логи: docker-compose logs.
    - Убедитесь, что порты 5173, 3000, 5432 не заняты.
    - Проверьте правильность настроек в .env.

- Nginx не работает:
    - Проверьте конфигурацию: sudo nginx -t.
    - Убедитесь, что сертификаты доступны и корректны.
    - Проверьте логи: sudo tail -f /var/log/nginx/error.log.

**Совет**: Настройте автоматический запуск docker-compose при перезагрузке сервера (systemd).
