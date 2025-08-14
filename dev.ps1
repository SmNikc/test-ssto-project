# Быстрый запуск фронтенда и бэкенда в двух окнах PowerShell

$ErrorActionPreference = "Stop"

# Бэкенд
$backend = "C:\Projects\test-ssto-project\backend-nest"
# Фронтенд
$frontend = "C:\Projects\test-ssto-project\frontend"

# Старт БД (docker) - опционально
if (Test-Path "C:\Projects\test-ssto-project\docker-compose.yml") {
    Write-Host "Launching Postgres via docker-compose..." -ForegroundColor Cyan
    docker compose -f "C:\Projects\test-ssto-project\docker-compose.yml" up -d
}

# Окно 1: backend
Start-Process -WorkingDirectory $backend powershell -ArgumentList @("-NoExit","-Command",
    "if (Test-Path .\.env) { Write-Host 'ENV OK' } else { Copy-Item -Force .\.env.example .\.env -ErrorAction SilentlyContinue }; npm i; npm run start:dev")

# Окно 2: frontend (vite dev server на 5173)
Start-Process -WorkingDirectory $frontend powershell -ArgumentList @("-NoExit","-Command",
    "npm i; npm run dev")
