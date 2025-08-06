<<<<<<< HEAD
echo Удаление лишних файлов перед созданием архива
cd /d "%~dp0"
if exist backend-nest\node_modules (
    echo Удаляем backend-nest\node_modules
    rmdir /s /q backend-nest\node_modules
) else (
    echo backend-nest\node_modules отсутствует
)
if exist frontend\node_modules (
    echo Удаляем frontend\node_modules
    rmdir /s /q frontend\node_modules
) else (
    echo frontend\node_modules отсутствует
)
if exist backend-nest\package-lock.json (
    echo Удаляем backend-nest\package-lock.json
    del /q backend-nest\package-lock.json
) else (
    echo backend-nest\package-lock.json отсутствует
)
if exist .vscode (
    echo Удаляем .vscode
    rmdir /s /q .vscode
) else (
    echo .vscode отсутствует
)
if exist .cache (
    echo Удаляем .cache
    rmdir /s /q .cache
) else (
    echo .cache отсутствует
)
del /s /q *.log 2>nul
echo Удалены *.log файлы, если были
if exist frontend\src\RequestForm.tsx (
    echo Удаляем дублирующий frontend\src\RequestForm.tsx
    del /q frontend\src\RequestForm.tsx
) else (
    echo frontend\src\RequestForm.tsx отсутствует
)

echo Подсчёт файлов для архивирования...
dir /s /b /a-d | find /c "\" > C:\Temp\file_count.txt
set /p FILE_COUNT=<C:\Temp\file_count.txt
echo Найдено файлов: %FILE_COUNT%
if %FILE_COUNT% LSS 90 (
    echo Ошибка: слишком мало файлов - %FILE_COUNT%, ожидается 90-100
    dir /s /b > C:\Temp\file_list.txt
    echo Список файлов сохранён в C:\Temp\file_list.txt
    pause
    cd /d "%~dp0"
    exit /b 1
)
if %FILE_COUNT% GTR 100 (
    echo Ошибка: слишком много файлов - %FILE_COUNT%, ожидается 90-100
    dir /s /b > C:\Temp\file_list.txt
    echo Список файлов сохранён в C:\Temp\file_list.txt
    pause
    cd /d "%~dp0"
    exit /b 1
)

echo Создание архива проекта
if exist test-ssto-project.zip (
    echo Удаляем старый архив test-ssto-project.zip
    del test-ssto-project.zip
)
echo Запускаем 7-Zip для создания архива...
"C:\Program Files\7-Zip\7z.exe" a -tzip "%~dp0test-ssto-project.zip" "%~dp0*" -x!node_modules -x!.git -x!dist -x!*.lock -x!.vscode -x!*.log -x!.cache
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при создании архива с помощью 7-Zip.
    pause
    cd /d "%~dp0"
    exit /b 1
)
echo Проверяем созданный архив...
dir "%~dp0test-ssto-project.zip"
if not exist "%~dp0test-ssto-project.zip" (
    echo Архив test-ssto-project.zip не создан!
    pause
    cd /d "%~dp0"
    exit /b 1
)

echo Копирование архива в C:\Projects
if exist "C:\Projects\test-ssto-project.zip" (
    echo Удаляем старый архив в C:\Projects
    del "C:\Projects\test-ssto-project.zip"
)
copy "%~dp0test-ssto-project.zip" "C:\Projects\test-ssto-project.zip"
if %ERRORLEVEL% NEQ 0 (
    echo Ошибка при копировании архива.
    pause
    cd /d "%~dp0"
    exit /b 1
)
echo Проверяем скопированный архив...
dir "C:\Projects\test-ssto-project.zip"
@echo off
docker-compose down
git pull
docker-compose up --build -d
pause
