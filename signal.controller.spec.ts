// backend-nest/test/unit/signal.controller.spec.ts
import { Test } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { SignalController } from '../../src/signal/signal.controller';
import { SignalService } from '../../src/signal/signal.service';

describe('SignalController (unit)', () => {
  it('getUnmatched -> returns items with suggestions/operator_messages', async () => {
    const service = {
      getUnmatchedWithSuggestions: jest.fn().mockResolvedValue({
        count: 1,
        items: [{
          id: 123,
          received_at: '2025-10-05T10:30:00Z',
          terminal_number: '427315936',
          suggestions: [{ requestId: 45, score: 75, reasons: ['MMSI','TIME'] }],
          operator_messages: ['Автопривязка не выполнена: нет заявки с таким IMN'],
          topScore: 75,
        }]
      }),
      manualLink: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [{ provide: SignalService, useValue: service }],
    }).compile();

    const controller = moduleRef.get(SignalController);
    const res = await controller.getUnmatched('100', '0', 'score', 'desc');
    expect(res.count).toBe(1);
    expect(res.items[0].suggestions.length).toBeGreaterThan(0);
  });

  it('link -> throws 409 Conflict when IMN mismatch without override', async () => {
    const service = {
      getUnmatchedWithSuggestions: jest.fn(),
      manualLink: jest.fn().mockRejectedValue(new ConflictException('IMN differs')),
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [SignalController],
      providers: [{ provide: SignalService, useValue: service }],
    }).compile();

    const controller = moduleRef.get(SignalController);
    await expect(controller.link(123 as any, { requestId: 45 })).rejects.toThrow(ConflictException);
  });
});
