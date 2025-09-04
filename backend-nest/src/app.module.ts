// backend-nest/src/app.module.ts
// Главный модуль приложения с подключенным EmailModule

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';

// Контроллеры
import { AppController } from './app.controller';
import { HealthController } from './controllers/health.controller';

// Сервисы
import { AppService } from './app.service';
import { PdfService } from './services/pdf.service';

// Модули
import { EmailModule } from './email/email.module';
import { RequestModule } from './request/request.module';

// Sequelize модели
import SSASRequest from './models/request.model';
import SSASTerminal from './models/ssas-terminal.model';
import Signal from './models/signal.model';
import SystemSettings from './models/system-settings.model';
import User from './models/user.model';
import Log from './models/log.model';
import Vessel from './models/vessel.model';
import TestRequest from './models/test-request.model';
import TestReport from './models/test-report.model';
import ConfirmationDocument from './models/confirmation-document.model';
import TestingScenario from './models/testingScenario.model';

@Module({
  imports: [
    // Конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Планировщик задач
    ScheduleModule.forRoot(),

    // База данных - Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'ssto'),
        password: configService.get('DB_PASSWORD', 'sstopass'),
        database: configService.get('DB_NAME', 'sstodb'),
        models: [
          SSASRequest,
          SSASTerminal,
          Signal,
          SystemSettings,
          User,
          Log,
          Vessel,
          TestRequest,
          TestReport,
          ConfirmationDocument,
          TestingScenario,
        ],
        autoLoadModels: false, // Используем явную загрузку моделей
        synchronize: true, // В продакшене установить false
        logging: false, // Отключаем SQL логи для чистоты консоли
        define: {
          timestamps: true,
          underscored: true, // Используем snake_case для полей БД
        },
      }),
      inject: [ConfigService],
    }),

    // Регистрация моделей для инъекций
    SequelizeModule.forFeature([
      SSASRequest,
      SSASTerminal,
      Signal,
      SystemSettings,
      User,
      Log,
      Vessel,
      TestRequest,
      TestReport,
      ConfirmationDocument,
      TestingScenario,
    ]),

    // Функциональные модули
    EmailModule,
    RequestModule,
  ],
  controllers: [
    AppController,
    HealthController,
  ],
  providers: [
    AppService,
    PdfService,
  ],
  exports: [
    PdfService,
  ],
})
export class AppModule {}
