@echo off
REM === Перейти в папку проекта ===
cd /d C:\Projects\test-ssto-project

REM === ВЫГРУЗИТЬ все изменения в GitHub ===
git add -A
git commit -m "Выгрузка последних изменений в GitHub"
git push origin main

pause
