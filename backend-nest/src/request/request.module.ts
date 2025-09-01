// backend-nest/src/request/request.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { RequestController } from '../controllers/request-ssto.controller';
import { ConfirmationController } from '../controllers/confirmation.controller';
import { RequestService } from './request.service';
import { SignalService } from '../signal/signal.service';
import { EmailSenderService } from '../services/email-sender.service';
import { ReportService } from '../services/report.service';
import SSASRequest from '../models/request';
import Signal from '../models/signal.model';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([SSASRequest, Signal])
  ],
  controllers: [
    RequestController,
    ConfirmationController  // Полнофункциональный контроллер
  ],
  providers: [
    RequestService,
    SignalService,
    EmailSenderService,
    ReportService
  ],
  exports: [RequestService],
})
export class RequestModule {}