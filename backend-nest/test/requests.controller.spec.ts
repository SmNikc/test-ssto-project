import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

import { RequestsController } from '../src/controllers/requests.controller';
import { RequestService } from '../src/request/request.service';

describe('RequestsController (unit over HTTP, no DB)', () => {
  let app: INestApplication;

  const mockRequestService = {
    findAll: jest.fn().mockResolvedValue([]),
    findPending: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue({
      id: 1,
      toJSON() { return { id: 1 }; },
      getDataValue: (_k: string) => undefined,
    }),
    create: jest.fn().mockResolvedValue({
      id: 2,
      toJSON() { return { id: 2 }; },
      getDataValue: (_k: string) => undefined,
    }),
    update: jest.fn().mockResolvedValue(undefined),
    updateStatus: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue({ deleted: true }),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [{ provide: RequestService, useValue: mockRequestService }],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /requests -> 200 { success:true, count:0, data:[] }', async () => {
    const res = await request(app.getHttpServer()).get('/requests');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 0, data: [] });
    expect(mockRequestService.findAll).toHaveBeenCalled();
  });

  it('GET /requests/pending -> 200 { success:true, count:0, data:[] }', async () => {
    const res = await request(app.getHttpServer()).get('/requests/pending');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 0, data: [] });
    expect(mockRequestService.findPending).toHaveBeenCalled();
  });
});
