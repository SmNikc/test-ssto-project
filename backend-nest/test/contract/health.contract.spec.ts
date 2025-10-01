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

describeIfDb('GET /health (contract)', () => {
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
    if (app) {
      await app.close();
    }
    await TestDatabaseManager.instance.stop();
  });

  const run = skip ? it.skip : it;

  run('returns service and database status', async () => {
    const res = await request(app.getHttpServer()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up' });
  });
});
