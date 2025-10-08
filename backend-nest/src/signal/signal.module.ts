// backend-nest/src/signal/signal.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import { SignalService } from './signal.service';
import { SignalController } from './signal.controller';

@Module({
  imports: [SequelizeModule.forFeature([Signal, SSASRequest])],
  controllers: [SignalController],
  providers: [SignalService],
  exports: [SignalService],
})
export class SignalModule {}
// pad 0
// pad 1
