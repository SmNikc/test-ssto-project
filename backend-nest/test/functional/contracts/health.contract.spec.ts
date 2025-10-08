import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { HealthController } from '../../../src/controllers/health.controller';

describe('HealthController – контракт', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('возвращает статус ok (ПП РФ №746, п. 7)', async () => {
    await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(res => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });
});
