// backend-nest/src/dev/dev.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DevSeedController } from './dev-seed.controller';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';

@Module({
  imports: [SequelizeModule.forFeature([Signal, SSASRequest])],
  controllers: [DevSeedController],
})
export class DevModule {}
