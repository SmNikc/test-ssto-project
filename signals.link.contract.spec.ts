// backend-nest/tests/functional/contracts/signals.link.contract.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ConflictException } from '@nestjs/common';
import * as request from 'supertest';
import { SignalController } from '../../../src/signal/signal.controller';
import { SignalService } from '../../../src/signal/signal.service';

describe('Contract: POST /signals/:id/link', () => {
  let app: INestApplication;
  const service = {
    getUnmatchedWithSuggestions: jest.fn(),
    manualLink: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [{ provide: SignalService, useValue: service }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('links on happy path (201)', async () => {
    service.manualLink.mockResolvedValue({ ok: true, signalId: 123, requestId: 45, override: false });
    const res = await request(app.getHttpServer())
      .post('/signals/123/link')
      .send({ requestId: 45 })
      .expect(201);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('returns 409 when IMN mismatch without override', async () => {
    service.manualLink.mockRejectedValue(new ConflictException('IMN differs'));
    await request(app.getHttpServer())
      .post('/signals/123/link')
      .send({ requestId: 46 })
      .expect(409);
  });
});
