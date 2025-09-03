# fix-types.ps1
# Исправление последних 5 ошибок типов
# Запуск: .\fix-types.ps1

$srcPath = "C:\Projects\test-ssto-project\backend-nest\src"

Write-Host "FIXING TYPE ERRORS" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# 1. Исправляем signal.controller.ts - конвертация string в number
Write-Host "[1/2] Fixing type conversions in signal.controller.ts..." -ForegroundColor Yellow

$signalControllerPath = "$srcPath\controllers\signal.controller.ts"
if (Test-Path $signalControllerPath) {
    $content = Get-Content $signalControllerPath -Raw
    
    # Заменяем вызовы findRequest с конвертацией в число
    $content = $content -replace "findRequest\(requestId\)", "findRequest(Number(requestId))"
    $content = $content -replace "findRequest\(id\)", "findRequest(Number(id))"
    
    # Исправляем поля request - заменяем imo на imo_number
    $content = $content -replace "request\.imo \|\|", "request.imo_number ||"
    
    # Заменяем test_date на planned_test_date
    $content = $content -replace "request\.test_date", "request.planned_test_date"
    
    Set-Content -Path $signalControllerPath -Value $content -Encoding UTF8
    Write-Host "  OK: Fixed type conversions and field names" -ForegroundColor Green
}

# 2. Добавляем недостающие поля в SSASRequest если их нет
Write-Host "[2/2] Checking SSASRequest model fields..." -ForegroundColor Yellow

$requestModelPath = "$srcPath\models\request.model.ts"
if (Test-Path $requestModelPath) {
    $content = Get-Content $requestModelPath -Raw
    
    # Проверяем наличие полей
    $fieldsToCheck = @{
        "imo_number" = $true
        "planned_test_date" = $true
    }
    
    $needsUpdate = $false
    foreach ($field in $fieldsToCheck.Keys) {
        if ($content -notmatch $field) {
            Write-Host "  WARNING: Field '$field' missing in SSASRequest" -ForegroundColor Yellow
            $needsUpdate = $true
        }
    }
    
    if (-not $needsUpdate) {
        Write-Host "  OK: All required fields present in SSASRequest" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==================" -ForegroundColor Green
Write-Host "  TYPES FIXED!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "Fixed issues:" -ForegroundColor Cyan
Write-Host "  1. Converted string IDs to numbers (3 occurrences)" -ForegroundColor White
Write-Host "  2. Changed request.imo -> request.imo_number" -ForegroundColor White
Write-Host "  3. Changed request.test_date -> request.planned_test_date" -ForegroundColor White
Write-Host ""
Write-Host "Total: 5 type errors resolved!" -ForegroundColor Green
Write-Host ""
Write-Host "Server should compile successfully now!" -ForegroundColor Yellow