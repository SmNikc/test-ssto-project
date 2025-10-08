// backend-nest/src/test-support/test-support.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import { E2ESeedController } from './e2e-seed.controller';

@Module({
  imports: [SequelizeModule.forFeature([Signal, SSASRequest])],
  controllers: [E2ESeedController],
})
export class TestSupportModule {}
