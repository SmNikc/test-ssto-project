# Скрипт для исправления структуры проекта Day 2
Write-Host "🔧 Исправление структуры проекта для Day 2" -ForegroundColor Cyan

$projectPath = "C:\Projects\test-ssto-project\backend-nest"
$srcPath = "$projectPath\src"

# Переход в папку проекта
Set-Location $projectPath

# 1. Проверка подключения к БД
Write-Host "`n📊 Проверка подключения к БД..." -ForegroundColor Yellow
if (Test-Path "test-db.js") {
    node test-db.js
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Ошибка подключения к БД! Проверьте .env файл" -ForegroundColor Red
        Write-Host "Проверьте, что:" -ForegroundColor Yellow
        Write-Host "  DB_USER=postgres"
        Write-Host "  DB_PASSWORD=ваш_пароль_от_установки_postgresql"
        Write-Host "  DB_NAME=ssto_test"
        exit 1
    }
} else {
    Write-Host "⚠️ test-db.js не найден, пропускаем проверку БД" -ForegroundColor Yellow
}

# 2. Создание правильной структуры папок
Write-Host "`n📁 Создание структуры папок Day 2..." -ForegroundColor Yellow

$folders = @(
    "$srcPath\models",
    "$srcPath\services", 
    "$srcPath\controllers",
    "$srcPath\dto"
)

foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "✅ Создана папка: $(Split-Path $folder -Leaf)" -ForegroundColor Green
    } else {
        Write-Host "📁 Папка существует: $(Split-Path $folder -Leaf)" -ForegroundColor Gray
    }
}

# 3. Очистка лишних/дублирующих файлов
Write-Host "`n🧹 Очистка лишних файлов..." -ForegroundColor Yellow

# Список файлов, которые могут мешать
$filesToCheck = @(
    "$srcPath\report\report.service.ts",
    "$srcPath\signal\signal.module.ts",
    "$srcPath\controllers\requestController.ts",  # дубликат с маленькой буквы
    "$srcPath\controllers\signalController.ts"    # дубликат с маленькой буквы
)

foreach ($file in $filesToCheck) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "🗑️ Удален лишний файл: $file" -ForegroundColor Yellow
    }
}

# 4. Проверка наличия необходимых файлов Day 2
Write-Host "`n📋 Проверка файлов Day 2..." -ForegroundColor Yellow

$requiredFiles = @{
    "models\request.model.ts" = $false
    "models\signal.model.ts" = $false
    "dto\request.dto.ts" = $false
    "services\request.service.ts" = $false
    "services\email.service.ts" = $false
    "controllers\request.controller.ts" = $false
    "ssto.module.ts" = $false
    "app.module.ts" = $true
}

$missingFiles = @()

foreach ($file in $requiredFiles.Keys) {
    $fullPath = Join-Path $srcPath $file
    if (Test-Path $fullPath) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file - ОТСУТСТВУЕТ" -ForegroundColor Red
        $missingFiles += $file
    }
}

# 5. Установка недостающих пакетов
Write-Host "`n📦 Проверка npm пакетов..." -ForegroundColor Yellow

$packages = @(
    "class-validator",
    "class-transformer",
    "imap",
    "mailparser",
    "@types/imap"
)

$packageJson = Get-Content "package.json" -Raw

foreach ($package in $packages) {
    if ($packageJson -notmatch $package) {
        Write-Host "📥 Устанавливаем $package..." -ForegroundColor Yellow
        npm install $package --save
    } else {
        Write-Host "✅ $package уже установлен" -ForegroundColor Gray
    }
}

# 6. Создание тестового API скрипта
Write-Host "`n📝 Создание тестового скрипта API..." -ForegroundColor Yellow

$testApiScript = @'
// test-api.js - Тестирование CRUD операций Day 2
const http = require('http');

const API_URL = 'http://localhost:3000';

// Проверка здоровья сервера
function checkHealth() {
    return new Promise((resolve) => {
        http.get(`${API_URL}/health`, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Сервер работает:', data);
                    resolve(true);
                } else {
                    console.log('❌ Сервер недоступен');
                    resolve(false);
                }
            });
        }).on('error', (err) => {
            console.log('❌ Ошибка подключения:', err.message);
            resolve(false);
        });
    });
}

// Создание тестовой заявки
function createTestRequest() {
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            vesselName: 'Test Vessel Day 2',
            requesterName: 'Test User',
            requesterEmail: 'test@example.com',
            testDate: '2025-01-20',
            testType: 'combined'
        });

        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/requests',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                    console.log('✅ Заявка создана:', data);
                    resolve(true);
                } else {
                    console.log('❌ Ошибка создания заявки:', res.statusCode, data);
                    resolve(false);
                }
            });
        });

        req.on('error', (err) => {
            console.log('❌ Ошибка запроса:', err.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Тестирование Day 2 API...\n');
    
    const healthOk = await checkHealth();
    if (!healthOk) {
        console.log('\n⚠️ Сервер не запущен. Запустите: npm run start:dev');
        process.exit(1);
    }

    const requestCreated = await createTestRequest();
    
    if (requestCreated) {
        console.log('\n✨ Все тесты пройдены успешно!');
    } else {
        console.log('\n⚠️ Некоторые тесты не прошли. Проверьте файлы.');
    }
}

runTests();
'@

Set-Content -Path "test-api.js" -Value $testApiScript -Encoding UTF8
Write-Host "✅ test-api.js создан" -ForegroundColor Green

# 7. Итоговый отчет
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "           ОТЧЕТ О ПРОВЕРКЕ                " -ForegroundColor White
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan

if ($missingFiles.Count -eq 0) {
    Write-Host "✅ Все файлы Day 2 на месте!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Отсутствуют файлы:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host "`nНеобходимо сохранить файлы из артефактов выше!" -ForegroundColor Yellow
}

Write-Host "`n📋 Следующие шаги:" -ForegroundColor Cyan
Write-Host "1. Сохраните все отсутствующие файлы из артефактов"
Write-Host "2. Запустите сервер: npm run start:dev" 
Write-Host "3. В новом окне: node test-api.js"
Write-Host "4. Проверьте логи сервера на наличие ошибок"

Write-Host "`n💡 Полезные команды:" -ForegroundColor Yellow
Write-Host "cd $projectPath"
Write-Host "npm run start:dev           # Запуск сервера"
Write-Host "node test-db.js            # Тест БД"
Write-Host "node test-api.js           # Тест API"

# Проверка, запущен ли сервер
$nestProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { $_.Path -like "*node*" -an