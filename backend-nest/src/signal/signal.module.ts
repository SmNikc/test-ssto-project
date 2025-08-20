
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SignalController } from '../controllers/signal.controller';
import { SignalService } from './signal.service';
import Signal from '../models/signal.model';

@Module({
  imports: [SequelizeModule.forFeature([Signal])],
  controllers: [SignalController],
  providers: [SignalService],
  exports: [SignalService],
})
export class SignalModule {}
