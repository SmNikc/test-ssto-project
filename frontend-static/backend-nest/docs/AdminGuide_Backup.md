# Руководство администратора модуля «Тест ССТО»: Резервное копирование

## Введение
Этот раздел описывает процесс настройки резервного копирования данных модуля «Тест ССТО». Резервное копирование обеспечивает сохранность данных PostgreSQL и конфигурационных файлов.

## Настройка резервного копирования
1. Убедитесь, что путь для бэкапов настроен:
    - В .env укажите:
        BACKUP_DIR=/opt/test-ssto/backups
    - Создайте директорию:
        mkdir -p /opt/test-ssto/backups
        chown $USER:$USER /opt/test-ssto/backups

2. Настройте ежедневное копирование:
    - Создайте скрипт backup.sh:
        nano /opt/test-ssto/backup.sh
    - Вставьте:
        #!/bin/bash
        BACKUP_DIR=/opt/test-ssto/backups
        DATE=$(date +%F)
        pg_dump -U user -h localhost test_ssto > $BACKUP_DIR/db_backup_$DATE.sql
        tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz /opt/test-ssto/backend-nest/.env
    - Сделайте скрипт исполняемым:
        chmod +x /opt/test-ssto/backup.sh

3. Настройте cron:
    - Откройте crontab:
        crontab -e
    - Добавьте задание (ежедневно в 2:00):
        0 2 * * * /opt/test-ssto/backup.sh

## Проверка бэкапов
1. Выполните тестовый запуск:
    - Запустите скрипт:
        /opt/test-ssto/backup.sh
    - Проверьте файлы:
        ls /opt/test-ssto/backups
    - Ожидаемый вывод: db_backup_2025-05-29.sql, config_backup_2025-05-29.tar.gz.

2. Проверьте содержимое:
    - База данных:
        head /opt/test-ssto/backups/db_backup_2025-05-29.sql
    - Конфигурация:
        tar -tzf /opt/test-ssto/backups/config_backup_2025-05-29.tar.gz

## Восстановление данных
1. Восстановление базы данных:
    - Остановите backend:
        docker-compose stop backend
    - Восстановите бэкап:
        psql -U user -h localhost test_ssto < /opt/test-ssto/backups/db_backup_2025-05-29.sql
    - Запустите backend:
        docker-compose start backend

2. Восстановление конфигурации:
    - Распакуйте бэкап:
        tar -xzf /opt/test-ssto/backups/config_backup_2025-05-29.tar.gz -C /opt/test-ssto/backend-nest/

## Устранение неполадок
- Бэкап не создается:
    - Проверьте права доступа: ls -ld /opt/test-ssto/backups.
    - Проверьте логи cron: grep CRON /var/log/syslog.
- Восстановление не работает:
    - Убедитесь, что PostgreSQL запущен: sudo systemctl status postgresql.
    - Проверьте целостность бэкапа: file /opt/test-ssto/backups/db_backup_2025-05-29.sql.

**Совет**: Храните бэкапы на внешнем сервере для большей безопасности.
