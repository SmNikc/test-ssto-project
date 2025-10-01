import { BadRequestException, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RequestsController } from '../../../src/controllers/requests.controller';
import { RequestService } from '../../../src/request/request.service';

describe('RequestsController – контракт API', () => {
  let app: INestApplication;
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
  } as unknown as RequestService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        { provide: RequestService, useValue: serviceMock },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('создаёт заявку и возвращает request_number (Приказ №115, п. 24)', async () => {
    (serviceMock.create as jest.Mock).mockResolvedValue({
      id: 42,
      mmsi: '273123456',
      vessel_name: 'M/V TESTER',
      request_number: 'REQ-2024-000042',
      toJSON() {
        return {
          id: 42,
          mmsi: '273123456',
          vessel_name: 'M/V TESTER',
          request_number: 'REQ-2024-000042',
        };
      },
    });

    await request(app.getHttpServer())
      .post('/requests')
      .send({ mmsi: '273123456', vessel_name: 'M/V TESTER' })
      .expect(201)
      .expect(res => {
        expect(res.body.success).toBe(true);
        expect(res.body.data.request_number).toBe('REQ-2024-000042');
        expect(res.body.data.mmsi).toBe('273123456');
      });
  });

  it('возвращает 400 и понятное сообщение при ошибке валидации', async () => {
    (serviceMock.create as jest.Mock).mockRejectedValue(
      new BadRequestException('MMSI and vessel_name are required'),
    );

    await request(app.getHttpServer())
      .post('/requests')
      .send({ vessel_name: 'M/V TESTER' })
      .expect(400)
      .expect(res => {
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Ошибка создания заявки');
        expect(res.body.error).toContain('MMSI');
      });
  });

  it('возвращает список заявок (годовой цикл по письму 29.05.2024)', async () => {
    (serviceMock.findAll as jest.Mock).mockResolvedValue([
      {
        id: 42,
        mmsi: '273123456',
        vessel_name: 'M/V TESTER',
        request_number: 'REQ-2024-000042',
        toJSON() {
          return {
            id: 42,
            mmsi: '273123456',
            vessel_name: 'M/V TESTER',
            request_number: 'REQ-2024-000042',
          };
        },
      },
    ]);

    await request(app.getHttpServer())
      .get('/requests')
      .expect(200)
      .expect(res => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].request_number).toBe('REQ-2024-000042');
      });
  });
});
