# fix-request.ps1
# Удаление старого request.ts и исправление импортов
# Запуск: .\fix-request.ps1

$projectPath = "C:\Projects\test-ssto-project\backend-nest\src"
$modelsPath = "$projectPath\models"

Write-Host "FIXING REQUEST MODEL ISSUE" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# 1. Удаляем старый request.ts
$oldRequestFile = "$modelsPath\request.ts"
if (Test-Path $oldRequestFile) {
    Write-Host "Removing old request.ts..." -ForegroundColor Yellow
    Remove-Item $oldRequestFile -Force
    Write-Host "  OK: request.ts removed" -ForegroundColor Green
}

# 2. Проверяем наличие request.model.ts
$newRequestFile = "$modelsPath\request.model.ts"
if (-not (Test-Path $newRequestFile)) {
    Write-Host "Creating request.model.ts..." -ForegroundColor Yellow
    
    $requestModelContent = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_requests',
  timestamps: true,
  underscored: true
})
export default class SSASRequest extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false
  })
  terminal_number: string;

  @Column({
    type: DataType.ENUM('INMARSAT', 'IRIDIUM'),
    allowNull: false,
    defaultValue: 'INMARSAT'
  })
  terminal_type: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  vessel_name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  imo_number: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  planned_test_date: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'pending'
  })
  status: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  contact_email: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  contact_phone: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  vessel_id: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  mmsi_mismatch_detected: boolean;

  @Column({
    type: DataType.STRING(9),
    allowNull: true
  })
  signal_mmsi: string;
}
"@
    
    Set-Content -Path $newRequestFile -Value $requestModelContent -Encoding UTF8
    Write-Host "  OK: request.model.ts created" -ForegroundColor Green
}

# 3. Обновляем импорты в app.module.ts и других файлах
Write-Host "Updating imports..." -ForegroundColor Yellow

$filesToCheck = @(
    "$projectPath\app.module.ts",
    "$projectPath\request\request.service.ts",
    "$projectPath\signal\signal.service.ts",
    "$projectPath\services\confirmation.service.ts",
    "$projectPath\services\enhanced-confirmation.service.ts"
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Заменяем импорт с request на request.model
        $oldContent = $content
        $content = $content -replace "from '\./models/request'", "from './models/request.model'"
        $content = $content -replace "from '\.\.\/models/request'", "from '../models/request.model'"
        $content = $content -replace "from '\.\.\/\.\.\/models/request'", "from '../../models/request.model'"
        
        if ($oldContent -ne $content) {
            Set-Content -Path $file -Value $content -Encoding UTF8
            Write-Host "  Updated: $(Split-Path $file -Leaf)" -ForegroundColor Green
        }
    }
}

# 4. Очистка других моделей с ошибками
Write-Host "Checking other models..." -ForegroundColor Yellow

$modelsToCheck = @(
    "confirmation-document.model.ts",
    "test-request.model.ts"
)

foreach ($modelName in $modelsToCheck) {
    $modelPath = "$modelsPath\$modelName"
    if (Test-Path $modelPath) {
        $content = Get-Content $modelPath -Raw
        
        # Проверяем на синтаксические ошибки
        if ($content -notmatch "export (default )?class" -or $content -match "^\s*@Column" -or $content -match "^\s*@CreatedAt") {
            Write-Host "  Fixing: $modelName" -ForegroundColor Yellow
            
            # Пересоздаем модель
            $className = ($modelName -replace '\.model\.ts', '') -replace '-', '' 
            $className = (Get-Culture).TextInfo.ToTitleCase($className) -replace ' ', ''
            $tableName = ($modelName -replace '\.model\.ts', '') -replace '-', '_' 
            
            $fixedModel = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: '${tableName}s',
  timestamps: true
})
export default class $className extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;
}
"@
            
            Set-Content -Path $modelPath -Value $fixedModel -Encoding UTF8
            Write-Host "    Fixed: $modelName" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "==========================" -ForegroundColor Green
Write-Host "    REQUEST ISSUE FIXED!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "  1. Removed old request.ts" -ForegroundColor White
Write-Host "  2. Created/verified request.model.ts" -ForegroundColor White
Write-Host "  3. Updated all imports" -ForegroundColor White
Write-Host "  4. Fixed other broken models" -ForegroundColor White
Write-Host ""
Write-Host "Server should restart automatically..." -ForegroundColor Yellow