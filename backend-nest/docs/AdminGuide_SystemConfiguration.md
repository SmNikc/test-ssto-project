# Руководство администратора модуля «Тест ССТО»: Настройка системы

## Введение
Этот раздел описывает процесс настройки модуля «Тест ССТО» после развертывания. Настройка включает конфигурацию базы данных, интеграций, уведомлений и параметров безопасности.

## Настройка базы данных
1. Подключитесь к PostgreSQL:
    - Используйте pgAdmin или командную строку:
        psql -h localhost -U user -d test_ssto
    - Введите пароль, указанный в .env (например, `password`).

2. Проверьте схему:
    - Убедитесь, что таблицы созданы:
        \dt
    - Ожидаемый вывод: таблицы `SSASRequest`, `Users`, `Logs`.

3. Настройте индексы:
    - Для ускорения поиска по MMSI создайте индекс:
        CREATE INDEX idx_mmsi ON "SSASRequest" (mmsi);

## Настройка интеграций
1. Keycloak (SSO):
    - Войдите в Keycloak: http://localhost:8080/auth.
    - Создайте realm (например, `test-ssto`).
    - Настройте клиента:
        Client ID: test-ssto-client
        Client Protocol: openid-connect
        Access Type: confidential
        Redirect URI: https://test-ssto.local/callback
    - Обновите .env с данными Keycloak:
        KEYCLOAK_URL=http://localhost:8080/auth
        KEYCLOAK_REALM=test-ssto
        KEYCLOAK_CLIENT_ID=test-ssto-client
        KEYCLOAK_CLIENT_SECRET=your_client_secret

2. IMAP (email):
    - Настройте доступ к почтовому ящику:
        IMAP_USER=od_smrcc@morflot.ru
        IMAP_PASS=your_imap_password
    - Проверьте подключение:
        telnet imap.morflot.ru 143
    - Ожидаемый ответ: * OK IMAP4rev1.

3. SMTP (уведомления):
    - Настройте SMTP-сервер:
        SMTP_HOST=smtp.morflot.ru
        SMTP_PORT=587
        SMTP_USER=od_smrcc@morflot.ru
        SMTP_PASS=your_smtp_password
    - Проверьте отправку тестового email:
        echo "Test email" | mail -s "Test" operator@gmskcc.ru

4. Twilio (SMS) и Telegram:
    - Twilio:
        TWILIO_SID=your_twilio_sid
        TWILIO_TOKEN=your_twilio_token
        TWILIO_PHONE=your_twilio_phone
    - Telegram:
        TELEGRAM_BOT_TOKEN=your_telegram_token
    - Проверьте отправку тестового сообщения через API (например, с помощью curl).

## Настройка уведомлений
1. Войдите в панель администратора (см. [Введение](#введение)).
2. Перейдите в раздел «Управление уведомлениями».
3. Настройте события:
    - Получение тревожного сигнала: Email, SMS, Telegram.
    - Ошибка обработки: Email.
    - Ежедневная сводка: Email.
4. Укажите получателей:
    - Email: operator@gmskcc.ru
    - SMS: +7 (495) 123-45-67
    - Telegram ID: 123456789

## Настройка безопасности
1. Включите HTTPS:
    - Убедитесь, что сертификаты настроены (см. [Развертывание](#развертывание-системы)).
    - Проверьте работу HTTPS: https://test-ssto.local.

2. Настройте JWT:
    - Обновите секреты в .env:
        JWT_SECRET=your_jwt_secret
        REFRESH_SECRET=your_refresh_secret
    - Перезапустите backend:
        docker-compose restart backend

3. Ограничьте доступ:
    - Настройте firewall (ufw):
        sudo ufw allow 443/tcp
        sudo ufw allow 5173/tcp
        sudo ufw allow 3000/tcp
        sudo ufw enable

## Устранение неполадок
- Подключение к базе данных не работает:
    - Проверьте параметры в .env (DB_URL).
    - Убедитесь, что PostgreSQL запущен: sudo systemctl status postgresql.
- Интеграция с Keycloak не работает:
    - Проверьте логи Keycloak: docker logs keycloak.
    - Убедитесь, что Redirect URI совпадает с настройками клиента.
- Уведомления не отправляются:
    - Проверьте логи backend: docker logs backend.
    - Убедитесь, что SMTP/Twilio/Telegram API настроены корректно.

**Совет**: Сохраняйте копии .env и конфигурационных файлов в безопасном месте.
