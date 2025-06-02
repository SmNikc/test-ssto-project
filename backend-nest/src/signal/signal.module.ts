import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import { SignalController } from '../controllers/signalController';
import { SignalService } from './signal.service';

@Module({
  imports: [
    SequelizeModule.forFeature([Signal]),
  ],
  controllers: [SignalController],
  providers: [SignalService],
})
export class SignalModule {}
