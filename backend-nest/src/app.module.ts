// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Существующие контроллеры
import { RequestController } from './controllers/request-ssto.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { LogController } from './controllers/log.controller';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { VesselController } from './controllers/vessel.controller';
import { TestRequestController, MassConfirmationController } from './controllers/test-request.controller';
import { EmailController } from './controllers/email.controller';
import { ConfirmationController } from './controllers/confirmation.controller';

// Новый контроллер для API подтверждений
import { ConfirmationApiController } from './controllers/confirmation-api.controller';

// Существующие сервисы из корневых папок
import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { PdfService } from './signal/pdf.service';
import { TestingService } from './testing/testing.service';
import { LogService } from './log/log.service';
import { UserService } from './user/user.service';
import { HealthService } from './health/health.service';
import { ImapService } from './imap/imap.service';
import { IntegrationService } from './integration/integration.service';

// Существующие сервисы из папки services
import { EmailSenderService } from './services/email-sender.service';
import { EmailService } from './services/email.service';
import { VesselService } from './services/vessel.service';
import { TestRequestService } from './services/test-request.service';
import { ConfirmationService } from './services/confirmation.service';
import { ReportService } from './services/report.service';

// Новый сервис для расширенных подтверждений
import { EnhancedConfirmationService } from './services/enhanced-confirmation.service';

// Существующие модели (Sequelize)
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';
import Vessel from './models/vessel.model';
import TestRequest from './models/test-request.model';

// Новая модель для документов подтверждений
import ConfirmationDocument from './models/confirmation-document.model';

@Module({
  imports: [
    // Глобально читаем backend-nest\.env
    ConfigModule.forRoot({ isGlobal: true }),

    // КОРНЕВОЕ подключение к Postgres
    SequelizeModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        dialect: 'postgres',
        host: cfg.get<string>('DB_HOST', 'localhost'),
        port: Number(cfg.get<string>('DB_PORT', '5432')),
        username: cfg.get<string>('DB_USER', 'ssto'),
        password: cfg.get<string>('DB_PASSWORD', 'sstopass'),
        database: cfg.get<string>('DB_NAME', 'sstodb'),
        models: [
          // Существующие модели
          SSASRequest, 
          Signal, 
          Log, 
          TestingScenario, 
          User,
          Vessel,
          TestRequest,
          // Новая модель
          ConfirmationDocument
        ],
        autoLoadModels: true,
        synchronize: false,       // выключено на проде
        logging: false,
        retry: { max: 5 },
      }),
    }),

    // Регистрация моделей для DI
    SequelizeModule.forFeature([
      // Существующие модели
      SSASRequest, 
      Signal, 
      Log, 
      TestingScenario, 
      User,
      Vessel,
      TestRequest,
      // Новая модель
      ConfirmationDocument
    ]),
  ],
  controllers: [
    // Существующие контроллеры
    RequestController,
    SignalController,
    TestingController,
    LogController,
    UserController,
    HealthController,
    VesselController,
    TestRequestController,
    MassConfirmationController,
    EmailController,
    ConfirmationController,
    // Новый контроллер
    ConfirmationApiController
  ],
  providers: [
    // Сервисы из корневых папок
    RequestService,
    SignalService,
    PdfService,
    TestingService,
    LogService,
    UserService,
    HealthService,
    ImapService,
    IntegrationService,
    // Сервисы из папки services
    EmailSenderService,
    EmailService,
    VesselService,
    TestRequestService,
    ConfirmationService,
    ReportService,
    // Новый сервис для расширенных подтверждений
    EnhancedConfirmationService
  ],
})
export class AppModule {}