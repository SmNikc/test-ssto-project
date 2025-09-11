// backend-nest/src/request/request.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Контроллеры
import { RequestsController } from '../controllers/requests.controller';
import { ConfirmationController } from '../controllers/confirmation.controller';

// Сервисы
import { RequestService } from './request.service';
import { SignalService } from '../signal/signal.service';
import { EmailSenderService } from '../services/email-sender.service';
import { ReportService } from '../services/report.service';

// Модели
import SSASRequest from '../models/request.model';
import Signal from '../models/signal.model';
import Vessel from '../models/vessel.model';

@Module({
  imports: [
    ConfigModule,
    // Доступ к моделям в рамках этого модуля (используются сервисами Request/Signal)
    SequelizeModule.forFeature([SSASRequest, Signal, Vessel]),
  ],
  controllers: [
    // ВНИМАНИЕ: только новый контроллер заявок
    RequestsController,
    ConfirmationController,
  ],
  providers: [
    RequestService,
    SignalService,
    EmailSenderService,
    ReportService,
  ],
  exports: [
    // Экспортируем сервис заявок, если он нужен из других модулей
    RequestService,
  ],
})
export class RequestModule {}
