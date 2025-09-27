# Руководство администратора модуля «Тест ССТО»: Мониторинг безопасности

## Введение
Этот раздел описывает процесс мониторинга безопасности модуля «Тест ССТО» с использованием OWASP ZAP и анализа логов. Мониторинг помогает выявить уязвимости и предотвратить атаки.

## Установка OWASP ZAP
1. Установите OWASP ZAP:
    - Скачайте с официального сайта: https://www.zaproxy.org/download/.
    - Для «Астра Линукс» используйте .tar.gz:
        wget https://github.com/zaproxy/zaproxy/releases/download/v2.12.0/ZAP_2.12.0_Linux.tar.gz
        tar -xzf ZAP_2.12.0_Linux.tar.gz -C /opt/
    - Запустите:
        /opt/ZAP_2.12.0/zap.sh

2. Настройте прокси:
    - В OWASP ZAP: Tools → Options → Local Proxy.
    - Установите адрес: localhost, порт: 8080.

## Сканирование приложения
1. Настройте браузер:
    - Настройте прокси в браузере (localhost:8080).
    - Импортируйте сертификат ZAP: Tools → Options → Dynamic SSL Certificates → Save.

2. Просканируйте приложение:
    - В OWASP ZAP выберите «Quick Start».
    - Введите URL: https://test-ssto.local.
    - Нажмите «Attack».
    - Дождитесь завершения (около 5-10 минут).

3. Анализируйте отчет:
    - Перейдите в «Alerts».
    - Проверьте уязвимости:
        - Высокий риск: SQL-инъекции, XSS.
        - Средний риск: Отсутствие заголовков безопасности.
    - Экспортируйте отчет: File → Export Report (HTML).

## Настройка заголовков безопасности
1. Обновите Nginx:
    - Откройте конфигурацию:
        nano /etc/nginx/sites-available/test-ssto
    - Добавьте заголовки:
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header Content-Security-Policy "default-src 'self'";
    - Перезапустите Nginx:
        sudo systemctl restart nginx

2. Проверьте заголовки:
    - Используйте curl:
        curl -I https://test-ssto.local
    - Ожидаемый вывод: заголовки X-Content-Type-Options, X-Frame-Options и др.

## Анализ логов
1. Просмотрите логи backend:
    - Проверьте ошибки:
        docker logs backend | grep "ERROR"
    - Ищите подозрительные запросы (например, SQL-инъекции).

2. Настройте ротацию логов:
    - Используйте logrotate:
        nano /etc/logrotate.d/test-ssto
    - Вставьте:
        /var/lib/docker/containers/*/*-json.log {
            daily
            rotate 7
            compress
            missingok
        }
    - Примените:
        sudo logrotate -f /etc/logrotate.d/test-ssto

## Устранение неполадок
- OWASP ZAP не сканирует:
    - Проверьте прокси в браузере.
    - Убедитесь, что ZAP запущен: ps aux | grep zap.
- Уязвимости не устраняются:
    - Обновите зависимости: docker-compose build.
    - Проверьте конфигурацию заголовков.
- Логи заполняют диск:
    - Проверьте ротацию: logrotate -d /etc/logrotate.d/test-ssto.
    - Очистите старые логи: find /var/lib/docker/containers/ -name '*-json.log' -mtime +7 -delete.

**Совет**: Проводите сканирование OWASP ZAP еженедельно.
