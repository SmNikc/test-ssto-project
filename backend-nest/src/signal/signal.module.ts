// backend-nest/src/signal/signal.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { SignalController } from '../controllers/signal.controller';
import { SignalService } from './signal.service';
import { EmailService } from './email.service';
import { EmailSenderService } from '../services/email-sender.service';
import { ReportService } from '../services/report.service';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    ConfigModule,  // Для доступа к ConfigService
    SequelizeModule.forFeature([Signal, SSASRequest]),
    SecurityModule
  ],
  controllers: [SignalController],
  providers: [
    SignalService,
    EmailService,
    EmailSenderService,  // Добавляем EmailSenderService
    ReportService        // Добавляем ReportService
  ],
  exports: [SignalService, EmailService]
})
export class SignalModule {}