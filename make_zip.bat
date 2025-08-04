@echo off
REM === 2. Архивирование проекта ===
REM Корень проекта
cd /d "C:\Projects\test-ssto-project"
REM Удалить старый архив, если есть
del project_full.zip 2>nul

REM Исключить ненужные папки (node_modules, .git, dist и пр.)
REM Для 7-Zip — если установлен (проверьте наличие 7z.exe в PATH!)
7z a -xr!node_modules -xr!.git -xr!.angular -xr!dist -xr!__pycache__ project_full.zip *

echo [OK] Архив project_full.zip создан.
pause
