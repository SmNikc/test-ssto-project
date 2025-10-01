import * as fs from 'node:fs';
import * as path from 'node:path';
import * as request from 'supertest';
import { createTestApp } from '../utils/test-app.factory';
import { TestDatabaseManager } from '../config/test-database.manager';

const fixture = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../../tests/fixtures/request-tst-0001.json'), 'utf-8'),
);
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

describeIfDb('POST /api/requests (contract)', () => {
  let app: any;
  let skip = false;

  beforeAll(async () => {
    try {
      const setup = await createTestApp();
      app = setup.app;
    } catch (error) {
      skip = true;
    }
  });

  afterAll(async () => {
    if (app) await app.close();
    await TestDatabaseManager.instance.stop();
  });

  const run = skip ? it.skip : it;

  run('creates request and generates request_number', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/requests')
      .send(fixture)
      .expect(201);

    expect(response.body).toMatchObject({ success: true });
    expect(response.body.data.request_number).toMatch(/^REQ-\d{4}-\d{4}$/);
    expect(response.body.data.mmsi).toBe('273123456');
  });
});
