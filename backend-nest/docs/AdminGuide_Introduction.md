# Руководство администратора модуля «Тест ССТО»: Введение

## Обзор системы
Модуль «Тест ССТО» — это веб-приложение для автоматизации тестирования аппаратуры судовой тревожной сигнализации и оповещения (ССТО). Оно предназначено для судовладельцев, оперативных дежурных ГМСКЦ, администраторов и тестировщиков, обеспечивая подачу заявок, обработку сигналов, генерацию отчетов, настройку уведомлений и интеграцию с внешними системами.

### Основные функции
- **Управление пользователями**: Создание учетных записей и ролей через Keycloak.
- **Настройка уведомлений**: Email, SMS, Telegram для оповещений о событиях.
- **Резервное копирование**: Ежедневное сохранение данных в PostgreSQL.
- **Мониторинг безопасности**: Использование OWASP ZAP для выявления уязвимостей.
- **Интеграции**: Подключение к «Поиск-Море», РМРС, МСКЦ/МСПЦ.

### Роль администратора
Администратор отвечает за настройку системы, управление пользователями, мониторинг безопасности и устранение неполадок. Для выполнения задач необходимы права доступа с ролью «Администратор».

## Технические требования
- **Сервер**: «Астра Линукс» с установленным Docker.
- **База данных**: PostgreSQL (без PostGIS).
- **Frontend**: React, Vite, Material UI.
- **Backend**: NestJS, Sequelize.
- **Интеграции**: Keycloak (SSO), IMAP, SMTP, Twilio, Telegram API.
- **Сеть**: HTTPS/TLS 1.3 для всех endpoints.

## Как начать
1. **Получите учетные данные**:
   - Логин и пароль администратора предоставляются при развертывании системы.
   - Пример: `admin@gmskcc.ru`, временный пароль `Admin@123`.

2. **Войдите в систему**:
   - Откройте `https://test-ssto.local` в браузере.
   - Войдите через Keycloak, используя учетные данные администратора.
   - Смените временный пароль при первом входе.

3. **Перейдите в панель администратора**:
   - После входа нажмите на иконку профиля и выберите «Панель администратора».

**Скриншот**: Панель администратора включает меню с пунктами: «Пользователи», «Настройки уведомлений», «Резервное копирование», «Мониторинг безопасности», «Логи».

## Структура руководства
- [Развертывание системы](#развертывание-системы)
- [Настройка системы](#настройка-системы)
- [Управление пользователями](#управление-пользователями)
- [Настройка уведомлений](#настройка-уведомлений)
- [Резервное копирование](#резервное-копирование)
- [Мониторинг безопасности](#мониторинг-безопасности)
- [Устранение неполадок](#устранение-неполадок)
