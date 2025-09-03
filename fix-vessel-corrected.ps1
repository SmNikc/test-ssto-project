# fix-vessel-corrected.ps1
# Исправление ошибки с VesselRepository
# Запуск: .\fix-vessel-corrected.ps1

$projectPath = "C:\Projects\test-ssto-project\backend-nest\src"

Write-Host "FIXING VesselRepository DEPENDENCY" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create Vessel model
Write-Host "[1/3] Creating Vessel model..." -ForegroundColor Yellow

$vesselModelContent = @"
import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';

@Table({
  tableName: 'vessels',
  timestamps: true,
  underscored: true
})
export class Vessel extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true
  })
  id: number;

  @Column({
    type: DataType.STRING(9),
    allowNull: false,
    unique: true
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  imo_number: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  call_sign: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  vessel_type: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true
  })
  flag: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  length: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true
  })
  width: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;
}

export default Vessel;
"@

$vesselPath = "$projectPath\models\vessel.model.ts"
Set-Content -Path $vesselPath -Value $vesselModelContent -Encoding UTF8
Write-Host "  OK: vessel.model.ts created" -ForegroundColor Green

# 2. Update app.module.ts
Write-Host "[2/3] Updating app.module.ts..." -ForegroundColor Yellow

$appModulePath = "$projectPath\app.module.ts"
$appContent = Get-Content $appModulePath -Raw

# Add import if not exists
if ($appContent -notmatch "import.*Vessel.*from") {
    # Find position after other model imports
    $importPosition = $appContent.IndexOf("import Signal from")
    if ($importPosition -gt 0) {
        $nextLine = $appContent.IndexOf("`n", $importPosition) + 1
        $appContent = $appContent.Insert($nextLine, "import Vessel from './models/vessel.model';`n")
    }
}

# Add to models array in SequelizeModule.forRoot
$modelsPattern = "models:\s*\[([^\]]+)\]"
if ($appContent -match $modelsPattern) {
    $modelsContent = $matches[1]
    if ($modelsContent -notmatch "Vessel") {
        $newModelsContent = $modelsContent.TrimEnd() + ",`n          Vessel"
        $appContent = $appContent -replace $modelsPattern, "models: [$newModelsContent`n        ]"
    }
}

# Add to SequelizeModule.forFeature
$featurePattern = "SequelizeModule\.forFeature\(\[([^\]]+)\]\)"
if ($appContent -match $featurePattern) {
    $featuresContent = $matches[1]
    if ($featuresContent -notmatch "Vessel") {
        $newFeaturesContent = $featuresContent.TrimEnd() + ",`n      Vessel"
        $appContent = $appContent -replace $featurePattern, "SequelizeModule.forFeature([$newFeaturesContent`n    ])"
    }
}

Set-Content -Path $appModulePath -Value $appContent -Encoding UTF8
Write-Host "  OK: Vessel added to app.module.ts" -ForegroundColor Green

# 3. Fix SignalService to make Vessel optional
Write-Host "[3/3] Fixing SignalService..." -ForegroundColor Yellow

$signalServicePath = "$projectPath\signal\signal.service.ts"

if (Test-Path $signalServicePath) {
    $serviceContent = Get-Content $signalServicePath -Raw
    
    # Check if VesselRepository is used
    if ($serviceContent -match "vesselRepository") {
        # Make it optional
        if ($serviceContent -notmatch "@Optional") {
            # Add Optional import
            if ($serviceContent -notmatch "import.*Optional") {
                $serviceContent = $serviceContent -replace "(import.*Injectable[^;]*;)", "`$1`nimport { Optional } from '@nestjs/common';"
            }
            
            # Make repository optional in constructor
            $serviceContent = $serviceContent -replace "(@InjectRepository\(Vessel\))", "@InjectRepository(Vessel) @Optional()"
            $serviceContent = $serviceContent -replace "(private vesselRepository: Repository<Vessel>)", "private vesselRepository?: Repository<Vessel>"
        }
        
        Set-Content -Path $signalServicePath -Value $serviceContent -Encoding UTF8
        Write-Host "  OK: SignalService fixed" -ForegroundColor Green
    } else {
        Write-Host "  INFO: VesselRepository not used in SignalService" -ForegroundColor Yellow
    }
} else {
    Write-Host "  WARNING: signal.service.ts not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Green
Write-Host "         FIX COMPLETED!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host ""
Write-Host "Created: Vessel model" -ForegroundColor Green
Write-Host "Updated: app.module.ts" -ForegroundColor Green
Write-Host "Fixed: SignalService (Vessel optional)" -ForegroundColor Green
Write-Host ""
Write-Host "Server should restart automatically..." -ForegroundColor Cyan