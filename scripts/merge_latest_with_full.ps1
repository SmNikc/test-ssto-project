<# 
  Объединение «новейших» файлов с «полными» версиями для проекта ТЕСТ ССТО.

  Возможности:
    - читает baseline из latest ZIP (или из рабочей копии), опционально сверяет с manifest.csv;
    - дополняет baseline недостающими фрагментами "полных" версий (без перезаписи целиком);
    - точечные патчи:
        * backend-nest\src\services\report.service.ts
            - ensureReportsDirectory()
            - generateTestConfirmation(...) с полной "шапкой" (МИНТРАНС, РОСМОРРЕЧФЛОТ и т.д.)
            - generateForSignal(...) (fallback для сигналов без заявки)
        * backend-nest\src\models\signal.model.ts → поле vessel_name
        * backend-nest\src\signal\signal.module.ts → DI: SignalService (из ../services), ReportService в providers/exports
        * frontend\src\contexts\AuthContext.tsx → единый /api, удаление хардкодов http://localhost
        * frontend\src\components\auth.component.tsx → единый /api
        * vite.config.ts → proxy /api → :3001 (dev)
        * nginx.conf → location /api → http://backend:3001; (дубли nginx*.conf удаляются)
        * frontend\src\config.js → тонкий "shim" (если есть старые импорты config.js)
    - вычищает параллельную копию бэкенда: frontend-static\backend-nest\** (перенос в backup)
    - чинит импорты: ./contexts/AuthContext → ../contexts/AuthContext в src/pages/** и src/components/**
    - создаёт отчёт об изменениях.

  Запуск:
    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
    cd C:\Projects\test-ssto-project
    .\scripts\merge_latest_with_full.ps1 -RepoRoot "C:\Projects\test-ssto-project" -LatestZip "...\test-ssto-project.zip" -Manifest "...\manifest.csv" -Apply

#>

[CmdletBinding()]
param(
  [string]$RepoRoot = (Get-Location).Path,
  [string]$LatestZip = "",
  [string]$Manifest = "",
  [switch]$Apply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ------------------ helpers ------------------
function New-Dir([string]$Path) { if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null } }
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $RepoRoot "merge-backup-$Timestamp"
$ReportPath = Join-Path $RepoRoot "merge-report-$Timestamp.txt"
New-Dir $BackupRoot

function Save-TextUtf8NoBom([string]$Path, [string]$Content) {
  New-Dir (Split-Path $Path)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $enc)
}

function Read-Text([string]$Path) {
  if (!(Test-Path -LiteralPath $Path)) { return $null }
  [System.IO.File]::ReadAllText($Path)
}

function Backup-File([string]$Path) {
  if (Test-Path -LiteralPath $Path) {
    $rel = Resolve-Path $Path | Split-Path -NoQualifier
    $dest = Join-Path $BackupRoot $rel
    New-Dir (Split-Path $dest)
    Copy-Item -LiteralPath $Path -Destination $dest -Force
  }
}

function Compute-Sha1([string]$Path) {
  if (!(Test-Path -LiteralPath $Path)) { return "" }
  $sha = [System.Security.Cryptography.SHA1]::Create()
  $fs = [System.IO.File]::OpenRead($Path)
  try {
    $hash = $sha.ComputeHash($fs)
    -join ($hash | ForEach-Object { $_.ToString('x2') })
  } finally { $fs.Close() }
}

# ------------------ latest (zip/manifest) ------------------
$LatestRoot = ""
if ($LatestZip -and (Test-Path -LiteralPath $LatestZip)) {
  $ExtractRoot = Join-Path $RepoRoot ("_latest_extract_" + $Timestamp)
  New-Dir $ExtractRoot
  Expand-Archive -Path $LatestZip -DestinationPath $ExtractRoot -Force

  # autodetect корневую папку внутри zip (если одна)
  $entries = Get-ChildItem -LiteralPath $ExtractRoot
  if ($entries.Count -eq 1 -and $entries[0].PSIsContainer) {
    $LatestRoot = $entries[0].FullName
  } else {
    $LatestRoot = $ExtractRoot
  }
} else {
  $LatestRoot = ""
}

# Парсим manifest.csv (опционально, для логики "кто новее")
$ManifestMap = @{}
if ($Manifest -and (Test-Path -LiteralPath $Manifest)) {
  $csv = Import-Csv -Path $Manifest
  foreach ($row in $csv) {
    # ожидаем, что есть колонка Path и LastModified (или аналог) — если формат иной, скрипт просто не будет использовать даты
    $p = $row.Path
    if ($p) { $ManifestMap[$p] = $row }
  }
}

function Get-BaselineContent([string]$RelPath) {
  # 1) Если есть в latest‑zip — берём его
  if ($LatestRoot) {
    $cand = Join-Path $LatestRoot $RelPath
    if (Test-Path -LiteralPath $cand) {
      return ,("zip",$cand,(Read-Text $cand))
    }
  }
  # 2) Иначе — из репозитория
  $repo = Join-Path $RepoRoot $RelPath
  if (Test-Path -LiteralPath $repo) {
    return ,("repo",$repo,(Read-Text $repo))
  }
  return ,("missing","",$null)
}

function Write-Change([string]$Rel, [string]$What) {
  $line = "{0} :: {1}" -f $Rel, $What
  Add-Content -Path $ReportPath -Value $line
  Write-Host $line
}

# ------------------ canonical patches (full fragments) ------------------

# 1) backend-nest\src\services\report.service.ts — "полная шапка" и универсальный метод
$Report_EnsureReportsDirectory = @'
  private ensureReportsDirectory(): string {
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  }
'@

$Report_GenerateTestConfirmation_FullBody = @'
  async generateTestConfirmation(request: any, signal: any): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const fileName = `confirmation_${request?.id ?? 'x'}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);
    doc.pipe(fs.createWriteStream(filePath));

    // Шапка и реквизиты — не урезано
    doc.fontSize(10).font('Times-Roman');
    doc.text('МИНТРАНС РОССИИ', 50, 50);
    doc.text('РОСМОРРЕЧФЛОТ', 50, 65);
    doc.fontSize(9);
    doc.text('ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ', 50, 85);
    doc.text('БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ', 50, 100);
    doc.text('«МОРСКАЯ СПАСАТЕЛЬНАЯ СЛУЖБА»', 50, 115);
    doc.text('(ФГБУ «МОРСПАССЛУЖБА»)', 50, 130);
    doc.fontSize(12).text('Главный морской', 350, 50);
    doc.text('спасательно-', 350, 65);
    doc.text('координационный центр', 350, 80);
    doc.text('(ГМСКЦ)', 350, 95);
    doc.fontSize(8);
    doc.text('ул. Петровка д. 3/6 стр. 2, г Москва, 125993', 50, 150);
    doc.text('тел.: (495) 626-18-08', 50, 165);
    doc.text('info@morspas.ru, www.morspas.ru', 50, 180);
    doc.text('ОКПО 18685292, ОГРН 1027739737321', 50, 195);
    doc.text('ИНН/КПП 7707274249/770701001', 50, 210);

    // Тело
    doc.moveDown().fontSize(12).text('Подтверждение тестового оповещения', { align: 'center' });
    doc.moveDown().fontSize(10);
    doc.text(`Заявка №: ${request?.id ?? '—'}`);
    doc.text(`Судно: ${signal?.vessel_name ?? '—'}`);
    doc.text(`MMSI: ${signal?.mmsi ?? '—'}`);
    doc.text(`Тип сигнала: ${signal?.signal_type ?? '—'}`);
    doc.text(`Время получения: ${signal?.received_at ? new Date(signal.received_at).toLocaleString('ru-RU') : '—'}`);

    // Подпись/контакты
    doc.fontSize(9);
    doc.text('Федеральное государственное бюджетное', 50, 520);
    doc.text('учреждение «Морская спасательная служба»', 50, 535);
    doc.text('(ФГБУ «Морспасслужба»)', 50, 550);
    doc.text('Подписано ПЭП', 50, 580);
    doc.text('Оперативный дежурный ГМСКЦ', 50, 700);
    doc.text('+7 (495) 626-10-52', 50, 715);

    doc.end();
    return filePath;
  }
'@

$Report_GenerateForSignal_Fallback = @'
  async generateForSignal(signal: any): Promise<string> {
    if (signal && signal.request) {
      return this.generateTestConfirmation(signal.request, signal);
    }
    const fs = require('fs');
    const path = require('path');
    const PDFDocument = require('pdfkit');
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });
    const fileName = `signal_${signal?.id ?? 'x'}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text('Signal Report', { align: 'center' });
    doc.moveDown().fontSize(11);
    doc.text(`Signal ID: ${signal?.id ?? '—'}`);
    doc.text(`Terminal Number: ${signal?.terminal_number ?? '—'}`);
    doc.text(`Vessel Name: ${signal?.vessel_name ?? '—'}`);
    doc.text(`MMSI: ${signal?.mmsi ?? '—'}`);
    doc.text(`Signal Type: ${signal?.signal_type ?? '—'}`);
    doc.text(`Status: ${signal?.status ?? '—'}`);
    doc.text(`Received At: ${signal?.received_at ? new Date(signal.received_at).toISOString() : '—'}`);

    if (signal?.coordinates) {
      doc.moveDown().text('Coordinates:');
      const lat = signal.coordinates?.lat ?? '—';
      const lon = signal.coordinates?.lng ?? signal.coordinates?.lon ?? '—';
      doc.text(`Latitude: ${lat}`);
      doc.text(`Longitude: ${lon}`);
    }
    if (signal?.metadata) {
      doc.moveDown().text('Metadata:');
      try { doc.text(JSON.stringify(signal.metadata, null, 2)); }
      catch { doc.text(String(signal.metadata)); }
    }

    doc.end();
    return filePath;
  }
'@

# 2) backend-nest\src\models\signal.model.ts — вставка поля vessel_name
$SignalModel_VESSEL_PROP = @'
  @Column({ type: DataType.STRING, allowNull: true })
  vessel_name!: string | null;
'@

# 3) backend-nest\src\signal\signal.module.ts — DI-правки
$SignalModule_Import_SignalService = "import { SignalService } from '../services/signal.service';"
$SignalModule_Import_ReportService = "import { ReportService } from '../services/report.service';"

# 4) frontend — shim config.js (на случай старых импортов)
$Frontend_Config_Shim = @'
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
export default { API_BASE_URL };
'@

# 5) vite.config.ts — proxy /api
$ViteConfig_Target = @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true, secure: false } } },
});
'@

# 6) nginx.conf — /api → backend:3001
$NginxConf_Target = @'
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / { try_files $uri /index.html; }

    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
'@

# ------------------ patch functions ------------------

function Patch-ReportService([string]$Text) {
  if (-not $Text) { return ,($false, $Text) }
  $changed = $false

  # ensure class ReportService exists
  if ($Text -notmatch "export\s+class\s+ReportService") {
    # если файла "не было" — создадим минимум
    $Text = @"
import { Injectable } from '@nestjs/common';
@Injectable()
export class ReportService {
$Report_EnsureReportsDirectory

$Report_GenerateTestConfirmation_FullBody

$Report_GenerateForSignal_Fallback
}
"@
    return ,($true, $Text)
  }

  # ensure ensureReportsDirectory
  if ($Text -notmatch "ensureReportsDirectory\(\)") {
    $Text = $Text -replace "(export\s+class\s+ReportService\s*{)", "`$1`r`n$Report_EnsureReportsDirectory`r`n"
    $changed = $true
    Write-Change "backend-nest/src/services/report.service.ts" "add ensureReportsDirectory()"
  }

  # ensure generateTestConfirmation with full header
  if ($Text -notmatch "МИНТРАНС РОССИИ") {
    if ($Text -match "async\s+generateTestConfirmation\s*\(") {
      # Заменим существующий метод на полный
      $Text = [regex]::Replace($Text, "async\s+generateTestConfirmation\s*\([^)]*\)\s*:\s*Promise<string>\s*{[\s\S]*?}\s*", $Report_GenerateTestConfirmation_FullBody)
      $changed = $true
      Write-Change "backend-nest/src/services/report.service.ts" "patch generateTestConfirmation() full header"
    } else {
      # Вставим метод
      $Text = $Text -replace "(export\s+class\s+ReportService\s*{)", "`$1`r`n$Report_GenerateTestConfirmation_FullBody`r`n"
      $changed = $true
      Write-Change "backend-nest/src/services/report.service.ts" "add generateTestConfirmation()"
    }
  }

  # ensure generateForSignal
  if ($Text -notmatch "async\s+generateForSignal\s*\(") {
    $Text = $Text -replace "(export\s+class\s+ReportService\s*{)", "`$1`r`n$Report_GenerateForSignal_Fallback`r`n"
    $changed = $true
    Write-Change "backend-nest/src/services/report.service.ts" "add generateForSignal()"
  }

  return ,($changed, $Text)
}

function Patch-SignalModel([string]$Text) {
  if (-not $Text) { return ,($false,$Text) }
  if ($Text -match "vessel_name") { return ,($false,$Text) }

  # вставим после поля call_sign
  $regexAnchor = "@Column\(\{\s*type:\s*DataType\.STRING\(20\)[\s\S]*?call_sign"
  if ($Text -match $regexAnchor) {
    $Text = $Text -replace "(@Column\(\{\s*type:\s*DataType\.STRING\(20\)[\s\S]*?call_sign[^\r\n]*\r?\n\s*\};?)",
      "`$1`r`n$SignalModel_VESSEL_PROP`r`n"
  } else {
    # fallback — добавим перед signal_type
    $Text = $Text -replace "(@Column\(\{\s*type:\s*DataType\.STRING,\s*defaultValue:\s*'TEST'\s*\}\)\s*signal_type[^\r\n]*;)",
      "$SignalModel_VESSEL_PROP`r`n`$1"
  }
  Write-Change "backend-nest/src/models/signal.model.ts" "add vessel_name property"
  return ,($true,$Text)
}

function Patch-SignalModule([string]$Text) {
  if (-not $Text) { return ,($false,$Text) }
  $changed = $false

  # Импорты: убрать локальный ./signal.service и добавить ../services/signal.service + ../services/report.service
  $oldCount = ([regex]::Matches($Text, "from\s+'\.\/signal\.service'")).Count
  if ($oldCount -gt 0) {
    $Text = $Text -replace "import\s+\{\s*SignalService\s*\}\s+from\s+'\.\/signal\.service';\s*", ""
    $changed = $true
    Write-Change "backend-nest/src/signal/signal.module.ts" "remove ./signal.service import"
  }
  if ($Text -notmatch [regex]::Escape($SignalModule_Import_SignalService)) {
    $Text = $Text -replace "(import\s+Signal\s+from\s+'.*?';)", "`$1`r`n$SignalModule_Import_SignalService"
    $changed = $true
    Write-Change "backend-nest/src/signal/signal.module.ts" "add import SignalService from ../services"
  }
  if ($Text -notmatch [regex]::Escape($SignalModule_Import_ReportService)) {
    $Text = $Text -replace "(import\s+Signal\s+from\s+'.*?';)", "`$1`r`n$SignalModule_Import_ReportService"
    $changed = $true
    Write-Change "backend-nest/src/signal/signal.module.ts" "add import ReportService"
  }

  # providers/exports: добавить ReportService, оставить PdfService если был
  if ($Text -match "providers:\s*\[([^\]]*)\]") {
    $prov = $Matches[1]
    if ($prov -notmatch "ReportService") {
      $Text = $Text -replace "providers:\s*\[([^\]]*)\]", { "providers: [$($Matches[1]), ReportService]" }
      $changed = $true
      Write-Change "backend-nest/src/signal/signal.module.ts" "add ReportService to providers"
    }
  }
  if ($Text -match "exports:\s*\[([^\]]*)\]") {
    $exp = $Matches[1]
    if ($exp -notmatch "ReportService") {
      $Text = $Text -replace "exports:\s*\[([^\]]*)\]", { "exports: [$($Matches[1]), ReportService]" }
      $changed = $true
      Write-Change "backend-nest/src/signal/signal.module.ts" "add ReportService to exports"
    }
  }

  return ,($changed,$Text)
}

function Patch-Frontend-AuthFiles([string]$Text) {
  if (-not $Text) { return ,($false,$Text) }
  $changed = $false
  # убрать http://localhost:* → '' (будем использовать относительный /api)
  if ($Text -match "http://localhost:") {
    $Text = $Text -replace "http://localhost:\d+", ""
    $changed = $true
  }
  # заменить `${...}/api/...` или '/api/...' приведение к единообразному виду (минимально безопасно)
  # Наша цель — ensure вызовы вида fetch('/api/...') или fetch(api('/auth/...')) — но без глобального рефакторинга:
  # Если увидим `${config.API_BASE_URL}/api/...` → '/api/...'
  $Text = $Text -replace "\$\{[^\}]+\}\/api", "/api"
  if ($Text -match "config\.API_BASE_URL") {
    $Text = $Text -replace "config\.API_BASE_URL\s*\+?\s*['""]\/?", ""
    $changed = $true
  }
  # Если явно 'http(s)://.../api' → '/api'
  $Text = $Text -replace "https?:\/\/[a-zA-Z0-9\.\-:]+\/api", "/api"
  return ,($changed,$Text)
}

function Ensure-File([string]$RelPath, [scriptblock]$PatchBlock, [string]$ForcedContent = "") {
  $rel = $RelPath
  $baseline = Get-BaselineContent $rel
  $sourceType, $abs, $text = $baseline

  if ($sourceType -eq "missing" -and $ForcedContent) {
    $target = Join-Path $RepoRoot $rel
    Backup-File $target
    if ($Apply) { Save-TextUtf8NoBom $target $ForcedContent }
    Write-Change $rel "created from full template"
    return
  }

  if (-not $text) { return }

  $patchResult = & $PatchBlock $text
  $didChange = $patchResult[0]
  $newText   = $patchResult[1]

  if ($didChange) {
    $target = Join-Path $RepoRoot $rel
    Backup-File $target
    if ($Apply) { Save-TextUtf8NoBom $target $newText }
    Write-Change $rel "patched ($sourceType baseline)"
  } else {
    Write-Change $rel "ok (no change)"
  }
}

# ------------------ DEDUPE & rewrite imports ------------------

function Move-ToBackup([string]$RelOrAbs) {
  $p = $RelOrAbs
  if (-not (Test-Path -LiteralPath $p)) { $p = Join-Path $RepoRoot $RelOrAbs }
  if (Test-Path -LiteralPath $p) {
    $rel = Resolve-Path $p | Split-Path -NoQualifier
    $dest = Join-Path $BackupRoot $rel
    New-Dir (Split-Path $dest)
    Move-Item -LiteralPath $p -Destination $dest -Force
    Write-Change $rel "moved to backup"
  }
}

function Fix-AuthContext-Imports() {
  $srcRoot = Join-Path $RepoRoot "frontend\src"
  if (!(Test-Path -LiteralPath $srcRoot)) { return }
  $files = Get-ChildItem -Path $srcRoot -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {
    $_.FullName -match "\\src\\(pages|components)\\"
  }
  foreach ($f in $files) {
    $txt = Get-Content -Raw -LiteralPath $f.FullName
    $orig = $txt
    $txt = $txt -replace "from\s+['""]\./contexts/AuthContext['""]", "from '../contexts/AuthContext'"
    if ($txt -ne $orig) {
      Backup-File $f.FullName
      if ($Apply) { Save-TextUtf8NoBom $f.FullName $txt }
      Write-Change (Resolve-Path $f.FullName | Split-Path -NoQualifier) "fix import ./contexts/AuthContext → ../contexts/AuthContext"
    }
  }
}

# ------------------ RUN ------------------

"=== MERGE START $(Get-Date) ===" | Out-File -Encoding utf8 -FilePath $ReportPath

# 0) удалить (в бэкап) фронтовую статическую копию бэкенда, чтобы исключить ложные импорты
$legacy = Join-Path $RepoRoot "frontend-static\backend-nest"
if (Test-Path -LiteralPath $legacy) { Move-ToBackup $legacy }

# 1) backend-nest/src/services/report.service.ts
Ensure-File "backend-nest\src\services\report.service.ts" ${function:Patch-ReportService}

# 2) backend-nest/src/models/signal.model.ts
Ensure-File "backend-nest\src\models\signal.model.ts" ${function:Patch-SignalModel}

# 3) backend-nest/src/signal/signal.module.ts
Ensure-File "backend-nest\src\signal\signal.module.ts" ${function:Patch-SignalModule}

# 4) frontend/src/contexts/AuthContext.tsx
Ensure-File "frontend\src\contexts\AuthContext.tsx" ${function:Patch-Frontend-AuthFiles}

# 5) frontend/src/components/auth.component.tsx
Ensure-File "frontend\src\components\auth.component.tsx" ${function:Patch-Frontend-AuthFiles}

# 6) vite.config.ts — при отсутствии создадим шаблон, иначе — легкая правка (проксирование /api)
$VitePath = Join-Path $RepoRoot "frontend\vite.config.ts"
if (!(Test-Path -LiteralPath $VitePath)) {
  Backup-File $VitePath
  if ($Apply) { Save-TextUtf8NoBom $VitePath $ViteConfig_Target }
  Write-Change "frontend/vite.config.ts" "created proxy /api"
}

# 7) nginx.conf — оставить канон с /api, остальные nginx*.conf отправить в бэкап
$NginxCanon = Join-Path $RepoRoot "frontend\nginx.conf"
if (Test-Path -LiteralPath $NginxCanon) {
  $txt = Get-Content -Raw -LiteralPath $NginxCanon
  if ($txt -notmatch "location\s+/api\s*\{") {
    Backup-File $NginxCanon
    if ($Apply) { Save-TextUtf8NoBom $NginxCanon $NginxConf_Target }
    Write-Change "frontend/nginx.conf" "patched to include /api proxy"
  } else {
    Write-Change "frontend/nginx.conf" "ok (has /api proxy)"
  }
} else {
  if ($Apply) { Save-TextUtf8NoBom $NginxCanon $NginxConf_Target }
  Write-Change "frontend/nginx.conf" "created canonical nginx.conf"
}
# удалить дубли nginx*.conf кроме frontend/nginx.conf
Get-ChildItem -Path (Join-Path $RepoRoot 'frontend') -Filter 'nginx*.conf' -Recurse | Where-Object {
  $_.FullName -ne $NginxCanon
} | ForEach-Object { Move-ToBackup $_.FullName }

# 8) frontend/src/config.js — тонкий shim
$CfgShim = Join-Path $RepoRoot "frontend\src\config.js"
if (!(Test-Path -LiteralPath $CfgShim)) {
  if ($Apply) { Save-TextUtf8NoBom $CfgShim $Frontend_Config_Shim }
  Write-Change "frontend/src/config.js" "created shim"
} else {
  Write-Change "frontend/src/config.js" "exists (kept)"
}

# 9) починка импортов в pages/components
Fix-AuthContext-Imports

"=== MERGE END $(Get-Date) ===" | Add-Content -Path $ReportPath

if (-not $Apply) {
  Write-Host "`n[DRY-RUN] Изменения НЕ записаны. Повторите с -Apply для применения." -ForegroundColor Yellow
} else {
  Write-Host "`n[OK] Изменения применены. Отчёт: $ReportPath" -ForegroundColor Green
  Write-Host "Резервные копии: $BackupRoot"
}
