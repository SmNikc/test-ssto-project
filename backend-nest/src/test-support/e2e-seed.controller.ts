// backend-nest/src/test-support/e2e-seed.controller.ts
import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';

@Controller('__e2e__/seed')
export class E2ESeedController {
  constructor(
    @InjectModel(Signal) private readonly signalModel: typeof Signal,
    @InjectModel(SSASRequest) private readonly requestModel: typeof SSASRequest,
  ) {}

  @Post('unmatched')
  async seedUnmatched(@Body() payload: { token?: string; requests?: any[]; signals?: any[] }) {
    if (process.env.E2E_SEED_ENABLED !== '1') {
      throw new HttpException('Seeding disabled', HttpStatus.FORBIDDEN);
    }
    const expected = process.env.E2E_SEED_TOKEN || 'ci-token';
    if (!payload?.token || payload.token !== expected) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const createdRequests = [];
    const createdSignals = [];

    // Upsert requests by (id or ssas_number)
    for (const req of payload.requests ?? []) {
      let row: any = null;
      if (req.id) row = await this.requestModel.findByPk(req.id);
      if (!row && req.ssas_number) row = await this.requestModel.findOne({ where: { ssas_number: req.ssas_number } });
      if (row) {
        await row.update(req);
      } else {
        row = await this.requestModel.create(req);
      }
      createdRequests.push(row.id);
    }

    for (const sig of payload.signals ?? []) {
      const row = await this.signalModel.create({ ...sig, status: 'UNMATCHED', request_id: null });
      createdSignals.push(row.id);
    }

    return { ok: true, requestIds: createdRequests, signalIds: createdSignals };
  }
}
