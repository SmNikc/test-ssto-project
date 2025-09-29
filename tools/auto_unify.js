--- FILE: tools/auto_unify.js
/* eslint-disable no-console */
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

function ensureDir(p) { return fsp.mkdir(path.dirname(p), { recursive: true }); }
async function ensureFile(p, content) {
  await ensureDir(p);
  await fsp.writeFile(p, content, 'utf8');
  console.log(`[write] ${p}`);
}
async function readIfExists(p) {
  try { return await fsp.readFile(p, 'utf8'); } catch { return null; }
}
async function exists(p) { try { await fsp.access(p); return true; } catch { return false; } }

function replaceAll(content, from, to) {
  return content.split(from).join(to);
}

async function patchViteProxy(vitePath) {
  const src = await readIfExists(vitePath);
  if (!src) return;
  let out = src;
  const hasProxy = /server:\s*{[\s\S]*proxy:\s*{[\s\S]*\/api/.test(src);
  if (!hasProxy) {
    // Add dev server proxy to /api -> localhost:3001
    out = src.replace(/defineConfig\(\{/, `defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },`);
  }
  if (out !== src) {
    await ensureFile(vitePath, out);
    console.log('[patch] vite proxy /api -> :3001');
  } else {
    console.log('[ok] vite proxy already present');
  }
}

async function fixAuthImports(frontRoot) {
  const folders = ['src/pages', 'src/components'];
  for (const dir of folders) {
    const dirPath = path.join(frontRoot, dir);
    if (!(await exists(dirPath))) continue;
    const files = (await fsp.readdir(dirPath, { withFileTypes: true }))
      .filter(d => d.isFile() && d.name.endsWith('.tsx'))
      .map(d => path.join(dirPath, d.name));
    for (const f of files) {
      const content = await readIfExists(f);
      if (!content) continue;
      const patched = content
        .replace(/from\s+["']\.\/contexts\/AuthContext["']/g, `from '../contexts/AuthContext'`)
        .replace(/http:\/\/localhost:\d+\/?/g, ''); // enforce relative fetch
      if (patched !== content) {
        await ensureFile(f, patched);
        console.log(`[patch] imports/URLs: ${f}`);
      }
    }
  }
}

async function ensureNginxConf(frontRoot) {
  const nginxPath = path.join(frontRoot, 'nginx.conf');
  const content = `
user  nginx;
worker_processes  auto;
events { worker_connections 1024; }
http {
  include       mime.types;
  default_type  application/octet-stream;
  sendfile        on;
  keepalive_timeout  65;

  server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
      proxy_pass http://backend:3001/;
      proxy_http_version 1.1;
      proxy_set_header   Upgrade $http_upgrade;
      proxy_set_header   Connection 'upgrade';
      proxy_set_header   Host $host;
    }

    location / {
      try_files $uri /index.html;
    }
  }
}
`.trim() + '\n';
  await ensureFile(nginxPath, content);
}

async function ensureDockerComposeOverride() {
  const content = `
--- 
services:
  backend:
    environment:
      SMTP_HOST: mailhog
      SMTP_PORT: "1025"
      SMTP_SECURE: "false"
      SMTP_FROM: "no-reply@ssto.local"
      SMTP_FROM_NAME: "ГМСКЦ «Тест ССТО»"
      BASE_PUBLIC_URL: "http://localhost"
    depends_on:
      - mailhog

  mailhog:
    image: mailhog/mailhog:v1.0.1
    restart: unless-stopped
    ports:
      - "8025:8025"
      - "1025:1025"
`.trim() + '\n';
  await ensureFile('docker-compose.override.yml', content);
}

async function ensureSmokeSh() {
  const content = `#!/usr/bin/env bash
set -euo pipefail

API_BASE="\${API_BASE:-http://localhost:3001}"
MAILHOG="\${MAILHOG:-http://localhost:8025}"

echo "[SMOKE] /health"
curl -fsS "\${API_BASE}/health" | jq . || (echo "health failed" && exit 1)

echo "[SMOKE] login (operator)"
TOK=$(curl -fsS -X POST "\${API_BASE}/api/auth/login" -H 'Content-Type: application/json' \
  -d '{"username":"operator","password":"operator"}' | jq -r '.access_token')
test -n "\$TOK"

echo "[SMOKE] create request"
REQ=$(curl -fsS -X POST "\${API_BASE}/api/requests" -H "Authorization: Bearer \$TOK" -H 'Content-Type: application/json' \
  -d '{"terminal_number":"TST-0001","vessel_name":"M/V TESTER","mmsi":"273123456","owner_email":"owner@example.com"}' | jq -r '.id')
echo "request id=\$REQ"

echo "[SMOKE] send TEST signal (matched)"
SIG=$(curl -fsS -X POST "\${API_BASE}/api/signals" -H "Authorization: Bearer \$TOK" -H 'Content-Type: application/json' \
  -d '{"signal_type":"TEST","terminal_number":"TST-0001","payload":{"source":"smoke"}}' | jq -r '.id')
echo "signal id=\$SIG"

echo "[SMOKE] generate PDF"
curl -fsS -X POST "\${API_BASE}/api/signals/generate-report/\$SIG" -H "Authorization: Bearer \$TOK" -o /tmp/report.pdf
test -s /tmp/report.pdf && echo "PDF ok: /tmp/report.pdf"

echo "[SMOKE] snapshot MailHog"
curl -fsS "\${MAILHOG}/api/v2/messages" | tee tests/mailhog-snapshot.json >/dev/null
echo "[SMOKE] done"
`;
  await ensureFile('tests/smoke.sh', content);
  await fsp.chmod('tests/smoke.sh', 0o755);
}

async function ensureAssertPdf() {
  const content = `const fs = require('fs');
const pdf = require('pdf-parse');

(async () => {
  const file = process.argv[2] || '/tmp/report.pdf';
  const needle = process.argv[3] || 'МИНТРАНС';
  const data = fs.readFileSync(file);
  const txt = (await pdf(data)).text;
  if (!txt.includes(needle)) {
    console.error('PDF assertion failed: cannot find', needle);
    process.exit(2);
  }
  console.log('[assert] PDF contains:', needle);
})();
`;
  await ensureFile('tests/assert-pdf.js', content);
}

async function ensureSeedScripts() {
  const js = `// seed-dev.js (HTTP, no ts-node required)
const base = process.env.API_BASE || 'http://localhost:3001';
(async () => {
  const r = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'operator', password:'operator'})});
  if (!r.ok) { console.log('login failed'); process.exit(0); }
  const {access_token} = await r.json();
  const h = { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' };
  const rq = await fetch(base + '/api/requests', {method:'POST', headers:h, body: JSON.stringify({terminal_number:'TST-0001', vessel_name:'M/V TESTER', mmsi:'273123456', owner_email:'owner@example.com'})});
  const jr = await rq.json(); console.log('[seed] request id:', jr.id);
})().catch(()=>process.exit(0));
`;
  const ts = `import 'dotenv/config';
const base = process.env.API_BASE || 'http://localhost:3001';
async function main() {
  const r = await fetch(base + '/api/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({username:'operator', password:'operator'})});
  if (!r.ok) { console.log('login failed'); return; }
  const {access_token} = await r.json();
  const h = { 'Authorization': 'Bearer ' + access_token, 'Content-Type': 'application/json' };
  const rq = await fetch(base + '/api/requests', {method:'POST', headers:h, body: JSON.stringify({terminal_number:'TST-0001', vessel_name:'M/V TESTER', mmsi:'273123456', owner_email:'owner@example.com'})});
  const jr = await rq.json(); console.log('[seed] request id:', jr.id);
}
main();
`;
  await ensureFile('scripts/seed-dev.js', js);
  await ensureFile('scripts/seed-dev.ts', ts);
}

async function ensureSmokeHttp() {
  const content = `### FILE: tests/smoke.http (VSCode REST Client)
# @name health
GET http://localhost:3001/health

###
# @name login
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{"username":"operator","password":"operator"}

###
# @name create_request
POST http://localhost:3001/api/requests
Content-Type: application/json
Authorization: Bearer {{login.response.body.$.access_token}}

{"terminal_number":"TST-0001","vessel_name":"M/V TESTER","mmsi":"273123456","owner_email":"owner@example.com"}
`;
  await ensureFile('tests/smoke.http', content);
}

async function ensurePrTemplate() {
  const content = `# Unify structure + fix build + CI for «Тест ССТО»

## Что сделано
- Структура фронта/бэка приведена к канону (/api через Vite/nginx)
- MailHog добавлен (docker-compose.override.yml)
- Smoke скрипты + проверка PDF шапки
- CI: сборка, запуск стека, smoke, артефакты

## Логи/артефакты
- \`tests/smoke.log\`
- \`/tmp/report.pdf\`
- \`tests/mailhog-snapshot.json\`

## Чек‑лист AC
- [ ] S1: TEST+заявка → PDF+письмо (MailHog)
- [ ] S2: TEST без заявки → fallback PDF
- [ ] S3: ALERT → PDF+письмо
- [ ] S4: CANCEL → закрытие/письмо
- [ ] S6: client /api/logs → 403

## Дальше
- Добавить полноценные E2E (supertest/Playwright)
`;
  await ensureFile('.github/PULL_REQUEST_TEMPLATE.md', content);
}

async function main() {
  // 1) Frontend patches
  if (await exists('frontend')) {
    await fixAuthImports('frontend');
    await patchViteProxy(path.join('frontend', 'vite.config.ts'));
    await ensureNginxConf('frontend');
  } else {
    console.log('[skip] frontend not found');
  }

  // 2) Compose override + tests + scripts
  await ensureDockerComposeOverride();
  await ensureSmokeSh();
  await ensureAssertPdf();
  await ensureSeedScripts();
  await ensureSmokeHttp();

  // 3) Done
  console.log('[done] auto_unify.js finished');
}
main().catch(e => { console.error(e); process.exit(1); });
