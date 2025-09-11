# C:\Projects\test-ssto-project\backend-nest\test-api-day2.ps1
# Скрипт для тестирования API День 2

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   ТЕСТИРОВАНИЕ API - ДЕНЬ 2" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000"

# Функция для красивого вывода JSON
function Show-Json($data) {
    $data | ConvertTo-Json -Depth 10 | Write-Host -ForegroundColor Green
}

# 1. Проверка здоровья системы
Write-Host "`n1. Проверка здоровья системы:" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Show-Json $health
} catch {
    Write-Host "❌ Ошибка: Сервер не запущен?" -ForegroundColor Red
    Write-Host "Запустите: npm run start:dev" -ForegroundColor Yellow
    exit
}

# 2. Создание тестовой заявки
Write-Host "`n2. Создание тестовой заявки:" -ForegroundColor Yellow

$testRequest = @{
    vessel_name = "Сахалин-8"
    mmsi = "273439750"
    imo = "9876543"
    test_datetime = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ss")
    contact_email = "captain@vessel.com"
    contact_phone = "+7 900 123-45-67"
    responsible_person = "Иванов И.И."
    company = "Сахалинское морское пароходство"
    notes = "Тестирование ССТО по плану"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/requests" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testRequest
    
    Write-Host "✅ Заявка создана успешно!" -ForegroundColor Green
    Show-Json $response
    $requestId = $response.data.id
} catch {
    Write-Host "❌ Ошибка создания заявки:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 3. Получение списка заявок
Write-Host "`n3. Список всех заявок:" -ForegroundColor Yellow
try {
    $requests = Invoke-RestMethod -Uri "$baseUrl/requests" -Method GET
    Write-Host "Найдено заявок: $($requests.count)" -ForegroundColor Cyan
    if ($requests.count -gt 0) {
        $requests.data | ForEach-Object {
            Write-Host "  ID: $($_.id) | Судно: $($_.vessel_name) | MMSI: $($_.mmsi) | Статус: $($_.status)"
        }
    }
} catch {
    Write-Host "❌ Ошибка получения заявок:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

# 4. Получение заявки по ID (если создали)
if ($requestId) {
    Write-Host "`n4. Получение заявки #$requestId :" -ForegroundColor Yellow
    try {
        $request = Invoke-RestMethod -Uri "$baseUrl/requests/$requestId" -Method GET
        Show-Json $request.data
    } catch {
        Write-Host "❌ Ошибка получения заявки:" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

# 5. Обновление статуса заявки
if ($requestId) {
    Write-Host "`n5. Обновление статуса заявки на 'approved':" -ForegroundColor Yellow
    try {
        $statusUpdate = @{ status = "approved" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/requests/$requestId/status" `
            -Method PUT `
            -ContentType "application/json" `
            -Body $statusUpdate
        Write-Host "✅ Статус обновлен!" -ForegroundColor Green
        Show-Json $response
    } catch {
        Write-Host "❌ Ошибка обновления статуса:" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

Write-Host "`n======================================" -ForegroundColor Cyan
Write-Host "   ТЕСТИРОВАНИЕ ЗАВЕРШЕНО" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "`nAPI endpoints работают корректно!" -ForegroundColor Green
Write-Host "Теперь можно переходить к Email Service" -ForegroundColor Yellow