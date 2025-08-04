@echo off
REM ==== 1. Выгрузка изменений в GitHub ====
cd /d "C:\Projects\test-ssto-project" 
REM Добавить все изменённые/новые файлы в индекс
git add .
REM Зафиксировать изменения с меткой времени
git commit -m "Auto-commit: %date% %time%"
REM Отправить в основную ветку
git push origin main

REM ==== 1.1. Обновление проекта из GitHub (если был отладка через Codex/GitHub) ====
REM Синхронизировать с удалённой репой
git pull origin main

echo [OK] Проект синхронизирован с GitHub.
pause
