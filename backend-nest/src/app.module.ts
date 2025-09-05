// C:\Projects\test-ssto-project\backend-nest\src\app.module.ts
// Полный код БЕЗ СОКРАЩЕНИЙ с EmailTaskService

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Импорт готовых модулей
import { RequestModule } from './request/request.module';
import { SignalModule } from './signal/signal.module';
import { TestingModule } from './testing/testing.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';

// Импорт контроллеров, которые не входят в модули
import { AppController } from './app.controller';
import { EmailController } from './controllers/email.controller';
import { HealthController } from './controllers/health.controller';

// Импорт ВСЕХ сервисов включая EmailTaskService
import { AppService } from './app.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailParserService } from './services/email-parser.service';
import { EmailTaskService } from './services/email-task.service';  // Вы создали этот файл
import { EmailService } from './services/email.service';
import { EnhancedConfirmationService } from './services/enhanced-confirmation.service';
import { ReportService } from './services/report.service';

// Импорт моделей базы данных
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import User from './models/user.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import Vessel from './models/vessel.model';
import TestRequest from './models/test-request.model';
import ConfirmationDocument from './models/confirmation-document.model';
import SSASTerminal from './models/ssas-terminal.model';
import SystemSettings from './models/system-settings.model';

// Импорт дополнительных сервисов безопасности
import { AuthService } from './security/auth.service';
import { AuthGuard } from './security/auth.guard';

@Module({
  imports: [
    // Глобальная конфигурация из .env файла
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Конфигурация базы данных PostgreSQL через Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'ssto'),
        password: configService.get('DB_PASSWORD', 'sstopass'),
        database: configService.get('DB_NAME', 'sstodb'),
        models: [
          SSASRequest,
          Signal,
          User,
          Log,
          TestingScenario,
          Vessel,
          TestRequest,
          ConfirmationDocument,
          SSASTerminal,
          SystemSettings
        ],
        autoLoadModels: true,
        synchronize: false, // Важно: false для production
        logging: false, // Отключаем SQL логи для production
      }),
    }),
    
    // Регистрация моделей для инъекций в сервисы, которые не в модулях
    SequelizeModule.forFeature([
      SSASRequest,
      Signal,
      ConfirmationDocument,
      SSASTerminal,
      SystemSettings
    ]),
    
    // Импортируем готовые функциональные модули
    RequestModule,    // Содержит RequestController, ConfirmationController, RequestService
    SignalModule,     // Содержит SignalController, SignalService, PdfService
    TestingModule,    // Содержит TestingController, TestingService
    UserModule,       // Содержит UserController, UserService
    LogModule,        // Содержит LogController, LogService
  ],
  
  // Контроллеры, которые не входят в модули
  controllers: [
    AppController,
    EmailController,
    HealthController,
  ],
  
  // ВСЕ сервисы включая EmailTaskService
  providers: [
    AppService,
    EmailSenderService,
    EmailParserService,
    EmailTaskService,  // Добавлен так как вы создали файл
    EmailService,
    EnhancedConfirmationService,
    ReportService,
    AuthService,
    AuthGuard,
  ],
  
  // Экспорт для использования в других модулях при необходимости
  exports: []
})
export class AppModule {}