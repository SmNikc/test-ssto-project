# test-confirmation-cycle.ps1
# Полный тестовый сценарий для проверки отправки подтверждений по закрытым заявкам

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   ТЕСТИРОВАНИЕ ОТПРАВКИ ПОДТВЕРЖДЕНИЙ ССТО" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"

# ========================================
# ЭТАП 1: ПРОВЕРКА СЕРВЕРА
# ========================================
Write-Host "`n📡 ЭТАП 1: Проверка доступности сервера..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Сервер доступен" -ForegroundColor Green
} catch {
    Write-Host "❌ Сервер недоступен! Запустите: npm run start:dev" -ForegroundColor Red
    exit 1
}

# ========================================
# ЭТАП 2: ПОЛУЧЕНИЕ СУЩЕСТВУЮЩИХ ЗАЯВОК
# ========================================
Write-Host "`n📋 ЭТАП 2: Получение списка заявок..." -ForegroundColor Yellow
try {
    $requests = Invoke-RestMethod -Uri "$baseUrl/requests" -Method GET
    $totalRequests = $requests.data.Count
    Write-Host "✅ Найдено заявок: $totalRequests" -ForegroundColor Green
    
    # Фильтруем закрытые заявки (со связанными сигналами)
    $matchedRequests = $requests.data | Where-Object { 
        $_.status -eq "completed" -or $_.signal_id -ne $null 
    }
    
    if ($matchedRequests.Count -eq 0) {
        Write-Host "⚠️ Нет закрытых заявок. Создаем тестовые..." -ForegroundColor Yellow
        $createNew = $true
    } else {
        Write-Host "✅ Найдено закрытых заявок: $($matchedRequests.Count)" -ForegroundColor Green
        
        # Показываем закрытые заявки
        Write-Host "`nЗакрытые заявки:" -ForegroundColor Cyan
        foreach ($req in $matchedRequests) {
            Write-Host "  ID: $($req.id) | Судно: $($req.vessel_name) | MMSI: $($req.mmsi) | Email: $($req.contact_email)"
        }
    }
} catch {
    Write-Host "❌ Ошибка получения заявок: $_" -ForegroundColor Red
    $createNew = $true
}

# ========================================
# ЭТАП 3: СОЗДАНИЕ ТЕСТОВЫХ ДАННЫХ (если нужно)
# ========================================
if ($createNew) {
    Write-Host "`n🔨 ЭТАП 3: Создание тестовых данных..." -ForegroundColor Yellow
    
    # Создаем 2 тестовые заявки
    $testRequests = @(
        @{
            vessel_name = "МВ Капитан Иванов"
            mmsi = "273456789"
            imo = "IMO9234567"
            ship_owner = "ООО Судоходная Компания"
            contact_email = "test1@example.com"  # Замените на реальный email!
            contact_phone = "+7 999 111-22-33"
            test_date = (Get-Date).AddHours(1).ToString("yyyy-MM-ddTHH:mm:ssZ")
            test_window_hours = 2
            inmarsat_number = "427309676"
        },
        @{
            vessel_name = "ТХ Полярная Звезда"
            mmsi = "273789012"
            imo = "IMO9345678"
            ship_owner = "АО Морской Флот"
            contact_email = "test2@example.com"  # Замените на реальный email!
            contact_phone = "+7 999 333-44-55"
            test_date = (Get-Date).AddHours(2).ToString("yyyy-MM-ddTHH:mm:ssZ")
            test_window_hours = 2
            inmarsat_number = "427309677"
        }
    )
    
    $createdRequests = @()
    foreach ($reqData in $testRequests) {
        try {
            Write-Host "  Создаем заявку для судна: $($reqData.vessel_name)..." -NoNewline
            $json = $reqData | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "$baseUrl/requests" `
                -Method POST `
                -ContentType "application/json" `
                -Body $json
            
            $createdRequests += $response.data
            Write-Host " ✅ ID: $($response.data.id)" -ForegroundColor Green
        } catch {
            Write-Host " ❌ Ошибка: $_" -ForegroundColor Red
        }
    }
    
    # Создаем сигналы для заявок
    Write-Host "`n  Создание сигналов для заявок..." -ForegroundColor Yellow
    foreach ($req in $createdRequests) {
        $signalData = @{
            mmsi = $req.mmsi
            signal_type = "TEST"
            coordinates = @{
                lat = 43.08
                lon = 131.86
            }
            received_at = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            raw_message = "Test SSAS signal for $($req.vessel_name)"
        } | ConvertTo-Json
        
        try {
            Write-Host "  Создаем сигнал для MMSI: $($req.mmsi)..." -NoNewline
            $signal = Invoke-RestMethod -Uri "$baseUrl/signals" `
                -Method POST `
                -ContentType "application/json" `
                -Body $signalData
            Write-Host " ✅" -ForegroundColor Green
        } catch {
            Write-Host " ❌" -ForegroundColor Red
        }
    }
    
    $matchedRequests = $createdRequests
}

# ========================================
# ЭТАП 4: ОТПРАВКА ПОДТВЕРЖДЕНИЙ
# ========================================
Write-Host "`n📧 ЭТАП 4: Отправка подтверждений..." -ForegroundColor Yellow

# Проверяем настройки SMTP
Write-Host "  Проверка SMTP конфигурации..." -ForegroundColor Cyan
try {
    $smtpTest = Invoke-RestMethod -Uri "$baseUrl/test/smtp" -Method GET -ErrorAction SilentlyContinue
    Write-Host "  ✅ SMTP настроен" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ SMTP тест недоступен, продолжаем..." -ForegroundColor Yellow
}

# Отправляем подтверждения для каждой закрытой заявки
$successCount = 0
$errorCount = 0

foreach ($request in $matchedRequests) {
    Write-Host "`n  Обработка заявки ID: $($request.id)" -ForegroundColor Cyan
    Write-Host "    Судно: $($request.vessel_name)"
    Write-Host "    MMSI: $($request.mmsi)"
    Write-Host "    Email: $($request.contact_email)"
    
    # Формируем запрос на отправку подтверждения
    $confirmationData = @{
        request_id = $request.id
        send_email = $true
        generate_pdf = $true
    } | ConvertTo-Json
    
    try {
        Write-Host "    📨 Отправка подтверждения..." -NoNewline
        
        # Вариант 1: Через endpoint подтверждений
        $confirmUrl = "$baseUrl/requests/$($request.id)/send-confirmation"
        $result = Invoke-RestMethod -Uri $confirmUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $confirmationData `
            -ErrorAction SilentlyContinue
        
        if ($result) {
            Write-Host " ✅ Отправлено!" -ForegroundColor Green
            $successCount++
        } else {
            # Вариант 2: Через обновление статуса (триггерит отправку)
            $statusData = @{ 
                status = "completed"
                send_confirmation = $true 
            } | ConvertTo-Json
            
            $result = Invoke-RestMethod -Uri "$baseUrl/requests/$($request.id)/status" `
                -Method PUT `
                -ContentType "application/json" `
                -Body $statusData
            
            Write-Host " ✅ Отправлено через статус!" -ForegroundColor Green
            $successCount++
        }
    } catch {
        Write-Host " ❌ Ошибка: $_" -ForegroundColor Red
        $errorCount++
    }
}

# ========================================
# ЭТАП 5: ПРОВЕРКА РЕЗУЛЬТАТОВ
# ========================================
Write-Host "`n🔍 ЭТАП 5: Проверка результатов..." -ForegroundColor Yellow

# Проверяем логи отправки
try {
    $logs = Invoke-RestMethod -Uri "$baseUrl/logs?type=email" -Method GET -ErrorAction SilentlyContinue
    if ($logs.data) {
        Write-Host "  Последние отправки email:" -ForegroundColor Cyan
        $logs.data | Select-Object -First 5 | ForEach-Object {
            Write-Host "    [$($_.created_at)] $($_.message)"
        }
    }
} catch {
    Write-Host "  ℹ️ Логи недоступны" -ForegroundColor Gray
}

# ========================================
# ИТОГОВАЯ СТАТИСТИКА
# ========================================
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "                    РЕЗУЛЬТАТЫ ТЕСТА" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan

Write-Host "📊 Статистика:" -ForegroundColor Cyan
Write-Host "  • Обработано заявок: $($matchedRequests.Count)" -ForegroundColor White
Write-Host "  • Отправлено подтверждений: $successCount" -ForegroundColor Green
Write-Host "  • Ошибок отправки: $errorCount" -ForegroundColor $(if ($errorCount -gt 0) { "Red" } else { "Gray" })

Write-Host "`n📋 Что проверить:" -ForegroundColor Yellow
Write-Host "  1. Проверьте указанные email адреса"
Write-Host "  2. Проверьте папку 'Спам'"
Write-Host "  3. Проверьте логи сервера в консоли"
Write-Host "  4. Проверьте папку с PDF: backend-nest/temp/"

Write-Host "`n💡 Советы по отладке:" -ForegroundColor Cyan
Write-Host "  • Если письма не приходят - проверьте SMTP настройки в .env"
Write-Host "  • Используйте реальные email адреса для тестирования"
Write-Host "  • Для Gmail может потребоваться 'пароль приложения'"
Write-Host "  • Для Mail.ru включите 'Пароль для внешних приложений'"

# ========================================
# ДОПОЛНИТЕЛЬНЫЕ ТЕСТЫ
# ========================================
Write-Host "`n🔧 Дополнительные команды для тестирования:" -ForegroundColor Yellow
Write-Host @"

# Прямой тест отправки email:
`$emailTest = @{
    to = "your_email@gmail.com"
    subject = "Test SSTO"
    text = "Test message"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/test/email" ``
    -Method POST ``
    -ContentType "application/json" ``
    -Body `$emailTest

# Получить конкретную заявку:
Invoke-RestMethod -Uri "$baseUrl/requests/1"

# Сгенерировать PDF без отправки:
Invoke-RestMethod -Uri "$baseUrl/requests/1/generate-pdf" -Method POST
"@

Write-Host "`n✨ Тестирование завершено!" -ForegroundColor Green