// backend-nest/tests/functional/contracts/signals.unmatched.contract.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SignalController } from '../../../src/signal/signal.controller';
import { SignalService } from '../../../src/signal/signal.service';

describe('Contract: GET /signals/unmatched', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [{
        provide: SignalService,
        useValue: {
          getUnmatchedWithSuggestions: jest.fn().mockResolvedValue({
            count: 1,
            items: [{
              id: 123,
              received_at: new Date('2025-10-05T10:30:00Z').toISOString(),
              terminal_number: '432198765',
              vessel_name: 'АРКТИКА',
              mmsi: '273345000',
              operator_messages: [
                'Автопривязка не выполнена: в активных заявках нет заявки с таким IMN/SSAS.'
              ],
              suggestions: [
                { requestId: 45, score: 75, reasons: ['MMSI','TIME'] }
              ],
              topScore: 75,
            }]
          }),
          manualLink: jest.fn(),
        }
      }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns {count, items[]} with suggestions and operator_messages', async () => {
    const res = await request(app.getHttpServer())
      .get('/signals/unmatched?sort=score&dir=desc')
      .expect(200);

    expect(res.body).toHaveProperty('count', 1);
    expect(Array.isArray(res.body.items)).toBe(true);
    const first = res.body.items[0];
    expect(first).toHaveProperty('suggestions');
    expect(first).toHaveProperty('operator_messages');
  });
});
