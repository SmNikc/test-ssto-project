# start-system.ps1
Write-Host "🚀 Запуск системы ГМСКЦ..." -ForegroundColor Green

# Проверка БД
Write-Host "`n📊 Проверка подключения к БД..." -ForegroundColor Yellow
node "C:\Projects\test-ssto-project\backend-nest\test-db.js"

# Запуск backend
cd C:\Projects\test-ssto-project\backend-nest
Write-Host "`n🔧 Запуск Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd $PWD; npm run start:dev"

Start-Sleep -Seconds 5

# Тест API
Write-Host "`n✅ Проверка API..." -ForegroundColor Yellow
Invoke-RestMethod "http://localhost:3000/health" | ConvertTo-Json

Write-Host "`n✅ Система запущена!" -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan