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
    if (process.env.ENABLE_TEST_SEED !== '1' && process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Seeding is disabled in production without ENABLE_TEST_SEED=1');
    }
  }

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
    const MMSI_POOL = ['273345000', '273456789', '273111222', '273987654', '273000111'];
    const NAMES = ['АРКТИКА', 'ВИТУС БЕРИНГ', 'СВАРОГ', 'БУХТА НОРДВИК', 'ГЕРОЙ ИВАН СИВКО'];

    for (let i = 0; i < count; i++) {
      const mmsi = MMSI_POOL[i % MMSI_POOL.length];
      const vessel = NAMES[i % NAMES.length];
      const receivedAt = new Date(now.getTime() - i * 15 * 60 * 1000);

      let request: SSASRequest | null = null;
      if (withSuggestions) {
        request = await this.requestModel.create({
          mmsi, vessel_name: vessel,
          planned_test_date: new Date(receivedAt.getTime() + 30 * 60 * 1000),
          status: 'pending',
          ssas_number: '999999999',
          metadata: { seed_tag: tag },
        } as any);
        createdRequests.push({ id: request.id });
      }

      const signal = await this.signalModel.create({
        terminal_number: '427000000',
        mmsi, vessel_name: vessel,
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

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clear() {
    this.ensureEnabled();
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
