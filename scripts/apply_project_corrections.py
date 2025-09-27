# -*- coding: utf-8 -*-
"""
apply_project_corrections.py
Единый Python-скрипт коррекции структуры и кода проекта ТЕСТ ССТО.

Функции:
- Бэкап изменяемых файлов в apply-backup-YYYYMMDD-HHMMSS/
- Патчи backend и frontend (см. описание выше)
- Опциональная миграция Postgres через docker compose exec
- DRY-RUN по умолчанию, реальная запись при --apply

Аргументы:
  --apply              реально записать изменения (без него только отчёт)
  --patch-vibrate      типобезопасный cast для NotificationOptions.vibrate
  --patch-socket-client настройка socket.io-клиента (path=/socket.io, transports)
  --migrate-db         выполнить ALTER TABLE signals ... через docker

Запуск из корня репозитория:
  py scripts\apply_project_corrections.py --apply
"""

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# ----------------------- общие утилиты -----------------------

def now_stamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")

def ensure_dir(p: Path):
    p.parent.mkdir(parents=True, exist_ok=True)

def read_text(p: Path) -> str | None:
    try:
        return p.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None

def write_text(p: Path, s: str, apply: bool):
    ensure_dir(p)
    if apply:
        p.write_text(s, encoding="utf-8")

def backup_file(repo_root: Path, backup_root: Path, abs_path: Path, log):
    if abs_path.exists():
        rel = abs_path.resolve().as_posix().removeprefix(repo_root.resolve().as_posix()).lstrip("/")
        dst = (backup_root / rel)
        dst.parent.mkdir(parents=True, exist_ok=True)
        if abs_path.is_dir():
            shutil.copytree(abs_path, dst, dirs_exist_ok=True)
        else:
            shutil.copy2(abs_path, dst)
        log(f"Backup → {rel}")

def regex_sub_once(pattern: str, repl: str, text: str, flags=0) -> tuple[str, bool]:
    new_text, n = re.subn(pattern, repl, text, flags=flags)
    return new_text, n > 0

def regex_replace_block(text: str, start_pat: str, end_pat: str, replacement: str, flags=0) -> tuple[str, bool]:
    """
    Заменить блок от start_pat включительно до end_pat включительно.
    """
    m1 = re.search(start_pat, text, flags)
    m2 = re.search(end_pat, text, flags)
    if not m1 or not m2 or m2.start() < m1.start():
        return text, False
    return text[:m1.start()] + replacement + text[m2.end():], True

# ----------------------- логгер -----------------------

class Logger:
    def __init__(self, report_path: Path):
        self.report_path = report_path
        ensure_dir(report_path)
        report_path.write_text("", encoding="utf-8")

    def __call__(self, msg: str):
        print(msg)
        with self.report_path.open("a", encoding="utf-8") as f:
            f.write(msg + "\n")

# ----------------------- патчи backend -----------------------

def patch_signal_model(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "backend-nest/src/models/signal.model.ts"
    txt = read_text(p)
    if txt is None:
        log("backend-nest/src/models/signal.model.ts: SKIP (file not found)")
        return
    if re.search(r"\bvessel_name\b", txt):
        log("backend-nest/src/models/signal.model.ts: OK (has vessel_name)")
        return

    backup_file(repo_root, backup_root, p, log)
    block = (
        "  @Column({\n"
        "    type: DataType.STRING,\n"
        "    allowNull: true\n"
        "  })\n"
        "  vessel_name!: string | null;\n\n"
    )

    # Пробуем вставить после call_sign
    m = re.search(r"@Column\([^)]*\)\s*\r?\n\s*call_sign\s*:\s*[^\n;]+;", txt)
    if m:
        insert_at = m.end()
        txt2 = txt[:insert_at] + "\n\n" + block + txt[insert_at:]
        write_text(p, txt2, apply)
        log("backend-nest/src/models/signal.model.ts: add vessel_name (after call_sign)")
        return

    # Иначе вставим перед signal_type
    m2 = re.search(r"@Column\([^)]*\)\s*\r?\n\s*signal_type\s*:\s*[^\n;]+;", txt)
    if m2:
        insert_at = m2.start()
        txt2 = txt[:insert_at] + block + txt[insert_at:]
        write_text(p, txt2, apply)
        log("backend-nest/src/models/signal.model.ts: add vessel_name (before signal_type)")
        return

    # Последний шанс — в конец класса перед закрывающей скобкой
    txt2, ok = regex_sub_once(r"(export\s+default\s+class\s+Signal\s+extends\s+Model\s*\{)", r"\1\n" + block, txt)
    if ok:
        write_text(p, txt2, apply)
        log("backend-nest/src/models/signal.model.ts: add vessel_name (fallback)")
    else:
        log("backend-nest/src/models/signal.model.ts: WARN — не удалось вставить vessel_name автоматически")

def canonical_report_service_ts() -> str:
    return """import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  private ensureReportsDirectory(): string {
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  }

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
}
"""

def patch_report_service(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "backend-nest/src/services/report.service.ts"
    txt = read_text(p)
    if txt is None:
        # создаём файл целиком
        backup_file(repo_root, backup_root, p, log)
        write_text(p, canonical_report_service_ts(), apply)
        log("backend-nest/src/services/report.service.ts: created (full)")
        return

    changed = False
    backup_file(repo_root, backup_root, p, log)

    if "ensureReportsDirectory(" not in txt:
        txt = re.sub(r"(export\s+class\s+ReportService\s*\{)", r"\1\n" + canonical_report_service_ts().split("export class ReportService {",1)[1].split("async generateTestConfirmation",1)[0], txt, count=1, flags=re.S)
        changed = True
        log("report.service.ts: add ensureReportsDirectory")

    if "МИНТРАНС РОССИИ" not in txt:
        # заменить весь generateTestConfirmation на канонический блок
        gen_pat = r"async\s+generateTestConfirmation\s*\([^)]*\)\s*:\s*Promise<string>\s*\{[\s\S]*?\}\s*"
        if re.search(gen_pat, txt):
            repl_block = canonical_report_service_ts().split("async generateTestConfirmation",1)[1]
            repl_block = "async generateTestConfirmation" + repl_block.split("async generateForSignal",1)[0]
            txt = re.sub(gen_pat, repl_block, txt, count=1, flags=re.S)
            log("report.service.ts: patch generateTestConfirmation (full header)")
        else:
            # нет метода — добавим в начало класса
            insert_block = canonical_report_service_ts().split("async generateTestConfirmation",1)[1]
            insert_block = "async generateTestConfirmation" + insert_block.split("async generateForSignal",1)[0]
            txt = re.sub(r"(export\s+class\s+ReportService\s*\{)", r"\1\n" + insert_block + "\n", txt, count=1, flags=re.S)
            log("report.service.ts: add generateTestConfirmation")
        changed = True

    if "async generateForSignal(" not in txt:
        insert_block = canonical_report_service_ts().split("async generateForSignal",1)[1]
        insert_block = "async generateForSignal" + insert_block.rsplit("}",1)[0] + "}\n"
        txt = re.sub(r"(export\s+class\s+ReportService\s*\{)", r"\1\n" + insert_block + "\n", txt, count=1, flags=re.S)
        changed = True
        log("report.service.ts: add generateForSignal")

    if changed:
        write_text(p, txt, apply)
        log("backend-nest/src/services/report.service.ts: patched")
    else:
        log("backend-nest/src/services/report.service.ts: OK")

def patch_signal_module(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "backend-nest/src/signal/signal.module.ts"
    txt = read_text(p)
    if txt is None:
        log("backend-nest/src/signal/signal.module.ts: SKIP (file not found)")
        return

    backup_file(repo_root, backup_root, p, log)
    changed = False

    # убрать импорт из './signal.service'
    txt2, ok = regex_sub_once(r"import\s+\{\s*SignalService\s*\}\s+from\s+'\.\/signal\.service';\s*", "", txt)
    if ok:
        changed = True
        txt = txt2
        log("signal.module.ts: remove ./signal.service import")

    # добавить import из ../services/signal.service
    if not re.search(r"from\s+'\.\./services/signal\.service'", txt):
        txt = re.sub(r"(import\s+Signal\s+from\s+'.*?';)", r"\1\nimport { SignalService } from '../services/signal.service';", txt, count=1, flags=re.S)
        changed = True
        log("signal.module.ts: add import { SignalService } from ../services/signal.service")

    # добавить import ReportService
    if not re.search(r"from\s+'\.\./services/report\.service'", txt):
        txt = re.sub(r"(import\s+Signal\s+from\s+'.*?';)", r"\1\nimport { ReportService } from '../services/report.service';", txt, count=1, flags=re.S)
        changed = True
        log("signal.module.ts: add import { ReportService } from ../services/report.service")

    # добавить ReportService в providers
    m = re.search(r"providers\s*:\s*\[([^\]]*)\]", txt, flags=re.S)
    if m and "ReportService" not in m.group(1):
        inner = m.group(1).strip()
        inner2 = (inner + ", ReportService") if inner else "ReportService"
        txt = txt[:m.start(1)] + inner2 + txt[m.end(1):]
        changed = True
        log("signal.module.ts: add ReportService to providers")

    # добавить ReportService в exports
    m = re.search(r"exports\s*:\s*\[([^\]]*)\]", txt, flags=re.S)
    if m and "ReportService" not in m.group(1):
        inner = m.group(1).strip()
        inner2 = (inner + ", ReportService") if inner else "ReportService"
        txt = txt[:m.start(1)] + inner2 + txt[m.end(1):]
        changed = True
        log("signal.module.ts: add ReportService to exports")

    if changed:
        write_text(p, txt, apply)
        log("backend-nest/src/signal/signal.module.ts: patched")
    else:
        log("backend-nest/src/signal/signal.module.ts: OK")

# ----------------------- патчи frontend -----------------------

def patch_api_calls_in_file(p: Path, repo_root: Path, backup_root: Path, apply: bool, log) -> bool:
    txt = read_text(p)
    if not txt:
        return False
    orig = txt

    # http://localhost:3001/api → /api
    txt = re.sub(r"https?://localhost:\d+/api", "/api", txt)

    # ${config.API_BASE_URL}/api → /api
    txt = re.sub(r"\$\{[^}]*API_BASE_URL[^}]*\}/api", "/api", txt)
    txt = re.sub(r"config\.API_BASE_URL\s*\+\s*['\"]/??api['\"]", "'/api'", txt)

    # ${API_BASE_URL}/... → /...
    txt = re.sub(r"\$\{[^}]*API_BASE_URL[^}]*\}/", "/", txt)

    # Чистый http://localhost:3001 → /api (базовый URL)
    txt = txt.replace("http://localhost:3001", "/api")
    txt = txt.replace("'localhost:3001'", "'/api'")
    txt = txt.replace('"localhost:3001"', '"/api"')

    if txt != orig:
        backup_file(repo_root, backup_root, p, log)
        write_text(p, txt, apply)
        rel = p.resolve().as_posix().removeprefix(repo_root.resolve().as_posix()).lstrip("/")
        log(f"{rel}: API → /api")
        return True
    return False

def patch_frontend_api(repo_root: Path, backup_root: Path, apply: bool, log):
    fe = repo_root / "frontend"
    if not fe.exists():
        log("frontend/: SKIP (folder not found)")
        return

    # правим все исходники
    for p in fe.rglob("*"):
        if p.suffix.lower() in (".ts", ".tsx", ".js", ".jsx") and (fe / "src") in p.parents:
            try:
                patch_api_calls_in_file(p, repo_root, backup_root, apply, log)
            except Exception as e:
                log(f"{p}: ERROR patch_api_calls — {e}")

    # правим импорты ./contexts/AuthContext → ../contexts/AuthContext
    for p in (fe / "src").rglob("*"):
        if p.suffix.lower() in (".ts", ".tsx", ".js", ".jsx") and re.search(r"/src/(pages|components)/", p.as_posix()):
            txt = read_text(p)
            if not txt:
                continue
            if re.search(r"from\s+['\"]/\.\/contexts/AuthContext['\']", txt):
                backup_file(repo_root, backup_root, p, log)
                txt = re.sub(r"from\s+['\"]/\.\/contexts/AuthContext['\']",
                             "from '../contexts/AuthContext'",
                             txt)
                write_text(p, txt, apply)
                rel = p.resolve().as_posix().removeprefix(repo_root.resolve().as_posix()).lstrip("/")
                log(f"{rel}: import fix ./contexts → ../contexts")

def canonical_vite_config_ts() -> str:
    return """import { defineConfig } from 'vite';
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
        rewrite: (p) => p.replace(/^\\/api/, ''),
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
"""

def patch_vite_config(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/vite.config.ts"
    curr = read_text(p)
    can = canonical_vite_config_ts()
    if curr is None:
        write_text(p, can, apply)
        log("frontend/vite.config.ts: created with /api + /socket.io proxy")
        return
    if ("'/api'" not in curr) or ("/socket.io" not in curr):
        backup_file(repo_root, backup_root, p, log)
        write_text(p, can, apply)
        log("frontend/vite.config.ts: patched → /api (rewrite) + /socket.io (ws)")
    else:
        log("frontend/vite.config.ts: OK")

def canonical_nginx_conf() -> str:
    # одинарные кавычки не нужны — Python не подставляет $‑переменные
    return """server {
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
"""

def patch_nginx_conf(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/nginx.conf"
    curr = read_text(p)
    can = canonical_nginx_conf()
    if curr is None:
        write_text(p, can, apply)
        log("frontend/nginx.conf: created")
        return
    need = ("location /api/" not in curr) or ("location /socket.io/" not in curr)
    if need:
        backup_file(repo_root, backup_root, p, log)
        write_text(p, can, apply)
        log("frontend/nginx.conf: patched (api + socket.io)")
    else:
        log("frontend/nginx.conf: OK")

    # удалить прочие nginx*.conf
    fe = repo_root / "frontend"
    for extra in fe.rglob("nginx*.conf"):
        if extra.resolve() != p.resolve():
            backup_file(repo_root, backup_root, extra, log)
            if apply:
                try:
                    extra.unlink()
                except Exception:
                    pass
            rel = extra.resolve().as_posix().removeprefix(repo_root.resolve().as_posix()).lstrip("/")
            log(f"remove extra nginx conf → {rel}")

def ensure_config_js(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/src/config.js"
    if p.exists():
        log("frontend/src/config.js: OK")
        return
    content = (
        "const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';\n"
        "export default { API_BASE_URL };\n"
    )
    write_text(p, content, apply)
    log("frontend/src/config.js: created shim")

def patch_package_json(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/package.json"
    if not p.exists():
        log("frontend/package.json: SKIP (not found)")
        return
    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        log(f"frontend/package.json: ERROR json — {e}")
        return

    if "scripts" not in obj or not isinstance(obj["scripts"], dict):
        obj["scripts"] = {}
    changed = False

    # build → vite build
    b = obj["scripts"].get("build")
    if (b and re.search(r"\btsc\b", b)) or (b is None):
        obj["scripts"]["build"] = "vite build"
        changed = True
        log("frontend/package.json: scripts.build → 'vite build'")

    # add typecheck
    if "typecheck" not in obj["scripts"]:
        obj["scripts"]["typecheck"] = "tsc -p tsconfig.json --noEmit"
        changed = True
        log("frontend/package.json: add scripts.typecheck")

    if changed:
        backup_file(repo_root, backup_root, p, log)
        if apply:
            p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

def patch_tsconfig_json(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/tsconfig.json"
    if not p.exists():
        log("frontend/tsconfig.json: SKIP (not found)")
        return
    try:
        obj = json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:
        log(f"frontend/tsconfig.json: ERROR json — {e}")
        return

    co = obj.get("compilerOptions") or {}
    changed = False

    def set_opt(key, val):
        nonlocal changed
        if co.get(key) != val:
            co[key] = val
            changed = True

    set_opt("jsx", "react-jsx")
    set_opt("noUnusedLocals", False)
    set_opt("skipLibCheck", True)
    set_opt("allowJs", True)
    set_opt("esModuleInterop", True)

    if changed:
        obj["compilerOptions"] = co
        backup_file(repo_root, backup_root, p, log)
        if apply:
            p.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        log("frontend/tsconfig.json: patched")
    else:
        log("frontend/tsconfig.json: OK")

def patch_vibrate(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/src/components/EmergencyAlert.tsx"
    txt = read_text(p)
    if not txt:
        log("frontend/src/components/EmergencyAlert.tsx: SKIP (not found)")
        return
    orig = txt
    # new Notification('...', { ... })  →  { ... } as NotificationOptions & { vibrate?: number[] }
    txt = re.sub(
        r"(new\s+Notification\(\s*[^,]+,\s*)\{([\s\S]*?)\}",
        lambda m: f"{m.group(1)}{{ {m.group(2)} }} as NotificationOptions & {{ vibrate?: number[] }}",
        txt
    )
    if txt != orig:
        backup_file(repo_root, backup_root, p, log)
        write_text(p, txt, apply)
        log("frontend/src/components/EmergencyAlert.tsx: patched vibrate cast")
    else:
        log("frontend/src/components/EmergencyAlert.tsx: no change")

def patch_socket_client(repo_root: Path, backup_root: Path, apply: bool, log):
    p = repo_root / "frontend/src/services/BackendService.ts"
    txt = read_text(p)
    if not txt:
        log("frontend/src/services/BackendService.ts: SKIP (not found)")
        return
    if "socket.io-client" not in txt:
        log("frontend/src/services/BackendService.ts: OK/unchanged (no socket.io client)")
        return

    orig = txt
    # Простейшая нормализация: если нет path='/socket.io', подставим универсальный вызов
    if "path:" not in txt or "/socket.io" not in txt:
        txt = re.sub(
            r"io\(([^)]*)\)",
            "io('/', { path: '/socket.io', transports: ['websocket','polling'] })",
            txt
        )

    if txt != orig:
        backup_file(repo_root, backup_root, p, log)
        write_text(p, txt, apply)
        log("frontend/src/services/BackendService.ts: ensure socket.io path + transports")
    else:
        log("frontend/src/services/BackendService.ts: OK/unchanged")

def cleanup_duplicates(repo_root: Path, backup_root: Path, apply: bool, log):
    dup = repo_root / "frontend-static/backend-nest"
    if dup.exists():
        backup_file(repo_root, backup_root, dup, log)
        if apply:
            shutil.rmtree(dup, ignore_errors=True)
        log("frontend-static/backend-nest: removed (duplicate backend)")
    else:
        log("frontend-static/backend-nest: OK (absent)")

# ----------------------- DB migration -----------------------

def migrate_db(log):
    cmd = [
        "docker", "compose", "exec", "-T", "postgres",
        "psql", "-U", "ssto", "-d", "sstodb",
        "-c", "ALTER TABLE signals ADD COLUMN IF NOT EXISTS vessel_name VARCHAR(255);"
    ]
    log(f"RUN: {' '.join(cmd)}")
    try:
        res = subprocess.run(cmd, check=False, capture_output=True, text=True)
        if res.returncode == 0:
            log("DB migration: OK")
        else:
            log(f"DB migration: FAIL (exit={res.returncode})")
            if res.stdout:
                log(res.stdout.strip())
            if res.stderr:
                log(res.stderr.strip())
    except Exception as e:
        log(f"DB migration: ERROR {e}")

# ----------------------- main -----------------------

def main():
    parser = argparse.ArgumentParser(description="Apply unified corrections to TEST SSKO project.")
    parser.add_argument("--apply", action="store_true", help="Записать изменения (по умолчанию только отчёт).")
    parser.add_argument("--patch-vibrate", action="store_true", help="Патч NotificationOptions.vibrate в EmergencyAlert.tsx.")
    parser.add_argument("--patch-socket-client", action="store_true", help="Патч socket.io-клиента (path=/socket.io).")
    parser.add_argument("--migrate-db", action="store_true", help="ALTER TABLE signals ADD COLUMN vessel_name ... (docker compose exec).")
    parser.add_argument("--repo-root", default=".", help="Корень репозитория (по умолчанию текущая папка).")
    args = parser.parse_args()

    repo_root = Path(args.repo_root).resolve()
    if not (repo_root / "backend-nest").exists():
        print(f"Запустите из корня репозитория (где папка backend-nest). Текущий: {repo_root}")
        sys.exit(1)

    ts = now_stamp()
    backup_root = repo_root / f"apply-backup-{ts}"
    report_path = repo_root / f"apply-report-{ts}.txt"
    log = Logger(report_path)

    log(f"=== APPLY START {dt.datetime.now().isoformat(timespec='seconds')} ===")
    log(f"Mode: {'APPLY' if args.apply else 'DRY-RUN'}")
    log(f"Repo: {repo_root}")

    # BACKEND
    patch_signal_model(repo_root, backup_root, args.apply, log)
    patch_report_service(repo_root, backup_root, args.apply, log)
    patch_signal_module(repo_root, backup_root, args.apply, log)

    # FRONTEND
    patch_frontend_api(repo_root, backup_root, args.apply, log)
    patch_vite_config(repo_root, backup_root, args.apply, log)
    patch_nginx_conf(repo_root, backup_root, args.apply, log)
    ensure_config_js(repo_root, backup_root, args.apply, log)
    patch_package_json(repo_root, backup_root, args.apply, log)
    patch_tsconfig_json(repo_root, backup_root, args.apply, log)

    if args.patch_vibrate:
        patch_vibrate(repo_root, backup_root, args.apply, log)
    if args.patch_socket_client:
        patch_socket_client(repo_root, backup_root, args.apply, log)

    cleanup_duplicates(repo_root, backup_root, args.apply, log)

    # DB
    if args.migrate_db:
        migrate_db(log)
    else:
        log("DB migration: skipped (no --migrate-db)")

    log(f"Backups: {backup_root}")
    log(f"Report:  {report_path}")
    if not args.apply:
        log("[DRY-RUN] Изменения НЕ записаны. Запустите с --apply для применения.")
    log(f"=== APPLY END {dt.datetime.now().isoformat(timespec='seconds')} ===")

if __name__ == "__main__":
    main()
