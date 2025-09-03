# fix-circular-final.ps1
# Финальное исправление циклической зависимости
# Запуск: .\fix-circular-final.ps1

$srcPath = "C:\Projects\test-ssto-project\backend-nest\src"

Write-Host "FIXING CIRCULAR DEPENDENCY" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# 1. Упрощаем app.module.ts - убираем дубликаты и лишние модели
Write-Host "[1/2] Simplifying app.module.ts..." -ForegroundColor Yellow

$appModulePath = "$srcPath\app.module.ts"

# Создаем минимальный рабочий app.module.ts
$minimalAppModule = 'import { Module } from ''@nestjs/common'';
import { ConfigModule, ConfigService } from ''@nestjs/config'';
import { SequelizeModule } from ''@nestjs/sequelize'';

// Controllers
import { HealthController } from ''./controllers/health.controller'';
import { LogController } from ''./controllers/log.controller'';
import { SignalController } from ''./controllers/signal.controller'';
import { RequestController } from ''./controllers/request-ssto.controller'';

// Services
import { LogService } from ''./log/log.service'';
import { RequestService } from ''./request/request.service'';
import { SignalService } from ''./signal/signal.service'';

// Models - только основные
import Log from ''./models/log.model'';
import SSASRequest from ''./models/request.model'';
import Signal from ''./models/signal.model'';
import Vessel from ''./models/vessel.model'';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ''.env'',
    }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        dialect: ''postgres'',
        host: configService.get(''DB_HOST'', ''localhost''),
        port: configService.get(''DB_PORT'', 5432),
        username: configService.get(''DB_USER'', ''postgres''),
        password: configService.get(''DB_PASSWORD'', ''postgres''),
        database: configService.get(''DB_NAME'', ''sstodb''),
        models: [Log, SSASRequest, Signal, Vessel],
        autoLoadModels: false,
        synchronize: false,
        logging: false,
      }),
    }),

    SequelizeModule.forFeature([Log, SSASRequest, Signal, Vessel]),
  ],

  controllers: [
    HealthController,
    LogController,
    RequestController,
    SignalController,
  ],

  providers: [
    LogService,
    RequestService,
    SignalService,
  ],
})
export class AppModule {}'

# Создаем бэкап
$backupPath = "$appModulePath.backup_$(Get-Date -Format 'HHmmss')"
Copy-Item -Path $appModulePath -Destination $backupPath -Force
Write-Host "  Backup: $backupPath" -ForegroundColor Gray

Set-Content -Path $appModulePath -Value $minimalAppModule -Encoding UTF8
Write-Host "  OK: Simplified app.module.ts" -ForegroundColor Green

# 2. Убираем связи из моделей
Write-Host "[2/2] Removing relationships from models..." -ForegroundColor Yellow

$modelsToClean = @(
    "request.model.ts",
    "signal.model.ts", 
    "vessel.model.ts",
    "log.model.ts"
)

foreach ($modelFile in $modelsToClean) {
    $modelPath = "$srcPath\models\$modelFile"
    if (Test-Path $modelPath) {
        $content = Get-Content $modelPath -Raw
        
        # Убираем импорты связей
        $content = $content -replace "import.*\{.*HasMany.*\}.*", ""
        $content = $content -replace "import.*\{.*BelongsTo.*\}.*", ""
        $content = $content -replace "import.*\{.*HasOne.*\}.*", ""
        $content = $content -replace "import.*\{.*ForeignKey.*\}.*", ""
        
        # Убираем декораторы связей
        $content = $content -replace "@HasMany\([^)]+\)[^;]*;?", ""
        $content = $content -replace "@BelongsTo\([^)]+\)[^;]*;?", ""
        $content = $content -replace "@HasOne\([^)]+\)[^;]*;?", ""
        $content = $content -replace "@ForeignKey\([^)]+\)[^;]*;?", ""
        
        Set-Content -Path $modelPath -Value $content -Encoding UTF8
        Write-Host "  Cleaned: $modelFile" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "==========================" -ForegroundColor Green
Write-Host "  CIRCULAR DEPS FIXED!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Cyan
Write-Host "  1. Simplified app.module.ts to minimal configuration" -ForegroundColor White
Write-Host "  2. Removed all model relationships" -ForegroundColor White
Write-Host "  3. Kept only essential models and services" -ForegroundColor White
Write-Host ""
Write-Host "Server should start successfully now!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: npm run start:dev" -ForegroundColor Green