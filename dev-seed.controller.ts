// backend-nest/src/dev/dev-seed.controller.ts
import { Body, Controller, Delete, ForbiddenException, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';

type SeedBody = { count?: number; withSuggestions?: boolean; tag?: string };

@Controller('_dev/seed')
export class DevSeedController {
  constructor(
    @InjectModel(Signal) private readonly signalModel: typeof Signal,
    @InjectModel(SSASRequest) private readonly requestModel: typeof SSASRequest,
  ) {}

  private ensureEnabled() {
    // Защита: выполнять только в тестовой среде/CI
    if (process.env.ENABLE_TEST_SEED !== '1' && process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seeding is disabled in production without ENABLE_TEST_SEED=1');
    }
  }

  /** Создаёт N несопоставленных сигналов (UNMATCHED). При withSuggestions=true — создаёт заявки-кандидаты (MMSI/Время) */
  @Post('unmatched')
  @HttpCode(HttpStatus.OK)
  async seedUnmatched(@Body() body: SeedBody) {
    this.ensureEnabled();
    const count = Math.max(1, Math.min(+(body?.count ?? 5), 100));
    const tag = body?.tag ?? 'e2e-fixture';
    const withSuggestions = body?.withSuggestions !== false;

    const now = new Date();
    const createdSignals: any[] = [];
    const createdRequests: any[] = [];

    // Базовые MMSI/имена для реалистичных подсказок
    const MMSI_POOL = ['273345000', '273456789', '273111222', '273987654', '273000111'];
    const NAMES = ['АРКТИКА', 'ВИТУС БЕРИНГ', 'СВАРОГ', 'БУХТА НОРДВИК', 'ГЕРОЙ ИВАН СИВКО'];

    for (let i = 0; i < count; i++) {
      const mmsi = MMSI_POOL[i % MMSI_POOL.length];
      const vessel = NAMES[i % NAMES.length];
      const receivedAt = new Date(now.getTime() - i * 15 * 60 * 1000); // каждые 15 минут назад

      // Создаём заявку-кандидат с совпадающим MMSI и близким временем, но ДРУГИМ IMN → только подсказка
      let request: SSASRequest | null = null;
      if (withSuggestions) {
        request = await this.requestModel.create({
          mmsi,
          imo_number: null,
          vessel_name: vessel,
          planned_test_date: new Date(receivedAt.getTime() + 30 * 60 * 1000), // +30 мин
          status: 'pending',
          ssas_number: '999999999', // намеренно отличается от сигнала
          metadata: { seed_tag: tag },
        } as any);
        createdRequests.push({ id: request.id });
      }

      const signal = await this.signalModel.create({
        terminal_number: '427000000', // намеренно не совпадает с заявкой
        mmsi,
        vessel_name: vessel,
        signal_type: 'EMAIL',
        received_at: receivedAt,
        status: 'UNMATCHED',
        request_id: null,
        metadata: { seed_tag: tag, reason: 'unmatched-e2e' },
      } as any);
      createdSignals.push({ id: signal.id });
    }

    return { ok: true, createdSignals, createdRequests };
  }

  /** Удаляет записи, помеченные seed_tag */
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clear() {
    this.ensureEnabled();
    const whereSignals: any = { metadata: { seed_tag: 'e2e-fixture' } };
    const whereRequests: any = { metadata: { seed_tag: 'e2e-fixture' } };

    // sequelize doesn't support JSONB equality in all dialects here; fallback to LIKE on serialized JSON if needed
    const deletedSignals = await this.signalModel.destroy({
      where: {
        [Op.or]: [
          { metadata: { seed_tag: 'e2e-fixture' } } as any,
          { status: 'UNMATCHED', terminal_number: '427000000' } as any,
        ],
      },
    });
    const deletedRequests = await this.requestModel.destroy({
      where: { [Op.or]: [{ status: 'pending', mmsi: { [Op.in]: ['273345000','273456789','273111222','273987654','273000111'] } }] },
    });
    return { ok: true, deletedSignals, deletedRequests };
  }
}
