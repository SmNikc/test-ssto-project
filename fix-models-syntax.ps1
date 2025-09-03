# fix-models-syntax.ps1
# Исправление синтаксических ошибок в моделях
# Запуск: .\fix-models-syntax.ps1

$modelsPath = "C:\Projects\test-ssto-project\backend-nest\src\models"

Write-Host "FIXING SYNTAX ERRORS IN MODELS" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host ""

# Список моделей с ошибками
$brokenModels = @(
    "confirmation-document.model.ts",
    "request.ts", 
    "signal.model.ts",
    "test-request.model.ts"
)

Write-Host "Fixing broken models..." -ForegroundColor Yellow

foreach ($modelFile in $brokenModels) {
    $fullPath = Join-Path $modelsPath $modelFile
    
    if (Test-Path $fullPath) {
        Write-Host "  Checking: $modelFile" -ForegroundColor White
        
        # Создаем бэкап
        $backupPath = "$fullPath.backup_syntax_$(Get-Date -Format 'HHmmss')"
        Copy-Item -Path $fullPath -Destination $backupPath
        
        # Читаем содержимое
        $content = Get-Content $fullPath -Raw
        
        # Проверяем на обрезанный класс (отсутствие export class)
        if ($content -notmatch "export (default )?class") {
            Write-Host "    ERROR: Class declaration missing!" -ForegroundColor Red
            
            # Пытаемся восстановить структуру класса
            $className = switch ($modelFile) {
                "confirmation-document.model.ts" { "ConfirmationDocument" }
                "request.ts" { "SSASRequest" }
                "signal.model.ts" { "Signal" }
                "test-request.model.ts" { "TestRequest" }
                default { "Model" }
            }
            
            # Если файл начинается с @Column без класса, добавляем обертку
            if ($content -match "^\s*@Column") {
                $fixedContent = @"
import { Table, Column, Model, DataType, CreatedAt, UpdatedAt } from 'sequelize-typescript';

@Table({
  tableName: '$(($modelFile -replace '\.model\.ts|\.ts', '') -replace '-', '_')s',
  timestamps: true
})
export default class $className extends Model {
$content
}
"@
                Set-Content -Path $fullPath -Value $fixedContent -Encoding UTF8
                Write-Host "    FIXED: Added class wrapper" -ForegroundColor Green
            }
        } else {
            # Проверяем на незакрытые декораторы
            $openBraces = ($content.ToCharArray() | Where-Object {$_ -eq '{'}).Count
            $closeBraces = ($content.ToCharArray() | Where-Object {$_ -eq '}'}).Count
            
            if ($openBraces -ne $closeBraces) {
                Write-Host "    ERROR: Unbalanced braces ({: $openBraces, }: $closeBraces)" -ForegroundColor Red
                
                # Добавляем недостающие закрывающие скобки
                $diff = $openBraces - $closeBraces
                if ($diff -gt 0) {
                    $content += "`n" + ("}" * $diff)
                    Set-Content -Path $fullPath -Value $content -Encoding UTF8
                    Write-Host "    FIXED: Added $diff closing braces" -ForegroundColor Green
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Creating clean minimal models..." -ForegroundColor Yellow

# Создаем чистые минимальные модели
$cleanModels = @{
    "signal.model.ts" = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_signals',
  timestamps: true
})
export default class Signal extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  terminal_number: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  signal_type: string;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  received_at: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UNMATCHED'
  })
  status: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  request_id: number;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  coordinates: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  metadata: any;
}
"@
    "request.model.ts" = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_requests',
  timestamps: true
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
    type: DataType.INTEGER,
    allowNull: true
  })
  vessel_id: number;
}
"@
    "confirmation-document.model.ts" = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'confirmation_documents',
  timestamps: true
})
export default class ConfirmationDocument extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  signal_id: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  request_id: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  pdf_content: string;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  pdf_path: string;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  sent_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  sent_to: string;
}
"@
    "test-request.model.ts" = @"
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'test_requests',
  timestamps: true
})
export default class TestRequest extends Model {
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
    type: DataType.DATE,
    allowNull: false
  })
  test_date: Date;

  @Column({
    type: DataType.STRING,
    defaultValue: 'pending'
  })
  status: string;
}
"@
}

# Заменяем сломанные модели на чистые
foreach ($modelName in $cleanModels.Keys) {
    $modelPath = Join-Path $modelsPath $modelName
    Set-Content -Path $modelPath -Value $cleanModels[$modelName] -Encoding UTF8
    Write-Host "  Created clean: $modelName" -ForegroundColor Green
}

# Если есть request.ts, переименовываем в request.model.ts
$oldRequestPath = Join-Path $modelsPath "request.ts"
$newRequestPath = Join-Path $modelsPath "request.model.ts"
if ((Test-Path $oldRequestPath) -and (-not (Test-Path $newRequestPath))) {
    Move-Item -Path $oldRequestPath -Destination $newRequestPath -Force
    Write-Host "  Renamed: request.ts -> request.model.ts" -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host "    MODELS SYNTAX FIXED!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "All models recreated with correct syntax" -ForegroundColor Cyan
Write-Host "Server should restart automatically..." -ForegroundColor Yellow