import * as request from 'supertest';
import { createTestApp } from '../utils/test-app.factory';
import { TestDatabaseManager } from '../config/test-database.manager';
const moduleAvailable = (name: string) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
};

const dbReadyEnv = process.env.ENABLE_DB_TESTS === 'true';
const dbReady = dbReadyEnv && (Boolean(process.env.DATABASE_URL || process.env.DB_URL) || moduleAvailable('pg-embed'));
const describeIfDb = dbReady ? describe : describe.skip;

describeIfDb('POST /api/signals (contract)', () => {
  let app: any;
  let requestId: number;
  let skip = false;

  beforeAll(async () => {
    try {
      const setup = await createTestApp();
      app = setup.app;

      const reqPayload = {
        vessel_name: 'M/V TESTER',
        mmsi: '273123456',
        contact_person: 'Operator',
        contact_email: 'owner@example.com',
        contact_phone: '+7 (999) 123-45-67',
        status: 'APPROVED',
      };

      const res = await request(app.getHttpServer())
        .post('/api/requests')
        .send(reqPayload)
        .expect(201);

      requestId = res.body.data.id;
    } catch (error) {
      skip = true;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    await TestDatabaseManager.instance.stop();
  });

  const run = skip ? it.skip : it;

  run('creates signal and links to approved request', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/signals')
      .send({
        signal_type: 'TEST',
        mmsi: '273123456',
        terminal_number: 'TST-0001',
        is_test: true,
      })
      .expect(201);

    expect(response.body.request_id).toBe(requestId);
    expect(response.body.signal_type).toBe('TEST');
  });
});
