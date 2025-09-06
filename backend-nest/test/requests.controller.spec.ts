import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { RequestController } from '../src/controllers/request-ssto.controller';
import { RequestService } from '../src/request/request.service';

// Мок сервиса без БД
const mockRequestService = {
  findAll: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue({
    id: 1,
    mmsi: '123456789',
    vessel_name: 'Test Vessel',
    contact_person: 'Ivan',
    contact_phone: '+79991234567',
    contact_email: 'user@email.com',
    status: 'DRAFT'
  }),
  findPending: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockResolvedValue(null),
  update: jest.fn().mockResolvedValue(null),
  updateStatus: jest.fn().mockResolvedValue(null),
  remove: jest.fn().mockResolvedValue({ deleted: true })
};

describe('RequestsController (unit over HTTP, no DB)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [{ provide: RequestService, useValue: mockRequestService }]
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('GET /requests -> 200 { success:true, count:0, data:[] }', async () => {
    const res = await request(app.getHttpServer()).get('/requests');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 0, data: [] });
    expect(mockRequestService.findAll).toHaveBeenCalled();
  });

  it('POST /requests -> 201 и вызов сервиса create', async () => {
    const res = await request(app.getHttpServer())
      .post('/requests')
      .send({
        mmsi: '123456789',
        vessel_name: 'Test Vessel',
        contact_person: 'Ivan',
        contact_phone: '+79991234567',
        contact_email: 'user@email.com',
        test_datetime: new Date().toISOString()
      });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(mockRequestService.create).toHaveBeenCalled();
  });

  it('GET /requests/pending -> 200 { success:true, count:0, data:[] }', async () => {
    const res = await request(app.getHttpServer()).get('/requests/pending');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, count: 0, data: [] });
    expect(mockRequestService.findPending).toHaveBeenCalled();
  });
});
