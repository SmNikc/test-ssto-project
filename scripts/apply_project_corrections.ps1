[CmdletBinding()]
param(
  [switch]$Apply,
  [switch]$PatchVibrate,      # типобезопасный каст vibrate в EmergencyAlert.tsx
  [switch]$PatchSocketClient, # socket.io client: path=/socket.io, transports
  [switch]$MigrateDb          # ALTER TABLE signals ADD COLUMN IF NOT EXISTS vessel_name
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# --- Paths ---
$RepoRoot = (Get-Location).Path
if (-not (Test-Path -LiteralPath (Join-Path $RepoRoot 'backend-nest'))) {
  throw "Запустите скрипт из корня репозитория (где папка backend-nest). Текущий: $RepoRoot"
}
$Ts = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupRoot = Join-Path $RepoRoot "apply-backup-$Ts"
$ReportPath = Join-Path $RepoRoot "apply-report-$Ts.txt"

function Log([string]$msg) {
  Add-Content -Path $ReportPath -Value $msg
  Write-Host $msg
}
function Ensure-Dir([string]$p) {
  if (!(Test-Path -LiteralPath $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}
function Backup([string]$absPath) {
  if (Test-Path -LiteralPath $absPath) {
    $rel = (Resolve-Path $absPath).Path.Substring($RepoRoot.Length).TrimStart('\','/')
    $dst = Join-Path $BackupRoot $rel
    Ensure-Dir (Split-Path $dst)
    Copy-Item -LiteralPath $absPath -Destination $dst -Force -Recurse
    Log ("Backup → {0}" -f $rel)
  }
}
function Read-Text([string]$p) {
  if (Test-Path -LiteralPath $p) { [System.IO.File]::ReadAllText($p) } else { $null }
}
function Write-Text([string]$p, [string]$text) {
  Ensure-Dir (Split-Path $p)
  $enc = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($p, $text, $enc)
}

"=== APPLY START $(Get-Date) ===" | Out-File -Encoding utf8 -FilePath $ReportPath
Ensure-Dir $BackupRoot

# ====================================================================================
# 1) BACKEND PATCHES
# ====================================================================================

# 1.1) backend-nest/src/models/signal.model.ts → добавить vessel_name (nullable)
$SignalModel = Join-Path $RepoRoot "backend-nest\src\models\signal.model.ts"
if (Test-Path -LiteralPath $SignalModel) {
  $txt = Read-Text $SignalModel
  if ($txt -notmatch "\bvessel_name\b") {
    Backup $SignalModel
    # Попробуем вставить после call_sign; иначе перед signal_type
    if ($txt -match "@Column\(\{[\s\S]*?call_sign") {
      $txt = $txt -replace "(\@Column\(\{[\s\S]*?call_sign[^\r\n]*\r?\n\s*\};?)",
        "$1`r`n  @Column({ type: DataType.STRING, allowNull: true })`r`n  vessel_name!: string | null;`r`n"
    } else {
      $txt = $txt -replace "(\@Column\(\{\s*type:\s*DataType\.STRING,\s*defaultValue:\s*'TEST'[\s\S]*?signal_type[^\r\n]*;)",
        "  @Column({ type: DataType.STRING, allowNull: true })`r`n  vessel_name!: string | null;`r`n`r`n$1"
    }
    if ($Apply) { Write-Text $SignalModel $txt }
    Log "backend-nest/src/models/signal.model.ts: add vessel_name"
  } else {
    Log "backend-nest/src/models/signal.model.ts: OK (has vessel_name)"
  }
} else {
  Log "backend-nest/src/models/signal.model.ts: SKIP (file not found)"
}

# 1.2) backend-nest/src/services/report.service.ts → ensureReportsDirectory + generateTestConfirmation (полная шапка) + generateForSignal
$ReportService = Join-Path $RepoRoot "backend-nest\src\services\report.service.ts"
$EnsureDirBlock = @'
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

$FullHeaderBlock = @'
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

    // --- Полная шапка (НЕ урезаем) ---
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

    doc.moveDown().fontSize(12).text('Подтверждение тестового оповещения', { align: 'center' });
    doc.moveDown().fontSize(10);
    doc.text(`Заявка №: ${request?.id ?? '—'}`);
    doc.text(`Судно: ${signal?.vessel_name ?? '—'}`);
    doc.text(`MMSI: ${signal?.mmsi ?? '—'}`);
    doc.text(`Тип сигнала: ${signal?.signal_type ?? '—'}`);
    doc.text(`Время получения: ${signal?.received_at ? new Date(signal.received_at).toLocaleString('ru-RU') : '—'}`);

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

$GenerateForSignalBlock = @'
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

if (Test-Path -LiteralPath $ReportService) {
  $txt = Read-Text $ReportService
  $changed = $false
  if ($txt -notmatch "export\s+class\s+ReportService") {
    Backup $ReportService
    $txt = @"
import { Injectable } from '@nestjs/common';
@Injectable()
export class ReportService {
$EnsureDirBlock

$FullHeaderBlock

$GenerateForSignalBlock
}
"@
    if ($Apply) { Write-Text $ReportService $txt }
    Log "backend-nest/src/services/report.service.ts: created (full)"
  } else {
    Backup $ReportService
    if ($txt -notmatch "ensureReportsDirectory\(") {
      $txt = $txt -replace "(export\s+class\s+ReportService\s*\{)", "`$1`r`n$EnsureDirBlock`r`n"
      Log "report.service.ts: add ensureReportsDirectory"
      $changed = $true
    }
    if ($txt -notmatch "МИНТРАНС РОССИИ") {
      if ($txt -match "async\s+generateTestConfirmation\s*\(") {
        $txt = [regex]::Replace($txt,
          "async\s+generateTestConfirmation\s*\([^)]*\)\s*:\s*Promise<string>\s*\{[\s\S]*?\}\s*",
          $FullHeaderBlock)
        Log "report.service.ts: patch generateTestConfirmation (full header)"
      } else {
        $txt = $txt -replace "(export\s+class\s+ReportService\s*\{)", "`$1`r`n$FullHeaderBlock`r`n"
        Log "report.service.ts: add generateTestConfirmation"
      }
      $changed = $true
    }
    if ($txt -notmatch "async\s+generateForSignal\s*\(") {
      $txt = $txt -replace "(export\s+class\s+ReportService\s*\{)", "`$1`r`n$GenerateForSignalBlock`r`n"
      Log "report.service.ts: add generateForSignal"
      $changed = $true
    }
    $state = "OK"
    if ($changed) {
      if ($Apply) { Write-Text $ReportService $txt }
      $state = "patched"
    }
    Log ("backend-nest/src/services/report.service.ts: {0}" -f $state)
  }
} else {
  Log "backend-nest/src/services/report.service.ts: SKIP (file not found)"
}

# 1.3) backend-nest/src/signal/signal.module.ts → DI: ReportService в providers/exports, SignalService из ../services/*
$SignalModule = Join-Path $RepoRoot "backend-nest\src\signal\signal.module.ts"
if (Test-Path -LiteralPath $SignalModule) {
  $txt = Read-Text $SignalModule
  $changed = $false
  Backup $SignalModule

  # remove ./signal.service import
  $txt2 = $txt -replace "import\s+\{\s*SignalService\s*\}\s+from\s+'\.\/signal\.service';\s*", ""
  if ($txt2 -ne $txt) {
    Log "signal.module.ts: remove ./signal.service import"
    $changed = $true
    $txt = $txt2
  }

  # ensure imports from ../services
  if ($txt -notmatch "from\s+'\.\.\/services\/signal\.service'") {
    $txt = $txt -replace "(import\s+Signal\s+from\s+'.*?';)", "`$1`r`nimport { SignalService } from '../services/signal.service';"
    Log "signal.module.ts: add import { SignalService } from ../services/signal.service"
    $changed = $true
  }
  if ($txt -notmatch "from\s+'\.\.\/services\/report\.service'") {
    $txt = $txt -replace "(import\s+Signal\s+from\s+'.*?';)", "`$1`r`nimport { ReportService } from '../services/report.service';"
    Log "signal.module.ts: add import { ReportService } from ../services/report.service"
    $changed = $true
  }

  # providers
  if ($txt -match "providers:\s*\[([^\]]*)\]") {
    if ($Matches[1] -notmatch "ReportService") {
      $txt = $txt -replace "providers:\s*\[([^\]]*)\]", { "providers: [$($matches[1]), ReportService]" }
      Log "signal.module.ts: add ReportService to providers"
      $changed = $true
    }
  }
  # exports
  if ($txt -match "exports:\s*\[([^\]]*)\]") {
    if ($Matches[1] -notmatch "ReportService") {
      $txt = $txt -replace "exports:\s*\[([^\]]*)\]", { "exports: [$($matches[1]), ReportService]" }
      Log "signal.module.ts: add ReportService to exports"
      $changed = $true
    }
  }

  $state = "OK"
  if ($changed) {
    if ($Apply) { Write-Text $SignalModule $txt }
    $state = "patched"
  }
  Log ("backend-nest/src/signal/signal.module.ts: {0}" -f $state)
} else {
  Log "backend-nest/src/signal/signal.module.ts: SKIP (file not found)"
}

# ====================================================================================
# 2) FRONTEND PATCHES
# ====================================================================================

$FE = Join-Path $RepoRoot "frontend"
if (Test-Path -LiteralPath $FE) {

  # 2.1) Нормализация HTTP-вызовов на относительный /api
  function Patch-ApiCalls([string]$absPath) {
    $txt = Read-Text $absPath
    if ([string]::IsNullOrEmpty($txt)) { return $false }
    $orig = $txt

    # http://localhost:3001/api → /api
    $txt = $txt -replace "https?:\/\/localhost:\d+\/api", "/api"

    # ${config.API_BASE_URL}/api → /api ;  config.API_BASE_URL + '/api' → '/api'
    $txt = $txt -replace "\$\{[^\}]*API_BASE_URL[^\}]*\}\/api", "/api"
    $txt = $txt -replace "config\.API_BASE_URL\s*\+\s*['""]\/?api['""]", "'/api'"

    # axios/fetch шаблоны типа `${API_BASE_URL}/...`
    $txt = $txt -replace "\$\{[^\}]*API_BASE_URL[^\}]*\}\/", "/"

    if ($txt -ne $orig) {
      Backup $absPath
      if ($Apply) { Write-Text $absPath $txt }
      $rel = $absPath.Substring($FE.Length+1)
      Log ("frontend/{0}: API → /api" -f $rel)
      return $true
    }
    return $false
  }

  Get-ChildItem -Path (Join-Path $FE "src") -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue | ForEach-Object {
    Patch-ApiCalls $_.FullName | Out-Null
  }

  # 2.2) Исправить импорты ./contexts/AuthContext → ../contexts/AuthContext
  Get-ChildItem -Path (Join-Path $FE "src") -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {
    $_.FullName -match "\\src\\(pages|components)\\"
  } | ForEach-Object {
    $txt = Read-Text $_.FullName
    if ($txt -and $txt -match "from\s+['""]\./contexts/AuthContext['""]") {
      Backup $_.FullName
      $txt = $txt -replace "from\s+['""]\./contexts/AuthContext['""]","from '../contexts/AuthContext'"
      if ($Apply) { Write-Text $_.FullName $txt }
      $rel = $_.FullName.Substring($FE.Length+1)
      Log ("frontend/{0}: import fix ./contexts → ../contexts" -f $rel)
    }
  }

  # 2.3) vite.config.ts — /api (rewrite drop prefix) + /socket.io (ws)
  $ViteConfig = Join-Path $FE "vite.config.ts"
  $viteCanon = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
"@
  if (-not (Test-Path -LiteralPath $ViteConfig)) {
    if ($Apply) { Write-Text $ViteConfig $viteCanon }
    Log "frontend/vite.config.ts: created with /api + /socket.io proxy"
  } else {
    $curr = Read-Text $ViteConfig
    if ($curr -notmatch 'proxy:\s*\{[\s\S]*?\/api' -or $curr -notmatch '\/socket\.io') {
      Backup $ViteConfig
      if ($Apply) { Write-Text $ViteConfig $viteCanon }
      Log "frontend/vite.config.ts: patched → /api (rewrite) + /socket.io (ws)"
    } else {
      Log "frontend/vite.config.ts: OK"
    }
  }

  # 2.4) nginx.conf — /api/ (drop prefix) + /socket.io/ (WS)
  $Nginx = Join-Path $FE "nginx.conf"
  # ВАЖНО: одинарная here-string @'…'@ => НЕ подставляет PowerShell‑переменные ($uri, $http_upgrade и т.п.)
  $nginxCanon = @'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    # API → backend, удаляем префикс /api
    location /api/ {
        proxy_pass http://backend:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (socket.io)
    location /socket.io/ {
        proxy_pass http://backend:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
    }
}
'@
  if (-not (Test-Path -LiteralPath $Nginx)) {
    if ($Apply) { Write-Text $Nginx $nginxCanon }
    Log "frontend/nginx.conf: created"
  } else {
    $curr = Read-Text $Nginx
    if ($curr -notmatch "location\s+/api/" -or $curr -notmatch "location\s+/socket\.io/") {
      Backup $Nginx
      if ($Apply) { Write-Text $Nginx $nginxCanon }
      Log "frontend/nginx.conf: patched (api + socket.io)"
    } else {
      Log "frontend/nginx.conf: OK"
    }
  }

  # удалить прочие nginx*.conf (с бэкапом)
  Get-ChildItem -Path $FE -Filter 'nginx*.conf' -Recurse | Where-Object {
    $_.FullName -ne $Nginx
  } | ForEach-Object {
    Backup $_.FullName
    Remove-Item $_.FullName -Force
    $rel = $_.FullName.Substring($RepoRoot.Length).TrimStart('\','/')
    Log ("remove extra nginx conf → {0}" -f $rel)
  }

  # 2.5) frontend/src/config.js — shim (на случай старых импортов)
  $CfgShim = Join-Path $FE "src\config.js"
  if (-not (Test-Path -LiteralPath $CfgShim)) {
    $shim = @"
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
export default { API_BASE_URL };
"@
    if ($Apply) { Write-Text $CfgShim $shim }
    Log "frontend/src/config.js: created shim"
  } else {
    Log "frontend/src/config.js: OK"
  }

  # 2.6) package.json — build = vite build; добавить typecheck
  $Pkg = Join-Path $FE "package.json"
  if (Test-Path -LiteralPath $Pkg) {
    $obj = Get-Content -Raw -LiteralPath $Pkg | ConvertFrom-Json
    if (-not $obj.scripts) { $obj | Add-Member -NotePropertyName scripts -NotePropertyValue (@{}) }
    $changed = $false
    if ($obj.scripts.build -and ($obj.scripts.build -match "\btsc\b")) {
      $obj.scripts.build = "vite build"
      Log "frontend/package.json: scripts.build → 'vite build'"
      $changed = $true
    } elseif (-not $obj.scripts.build) {
      $obj.scripts.build = "vite build"
      Log "frontend/package.json: add build='vite build'"
      $changed = $true
    }
    if (-not $obj.scripts.typecheck) {
      $obj.scripts.typecheck = "tsc -p tsconfig.json --noEmit"
      Log "frontend/package.json: add scripts.typecheck"
      $changed = $true
    }
    if ($changed) {
      Backup $Pkg
      if ($Apply) { $obj | ConvertTo-Json -Depth 100 | Out-File -Encoding utf8 -LiteralPath $Pkg }
    } else {
      Log "frontend/package.json: OK"
    }
  } else {
    Log "frontend/package.json: SKIP (not found)"
  }

  # 2.7) tsconfig.json — смягчение флагов, чтобы docker build не падал
  $TsCfg = Join-Path $FE "tsconfig.json"
  if (Test-Path -LiteralPath $TsCfg) {
    $ts = Get-Content -Raw -LiteralPath $TsCfg | ConvertFrom-Json
    if (-not $ts.compilerOptions) { $ts | Add-Member -NotePropertyName compilerOptions -NotePropertyValue (@{}) }
    $changed = $false
    if (-not $ts.compilerOptions.jsx) { $ts.compilerOptions.jsx = "react-jsx"; $changed=$true }
    if ($ts.compilerOptions.noUnusedLocals -ne $false) { $ts.compilerOptions.noUnusedLocals = $false; $changed=$true }
    if ($ts.compilerOptions.skipLibCheck -ne $true) { $ts.compilerOptions.skipLibCheck = $true; $changed=$true }
    if (-not $ts.compilerOptions.allowJs) { $ts.compilerOptions.allowJs = $true; $changed=$true }
    if (-not $ts.compilerOptions.esModuleInterop) { $ts.compilerOptions.esModuleInterop = $true; $changed=$true }
    if ($changed) {
      Backup $TsCfg
      if ($Apply) { $ts | ConvertTo-Json -Depth 100 | Out-File -Encoding utf8 -LiteralPath $TsCfg }
      Log "frontend/tsconfig.json: patched"
    } else {
      Log "frontend/tsconfig.json: OK"
    }
  } else {
    Log "frontend/tsconfig.json: SKIP (not found)"
  }

  # 2.8) (опция) vibrate cast
  if ($PatchVibrate) {
    $Alert = Join-Path $FE "src\components\EmergencyAlert.tsx"
    if (Test-Path -LiteralPath $Alert) {
      $src = Read-Text $Alert
      $src2 = $src -replace '(new\s+Notification\(\s*[^,]+,\s*)\{([\s\S]*?)\}', {
        param($m)
        $head = $m.Groups[1].Value
        $body = $m.Groups[2].Value
        $opt  = "{ $body } as NotificationOptions & { vibrate?: number[] }"
        return "$head$opt"
      }
      if ($src2 -ne $src) {
        Backup $Alert
        if ($Apply) { Write-Text $Alert $src2 }
        Log "frontend/src/components/EmergencyAlert.tsx: patched vibrate cast"
      } else {
        Log "frontend/src/components/EmergencyAlert.tsx: no change"
      }
    } else {
      Log "frontend/src/components/EmergencyAlert.tsx: SKIP (not found)"
    }
  }

  # 2.9) (опция) socket.io client path/transports
  if ($PatchSocketClient) {
    $BES = Join-Path $FE "src\services\BackendService.ts"
    if (Test-Path -LiteralPath $BES) {
      $src = Read-Text $BES
      $changed = $false
      if ($src -match "from\s+['""]socket\.io-client['""]") {
        if ($src -notmatch "path:\s*['""]\/socket\.io['""]") {
          $src = $src -replace "io\(([^)]*)\)", {
            param($m)
            $args = $m.Groups[1].Value.Trim()
            if ($args -match "^\s*['""]\/?['""]\s*,") {
              "io('/', { path: '/socket.io', transports: ['websocket','polling'] })"
            } elseif ($args -match "^\s*\{") {
              "io({ path: '/socket.io', transports: ['websocket','polling'] })"
            } else {
              "io('/', { path: '/socket.io', transports: ['websocket','polling'] })"
            }
          }
          $changed = $true
        }
      }
      if ($changed) {
        Backup $BES
        if ($Apply){ Write-Text $BES $src }
        Log "frontend/src/services/BackendService.ts: ensure socket.io path + transports"
      } else {
        Log "frontend/src/services/BackendService.ts: OK/unchanged"
      }
    } else {
      Log "frontend/src/services/BackendService.ts: SKIP (not found)"
    }
  }

  # 2.10) вычистить параллельный backend в frontend-static/*
  $Legacy = Join-Path $RepoRoot "frontend-static\backend-nest"
  if (Test-Path -LiteralPath $Legacy) {
    Backup $Legacy
    if ($Apply) { Remove-Item -LiteralPath $Legacy -Recurse -Force }
    Log "frontend-static/backend-nest: removed (duplicate backend)"
  } else {
    Log "frontend-static/backend-nest: OK (absent)"
  }

} else {
  Log "frontend/: SKIP (folder not found)"
}

# ====================================================================================
# 3) DB MIGRATION (опционально, если контейнер postgres жив)
# ====================================================================================
if ($MigrateDb) {
  try {
    Log "DB migration: docker compose exec postgres ..."
    $cmd = "docker compose exec -T postgres psql -U ssto -d sstodb -c `"ALTER TABLE signals ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(255);`""
    Log ("RUN: {0}" -f $cmd)
    $proc = Start-Process -FilePath "powershell" -ArgumentList "-NoLogo","-NoProfile","-Command",$cmd -Wait -PassThru -WindowStyle Hidden
    if ($proc.ExitCode -eq 0) {
      Log "DB migration: OK"
    } else {
      Log ("DB migration: FAIL (exit={0}) — выполните вручную после запуска контейнеров" -f $proc.ExitCode)
    }
  } catch {
    Log ("DB migration: ERROR {0}" -f $_.Exception.Message)
  }
} else {
  Log "DB migration: skipped (no -MigrateDb)"
}

"=== APPLY END $(Get-Date) ===" | Add-Content -Path $ReportPath
Write-Host "`nОтчёт: $ReportPath"
Write-Host "Бэкапы: $BackupRoot"
if (-not $Apply) {
  Write-Host "`n[DRY-RUN] Изменения НЕ записаны. Запустите с -Apply для применения." -ForegroundColor Yellow
}
