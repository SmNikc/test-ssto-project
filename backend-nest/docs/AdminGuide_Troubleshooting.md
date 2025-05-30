# Руководство администратора модуля «Тест ССТО»: Устранение неполадок

## Введение
Этот раздел содержит рекомендации по устранению типичных проблем в модуле «Тест ССТО». Если проблему не удается решить, обратитесь в техническую поддержку.

## Проблемы с запуском приложения
- Контейнеры не запускаются:
    - Проверьте логи: docker-compose logs.
    - Убедитесь, что порты 5173, 3000, 5432 свободны: netstat -tuln | grep 5173.
    - Проверьте .env: все параметры (например, DB_URL) должны быть корректны.

- Frontend не загружается:
    - Проверьте доступность: curl -I https://test-ssto.local:5173.
    - Убедитесь, что Nginx работает: sudo systemctl status nginx.
    - Проверьте сертификаты: ls -l /opt/test-ssto/certs.

## Проблемы с базой данных
- Подключение не работает:
    - Проверьте статус PostgreSQL: sudo systemctl status postgresql.
    - Проверьте параметры: psql -h localhost -U user -d test_ssto.
    - Убедитесь, что пароль в .env совпадает.

- Данные не сохраняются:
    - Проверьте логи backend: docker logs backend | grep "ERROR".
    - Убедитесь, что таблицы созданы: psql -U user -d test_ssto -c "\dt".

## Проблемы с интеграциями
- Keycloak:
    - Пользователь не авторизуется: Проверьте логи Keycloak: docker logs keycloak.
    - Убедитесь, что Redirect URI совпадает: https://test-ssto.local/callback.

- IMAP:
    - Сигналы не поступают: Проверьте подключение: telnet imap.morflot.ru 143.
    - Проверьте логи: docker logs backend | grep "IMAP".

- SMTP/Twilio/Telegram:
    - Уведомления не отправляются: Проверьте .env (например, SMTP_HOST).
    - Проверьте API ключи: curl -X POST https://api.telegram.org/bot<TOKEN>/sendMessage.

## Проблемы с производительностью
- Высокая нагрузка:
    - Проверьте использование ресурсов: top или htop.
    - Оптимизируйте базу данных: CREATE INDEX idx_mmsi ON "SSASRequest" (mmsi);.

- Медленные отчеты:
    - Убедитесь, что индексы настроены: psql -U user -d test_ssto -c "\di".
    - Очистите старые данные: DELETE FROM "Logs" WHERE created_at < NOW() - INTERVAL '30 days';.

## Общие рекомендации
- Логи: Всегда начинайте с логов (docker logs, /var/log/nginx/error.log).
- Перезапуск: Перезапустите сервисы: docker-compose restart.
- Документация: Проверьте настройки в предыдущих разделах.

**Совет**: Настройте мониторинг (например, Prometheus) для раннего выявления проблем.
