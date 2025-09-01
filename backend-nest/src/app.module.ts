// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Контроллеры (основываясь на найденных файлах)
import { RequestController } from './controllers/request-ssto.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { LogController } from './controllers/log.controller';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';
import { VesselController } from './controllers/vessel.controller';
import { TestRequestController } from './controllers/test-request.controller';
import { EmailController } from './controllers/email.controller';
import { ConfirmationController } from './controllers/confirmation.controller';

// Сервисы из папки services
import { EmailSenderService } from './services/email-sender.service';
import { EmailService } from './services/email.service';
import { VesselService } from './services/vessel.service';
import { TestRequestService } from './services/test-request.service';
import { ConfirmationService } from './services/confirmation.service';
import { ReportService } from './services/report.service';

// Сервисы из папки security
import { AuthService } from './security/auth.service';

// Сервисы из корневых папок
import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { TestingService } from './testing/testing.service';
import { LogService } from './log/log.service';
import { UserService } from './user/user.service';
import { HealthService } from './health/health.service';
import { ImapService } from './imap/imap.service';
import { IntegrationService } from './integration/integration.service';

// Модели (Sequelize)
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';
import Vessel from './models/vessel.model';
import TestRequest from './models/test-request.model';

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
          SSASRequest, 
          Signal, 
          Log, 
          TestingScenario, 
          User,
          Vessel,
          TestRequest
        ],
        autoLoadModels: true,
        synchronize: false,       // dev режим; на проде выключить
        logging: false,
        retry: { max: 5 },
      }),
    }),

    // Регистрация моделей для DI
    SequelizeModule.forFeature([
      SSASRequest, 
      Signal, 
      Log, 
      TestingScenario, 
      User,
      Vessel,
      TestRequest
    ]),
  ],
  controllers: [
    RequestController,
    SignalController,
    TestingController,
    LogController,
    UserController,
    HealthController,
    VesselController,
    TestRequestController,
    EmailController,
    ConfirmationController,
  ],
  providers: [
    // Сервисы из корневых папок
    RequestService,
    SignalService,
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
    AuthService,
  ],
})
export class AppModule {}
