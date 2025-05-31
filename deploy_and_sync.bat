@echo off
chcp 65001 >nul

echo Переход в директорию проекта
cd /d "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project"

echo Удаление лишних файлов перед созданием архива
if exist node_modules (
    rmdir /s /q backend-nest\node_modules
    rmdir /s /q frontend\node_modules
)

echo Установка зависимостей для backend
cd /d "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\backend-nest"
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при установке зависимостей для backend. Проверьте логи npm.
    pause
    exit /b 1
)

echo Исправление уязвимостей
npm audit fix
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при исправлении уязвимостей. Выполните npm audit для деталей.
    pause
    exit /b 1
)

echo Сборка проекта для проверки
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при сборке проекта. Проверьте логи и исправьте ошибки.
    pause
    exit /b 1
)

echo Установка зависимостей для frontend
cd /d "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\frontend"
npm install
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при установке зависимостей для frontend.
    pause
    exit /b 1
)

echo Сборка Docker контейнеров
cd /d "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project"
docker-compose up -d
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при сборке Docker контейнеров. Проверьте логи Docker.
    pause
    exit /b 1
)

echo Проверка /api/health endpoint
curl https://test-ssto-project.local:5173/api/health
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при проверке /api/health. Убедитесь, что проект запущен.
    pause
    exit /b 1
)

echo Удаление лишних файлов перед созданием архива
if exist node_modules (
    rmdir /s /q backend-nest\node_modules
    rmdir /s /q frontend\node_modules
)

echo Создание архива проекта
cd /d "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project"
if exist test-ssto-project.zip (
    del test-ssto-project.zip
)
powershell -command "Compress-Archive -Path 'C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project' -DestinationPath 'C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\test-ssto-project.zip'"
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при создании архива.
    pause
    exit /b 1
)

echo Копирование архива в C:\Projects
copy "C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\test-ssto-project.zip" "C:\Projects\test-ssto-project.zip"
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при копировании архива.
    pause
    exit /b 1
)

echo Проверка версии Git
git --version
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка: Git не найден. Убедитесь, что Git установлен.
    pause
    exit /b 1
)

echo Проверка статуса репозитория
git status

echo Добавление изменений в Git
git add .
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при добавлении файлов.
    pause
    exit /b 1
)

echo Создание коммита
git commit -m "Добавлен финальный архив test-ssto-project.zip и обновлены файлы проекта"
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при создании коммита.
    pause
    exit /b 1
)

echo Отправка изменений на GitHub
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при отправке на GitHub.
    pause
    exit /b 1
)

echo Проверка наличия лишнего файла main
if exist main (
    echo Удаление лишнего файла main
    del main
    git add .
    git commit -m "Удалён лишний файл main"
    git push origin main
)

echo Проект успешно обновлён и синхронизирован с GitHub!
echo Архив находится в: C:\Projects\test-ssto-project.zip
echo Проверьте репозиторий: https://github.com/SmNikc/test-ssto-project
pause