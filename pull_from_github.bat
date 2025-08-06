@echo off
REM === Перейти в папку проекта ===
cd /d C:\Projects\test-ssto-project

REM === ОБНОВИТЬ локальный проект из GitHub ===
git pull origin main

echo [OK] Синхронизация с GitHub завершена!
pause
