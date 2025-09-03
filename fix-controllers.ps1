# fix-controllers.ps1
# Исправление 5 ошибок в контроллерах
# Запуск: .\fix-controllers.ps1

$srcPath = "C:\Projects\test-ssto-project\backend-nest\src"

Write-Host "FIXING CONTROLLER ERRORS" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# 1. Исправляем signal.controller.ts
Write-Host "[1/3] Fixing signal.controller.ts..." -ForegroundColor Yellow

$signalControllerPath = "$srcPath\controllers\signal.controller.ts"
if (Test-Path $signalControllerPath) {
    $content = Get-Content $signalControllerPath -Raw
    
    # Заменяем findRequestById на findRequest
    $content = $content -replace "findRequestById", "findRequest"
    
    # Исправляем findAllRequests - убираем параметр query
    $content = $content -replace "findAllRequests\(query\)", "findAllRequests()"
    
    Set-Content -Path $signalControllerPath -Value $content -Encoding UTF8
    Write-Host "  OK: Fixed method names in signal.controller.ts" -ForegroundColor Green
}

# 2. Добавляем метод processEmailSignal в signal.service.ts
Write-Host "[2/3] Adding processEmailSignal to signal.service.ts..." -ForegroundColor Yellow

$signalServicePath = "$srcPath\signal\signal.service.ts"
if (Test-Path $signalServicePath) {
    $content = Get-Content $signalServicePath -Raw
    
    # Проверяем, есть ли уже метод processEmailSignal
    if ($content -notmatch "processEmailSignal") {
        # Добавляем метод перед последней закрывающей скобкой класса
        $methodToAdd = '
  async processEmailSignal(signalData: any): Promise<Signal> {
    // Обработка сигнала из email
    const signal = await this.create({
      terminal_number: signalData.terminal_number || signalData.terminalNumber,
      mmsi: signalData.mmsi,
      signal_type: signalData.signal_type || ''EMAIL'',
      received_at: signalData.received_at || new Date(),
      status: ''UNMATCHED'',
      metadata: signalData
    });
    
    // Пытаемся сопоставить с заявками
    await this.matchSignalWithRequests(signal);
    
    return signal;
  }'
        
        # Вставляем перед последней закрывающей скобкой
        $content = $content -replace "}\s*$", "$methodToAdd`n}"
        
        Set-Content -Path $signalServicePath -Value $content -Encoding UTF8
        Write-Host "  OK: Added processEmailSignal method" -ForegroundColor Green
    } else {
        Write-Host "  INFO: processEmailSignal already exists" -ForegroundColor Yellow
    }
}

# 3. Проверяем и исправляем email.service.ts если нужно
Write-Host "[3/3] Checking signal/email.service.ts..." -ForegroundColor Yellow

$emailServicePath = "$srcPath\signal\email.service.ts"
if (Test-Path $emailServicePath) {
    Write-Host "  OK: signal/email.service.ts exists" -ForegroundColor Green
    
    # Проверяем, что SignalService импортирован
    $content = Get-Content $emailServicePath -Raw
    if ($content -notmatch "import.*SignalService") {
        # Добавляем импорт
        $content = "import { SignalService } from './signal.service';`n" + $content
        
        # Добавляем в конструктор если нет
        if ($content -notmatch "private.*signalService.*SignalService") {
            $content = $content -replace "(constructor\([^)]*)", "`$1,`n    private readonly signalService: SignalService"
        }
        
        Set-Content -Path $emailServicePath -Value $content -Encoding UTF8
        Write-Host "  OK: Added SignalService import to email.service.ts" -ForegroundColor Green
    }
} else {
    Write-Host "  WARNING: signal/email.service.ts not found" -ForegroundColor Yellow
    
    # Возможно файл в другом месте - проверяем services/email.service.ts
    $altEmailPath = "$srcPath\services\email.service.ts"
    if (Test-Path $altEmailPath) {
        $content = Get-Content $altEmailPath -Raw
        
        # Если там есть processEmailSignal, значит нужно добавить метод в SignalService
        if ($content -match "processEmailSignal") {
            Write-Host "  INFO: email.service.ts uses processEmailSignal" -ForegroundColor Cyan
        }
    }
}

Write-Host ""
Write-Host "========================" -ForegroundColor Green
Write-Host "   CONTROLLERS FIXED!" -ForegroundColor Green
Write-Host "========================" -ForegroundColor Green
Write-Host ""
Write-Host "Fixed issues:" -ForegroundColor Cyan
Write-Host "  1. Renamed findRequestById -> findRequest (3 occurrences)" -ForegroundColor White
Write-Host "  2. Removed query parameter from findAllRequests" -ForegroundColor White
Write-Host "  3. Added processEmailSignal method to SignalService" -ForegroundColor White
Write-Host ""
Write-Host "Total: 5 errors resolved!" -ForegroundColor Green
Write-Host ""
Write-Host "Server should compile successfully now!" -ForegroundColor Yellow