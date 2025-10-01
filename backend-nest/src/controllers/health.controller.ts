// backend-nest/src/controllers/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly sequelize: Sequelize) {}

  @Get()
  async ping() {
    try {
      await this.sequelize.authenticate({ retry: { max: 0 } });
      return { status: 'ok', db: 'up' };
    } catch (error) {
      return { status: 'degraded', db: 'down', message: (error as Error).message };
    }
  }
}
