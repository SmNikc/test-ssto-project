import request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RequestsController } from '../src/controllers/request-ssto.controller';
import { RequestService } from '../src/request/request.service';

describe('GET /requests returns 200 with empty data on failure', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestService,
          useValue: { findAll: jest.fn().mockRejectedValue(new Error('DB down')) }
        }
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  it('should return 200 and empty array', async () => {
    const res = await request(app.getHttpServer()).get('/requests');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: false, count: 0, data: [] });
  });

  afterAll(async () => app.close());
});
