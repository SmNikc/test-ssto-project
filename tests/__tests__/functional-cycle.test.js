const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const request = require('supertest');
const pdfParse = require('pdf-parse');
const { BASE_URL, ARTIFACTS_DIR } = require('../config');
const { purgeMailhog, waitForMail } = require('../lib/mailhog');

const client = request(BASE_URL);

const context = {
  logs: [],
  requestId: null,
  signalId: null,
  pdfPath: null,
  pdfLocal: null,
  confirmationResponse: null,
  token: null,
};

function record(message, payload = undefined) {
  const line = `[${new Date().toISOString()}] ${message}${payload ? ` :: ${JSON.stringify(payload)}` : ''}`;
  context.logs.push(line);
}

describe('AC S1–S6: функциональный цикл ССТО', () => {
  beforeAll(async () => {
    record('Preparing MailHog inbox purge');
    await purgeMailhog();
  });

  afterAll(() => {
    const logPath = path.join(ARTIFACTS_DIR, 'functional-cycle.log');
    fs.writeFileSync(logPath, context.logs.join('\n') + '\n', 'utf8');
    if (context.pdfPath && context.pdfLocal) {
      const metaPath = path.join(ARTIFACTS_DIR, 'pdf-metadata.json');
      const meta = {
        pdf_path_container: context.pdfPath,
        pdf_path_local: context.pdfLocal,
        request_id: context.requestId,
        signal_id: context.signalId,
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), 'utf8');
    }
  });

  test('S1: /health возвращает ok', async () => {
    const res = await client.get('/health');
    record('Health response', { status: res.status, body: res.body });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });

  test('S2: оператор авторизуется и получает токен', async () => {
    const res = await client
      .post('/auth/login')
      .send({ email: 'operator@test.com', password: 'secret' });
    record('Login response', { status: res.status, body: res.body });
    expect(res.status).toBe(200);
    const token = res.body.accessToken || res.body.access_token;
    expect(token).toBeDefined();
    context.token = token;
  });

  test('S3: создаём заявку, одобряем и связываем тестовый сигнал', async () => {
    const now = Date.now();
    const requestPayload = {
      vessel_name: `AUTOTEST VESSEL ${now}`,
      mmsi: `273${String(now).slice(-6)}`,
      ssas_number: `AUTO-${now}`,
      contact_email: 'od_smrcc@morflot.ru',
      contact_person: 'QA Operator',
      contact_phone: '+79995556677',
      status: 'APPROVED',
    };

    const createRes = await client.post('/requests').send(requestPayload);
    record('Create request response', { status: createRes.status, body: createRes.body });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty('data.id');
    const requestId = createRes.body.data.id;
    context.requestId = requestId;

    const approveRes = await client
      .put(`/requests/${requestId}`)
      .send({ status: 'APPROVED' });
    record('Approve request response', { status: approveRes.status, body: approveRes.body });
    expect([200, 201]).toContain(approveRes.status);

    const signalPayload = {
      mmsi: requestPayload.mmsi,
      vessel_name: requestPayload.vessel_name,
      signal_type: 'TEST',
      status: 'active',
      is_test: true,
      terminal_number: `TERM-${now}`,
    };
    const signalRes = await client.post('/signals').send(signalPayload);
    record('Create signal response', { status: signalRes.status, body: signalRes.body });
    expect([200, 201]).toContain(signalRes.status);
    expect(signalRes.body).toHaveProperty('id');
    const signalId = signalRes.body.id;
    context.signalId = signalId;

    const linkRes = await client.post(`/signals/${signalId}/link/${requestId}`).send();
    record('Link signal response', { status: linkRes.status, body: linkRes.body });
    expect([200, 201]).toContain(linkRes.status);
  });

  test('S4/S6: отправляем подтверждение, проверяем PDF и письмо', async () => {
    expect(context.requestId).toBeTruthy();
    const res = await client
      .post(`/api/requests/${context.requestId}/send-confirmation`)
      .send({ send_email: true, generate_pdf: true, test_mode: true });
    record('Send confirmation response', { status: res.status, body: res.body });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data.pdf_path');
    const pdfPath = res.body.data.pdf_path;
    expect(pdfPath).toBeTruthy();
    context.pdfPath = pdfPath;
    context.confirmationResponse = res.body;

    const localPdf = path.join(ARTIFACTS_DIR, `confirmation-${context.requestId}.pdf`);
    const copyResult = spawnSync('docker', ['cp', `ssto-backend:${pdfPath}`, localPdf]);
    if (copyResult.status !== 0) {
      const stderr = copyResult.stderr?.toString() || 'unknown error';
      record('docker cp failed', { stderr });
      throw new Error(`docker cp failed: ${stderr}`);
    }
    context.pdfLocal = localPdf;
    const pdfBuffer = fs.readFileSync(localPdf);
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text;
    expect(text).toContain('МИНТРАНС РОССИИ');
    expect(text).toContain('РОСМОРРЕЧФЛОТ');
    expect(text).toMatch(/od_smrcc@morflot\.ru/i);

    const message = await waitForMail(item => {
      const to = item.Content?.Headers?.To || item.Raw?.To || [];
      return Array.isArray(to) && to.some(addr => /od_smrcc@morflot\.ru/i.test(addr));
    }, { timeoutMs: 30000, intervalMs: 2000 });
    const summary = {
      id: message.ID,
      subject: (message.Content?.Headers?.Subject || [null])[0],
      to: message.Content?.Headers?.To || message.Raw?.To,
      created: message.Created,
    };
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'mailhog-summary.json'),
      JSON.stringify(summary, null, 2),
      'utf8',
    );
    record('MailHog message captured', summary);
  });
});
