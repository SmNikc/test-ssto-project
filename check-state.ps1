# check-state.ps1
# Check current project state after GitHub restore
# Run: powershell -ExecutionPolicy Bypass -File check-state.ps1

$projectPath = "C:\Projects\test-ssto-project"
$backendPath = "$projectPath\backend-nest\src"
$frontendPath = "$projectPath\frontend\src"

Write-Host "CHECK PROJECT STATE" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White
Write-Host ""

# Check critical files
Write-Host "CHECKING CRITICAL FILES:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

$criticalFiles = @{
    "Backend" = @{
        "app.module.ts" = "$backendPath\app.module.ts"
        "main.ts" = "$backendPath\main.ts"
        ".env" = "$projectPath\backend-nest\.env"
        "package.json" = "$projectPath\backend-nest\package.json"
    }
    "Models" = @{
        "signal.model.ts" = "$backendPath\models\signal.model.ts"
        "request.model.ts" = "$backendPath\models\request.model.ts"
        "ssas-terminal.entity.ts" = "$backendPath\models\ssas-terminal.entity.ts"
        "system-settings.entity.ts" = "$backendPath\models\system-settings.entity.ts"
    }
    "Services" = @{
        "signal.service.ts" = "$backendPath\signal\signal.service.ts"
        "request.service.ts" = "$backendPath\request\request.service.ts"
        "confirmation.service.ts" = "$backendPath\services\confirmation.service.ts"
        "email.service.ts" = "$backendPath\services\email.service.ts"
        "pdf.service.ts" = "$backendPath\pdf\pdf.service.ts"
        "imap.service.ts" = "$backendPath\imap\imap.service.ts"
    }
    "Frontend Components" = @{
        "App.tsx" = "$frontendPath\App.tsx"
        "SignalTable.tsx" = "$frontendPath\components\SignalTable.tsx"
        "MapComponent.tsx" = "$frontendPath\components\MapComponent.tsx"
        "ConfirmationPreview.tsx" = "$frontendPath\components\ConfirmationPreview.tsx"
    }
}

$fileStatus = @{}
$missingCount = 0
$foundCount = 0

foreach ($category in $criticalFiles.Keys) {
    Write-Host "`n${category}:" -ForegroundColor Cyan
    
    foreach ($fileName in $criticalFiles[$category].Keys) {
        $filePath = $criticalFiles[$category][$fileName]
        
        if (Test-Path $filePath) {
            $fileSize = (Get-Item $filePath).Length
            $lastModified = (Get-Item $filePath).LastWriteTime
            
            if ($fileSize -lt 100) {
                Write-Host "  WARNING: $fileName - STUB SUSPECTED (size: $fileSize bytes)" -ForegroundColor Yellow
            } else {
                Write-Host "  OK: $fileName - found ($fileSize bytes, modified: $(Get-Date $lastModified -Format 'dd.MM HH:mm'))" -ForegroundColor Green
                $foundCount++
            }
        } else {
            Write-Host "  MISSING: $fileName - NOT FOUND" -ForegroundColor Red
            $missingCount++
            $fileStatus[$fileName] = "missing"
        }
    }
}

# Check app.module.ts size
Write-Host "`nANALYZING app.module.ts:" -ForegroundColor Yellow
Write-Host "------------------------" -ForegroundColor Yellow

$appModulePath = "$backendPath\app.module.ts"
if (Test-Path $appModulePath) {
    $appModuleContent = Get-Content $appModulePath -Raw
    $appModuleSize = (Get-Item $appModulePath).Length
    $lineCount = (Get-Content $appModulePath).Count
    
    Write-Host "  Size: $appModuleSize bytes" -ForegroundColor White
    Write-Host "  Lines: $lineCount" -ForegroundColor White
    
    # Check important modules
    $importantModules = @(
        "SequelizeModule.forRoot",
        "ConfigModule",
        "ScheduleModule",
        "EmailModule",
        "PdfModule"
    )
    
    Write-Host "`n  Checking important modules:" -ForegroundColor Cyan
    foreach ($module in $importantModules) {
        if ($appModuleContent -match $module) {
            Write-Host "    FOUND: $module" -ForegroundColor Green
        } else {
            Write-Host "    MISSING: $module" -ForegroundColor Red
        }
    }
    
    if ($appModuleSize -lt 2000) {
        Write-Host "`n  WARNING: app.module.ts is suspiciously small!" -ForegroundColor Yellow
        Write-Host "  This might be a reduced version" -ForegroundColor Yellow
    }
}

# Check Git status
Write-Host "`nGIT STATUS:" -ForegroundColor Yellow
Write-Host "-----------" -ForegroundColor Yellow

Set-Location $projectPath
$gitBranch = git branch --show-current 2>$null
$gitStatus = git status --porcelain 2>$null
$lastCommit = git log -1 --pretty=format:"%h - %s (%cr)" 2>$null

Write-Host "  Branch: $gitBranch" -ForegroundColor White
Write-Host "  Last commit: $lastCommit" -ForegroundColor White

if ($gitStatus) {
    Write-Host "  WARNING: Uncommitted changes:" -ForegroundColor Yellow
    $gitStatus | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} else {
    Write-Host "  OK: All changes committed" -ForegroundColor Green
}

# Check if services are running
Write-Host "`nSERVICE STATUS:" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow

# Check backend
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK: Backend is running (port 3000)" -ForegroundColor Green
        $backendRunning = $true
    }
} catch {
    Write-Host "  OFFLINE: Backend not running" -ForegroundColor Red
}

# Check frontend
$frontendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK: Frontend is running (port 5173)" -ForegroundColor Green
        $frontendRunning = $true
    }
} catch {
    Write-Host "  OFFLINE: Frontend not running" -ForegroundColor Red
}

# Final report
Write-Host "`n=======================================" -ForegroundColor Cyan
Write-Host "           FINAL REPORT" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

Write-Host "`nStatistics:" -ForegroundColor Yellow
Write-Host "  Found files: $foundCount" -ForegroundColor $(if ($foundCount -gt 15) { "Green" } else { "Yellow" })
Write-Host "  Missing files: $missingCount" -ForegroundColor $(if ($missingCount -eq 0) { "Green" } else { "Red" })

# Determine project state
$projectState = "UNKNOWN"
$stateColor = "Gray"

if ($missingCount -eq 0 -and $foundCount -gt 20) {
    $projectState = "FULL VERSION"
    $stateColor = "Green"
} elseif ($missingCount -lt 5 -and $foundCount -gt 15) {
    $projectState = "PARTIALLY RESTORED"
    $stateColor = "Yellow"
} elseif ($missingCount -gt 10) {
    $projectState = "REDUCED VERSION"
    $stateColor = "Red"
} else {
    $projectState = "WORKING VERSION"
    $stateColor = "Cyan"
}

Write-Host "`nProject state: " -NoNewline
Write-Host $projectState -ForegroundColor $stateColor

# Recommendations
Write-Host "`nRECOMMENDATIONS:" -ForegroundColor Yellow

if ($missingCount -gt 0) {
    Write-Host "  1. Restore missing files from GitHub" -ForegroundColor White
    Write-Host "  2. Check other branches for full version:" -ForegroundColor White
    Write-Host "     git branch -a" -ForegroundColor Gray
    Write-Host "     git checkout [branch_with_full_version]" -ForegroundColor Gray
}

if (-not $backendRunning) {
    Write-Host "  3. Start backend:" -ForegroundColor White
    Write-Host "     cd backend-nest && npm run start:dev" -ForegroundColor Gray
}

if (-not $frontendRunning) {
    Write-Host "  4. Start frontend:" -ForegroundColor White
    Write-Host "     cd frontend && npm run dev" -ForegroundColor Gray
}

if ($projectState -eq "FULL VERSION" -or $projectState -eq "WORKING VERSION") {
    Write-Host "`nPROJECT READY!" -ForegroundColor Green
    Write-Host "You can add missing features on top of working version" -ForegroundColor Green
} else {
    Write-Host "`nFUNCTIONALITY RESTORATION REQUIRED" -ForegroundColor Yellow
}

# Save report
$reportPath = "$projectPath\STATE_REPORT_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
$reportContent = @"
PROJECT STATE REPORT
====================
Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
State: $projectState
Found files: $foundCount
Missing: $missingCount
Git branch: $gitBranch
Last commit: $lastCommit

MISSING FILES:
"@

foreach ($file in $fileStatus.Keys) {
    if ($fileStatus[$file] -eq "missing") {
        $reportContent += "`n- $file"
    }
}

$reportContent | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "`nReport saved: $reportPath" -ForegroundColor Cyan