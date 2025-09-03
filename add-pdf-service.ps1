# add-pdf-service.ps1
# Добавление PdfService в проект
# Запуск: .\add-pdf-service.ps1

$srcPath = "C:\Projects\test-ssto-project\backend-nest\src"

Write-Host "ADDING PDF SERVICE" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

# 1. Создаем PdfService если его нет
Write-Host "[1/2] Creating PdfService..." -ForegroundColor Yellow

$pdfServicePath = "$srcPath\services\pdf.service.ts"
if (-not (Test-Path $pdfServicePath)) {
    $pdfServiceContent = 'import { Injectable } from ''@nestjs/common'';

@Injectable()
export class PdfService {
  async generatePDF(data: any): Promise<Buffer> {
    // Простая реализация для генерации PDF
    const pdfContent = `
      ПОДТВЕРЖДЕНИЕ ТЕСТА ССТО
      ========================
      
      Терминал: ${data.terminal_number || ''N/A''}
      MMSI: ${data.mmsi || ''N/A''}
      Судно: ${data.vessel_name || ''N/A''}
      Дата: ${new Date().toLocaleDateString(''ru-RU'')}
      
      Статус: ПОДТВЕРЖДЕНО
    `;
    
    // Возвращаем как Buffer (в реальном проекте использовать pdfkit или puppeteer)
    return Buffer.from(pdfContent, ''utf-8'');
  }
  
  async generateConfirmationPDF(request: any, signal: any): Promise<Buffer> {
    const data = {
      terminal_number: request?.terminal_number || signal?.terminal_number,
      mmsi: request?.mmsi || signal?.mmsi,
      vessel_name: request?.vessel_name,
      test_date: signal?.received_at || new Date(),
      signal_type: signal?.signal_type || ''TEST'',
      coordinates: signal?.coordinates,
      status: ''CONFIRMED''
    };
    
    return this.generatePDF(data);
  }
  
  async generateReportPDF(reportData: any): Promise<Buffer> {
    const reportContent = `
      ОТЧЕТ ПО ТЕСТИРОВАНИЮ ССТО
      ==========================
      
      Период: ${reportData.startDate} - ${reportData.endDate}
      Всего тестов: ${reportData.totalTests || 0}
      Успешных: ${reportData.successfulTests || 0}
      
      Детали:
      ${JSON.stringify(reportData.details || {}, null, 2)}
    `;
    
    return Buffer.from(reportContent, ''utf-8'');
  }
}'
    
    # Создаем папку services если её нет
    $servicesPath = "$srcPath\services"
    if (-not (Test-Path $servicesPath)) {
        New-Item -ItemType Directory -Path $servicesPath -Force | Out-Null
    }
    
    Set-Content -Path $pdfServicePath -Value $pdfServiceContent -Encoding UTF8
    Write-Host "  OK: PdfService created" -ForegroundColor Green
} else {
    Write-Host "  INFO: PdfService already exists" -ForegroundColor Yellow
}

# 2. Добавляем PdfService в app.module.ts
Write-Host "[2/2] Adding PdfService to app.module.ts..." -ForegroundColor Yellow

$appModulePath = "$srcPath\app.module.ts"
$appContent = Get-Content $appModulePath -Raw

# Проверяем, есть ли уже PdfService
if ($appContent -notmatch "PdfService") {
    # Добавляем импорт
    $importLine = "import { PdfService } from './services/pdf.service';"
    $appContent = $appContent -replace "(import.*SignalService.*)", "`$1`n$importLine"
    
    # Добавляем в providers
    $appContent = $appContent -replace "(providers:\s*\[)", "`$1`n    PdfService,"
    
    Set-Content -Path $appModulePath -Value $appContent -Encoding UTF8
    Write-Host "  OK: PdfService added to app.module.ts" -ForegroundColor Green
} else {
    Write-Host "  INFO: PdfService already in app.module.ts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================" -ForegroundColor Green
Write-Host " PDF SERVICE ADDED!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "PdfService is now available for dependency injection" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server should start successfully now!" -ForegroundColor Yellow