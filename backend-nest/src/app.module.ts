// backend-nest/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';

// Функциональные модули
import { RequestModule } from './request/request.module';
import { SignalModule } from './signal/signal.module';
import { TestingModule } from './testing/testing.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';

// Контроллеры верхнего уровня
import { AppController } from './app.controller';
import { EmailController } from './controllers/email.controller';
import { HealthController } from './controllers/health.controller';
import { DevAuthController } from './dev-auth/dev-auth.controller'; // Keycloak авторизация

// Сервисы верхнего уровня
import { AppService } from './app.service';
import { EmailSenderService } from './services/email-sender.service';
import { EmailParserService } from './services/email-parser.service';
import { EmailTaskService } from './services/email-task.service';
import { EmailService } from './services/email.service';
import { EnhancedConfirmationService } from './services/enhanced-confirmation.service';
import { ReportService } from './services/report.service';
import { RequestProcessingService } from './services/request-processing.service';

// Безопасность
import { AuthService } from './security/auth.service';
import { AuthGuard } from './security/auth.guard';

// Модели БД (полный перечень, с которыми вы уже работаете)
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

@Module({
  imports: [
    // Глобальная конфигурация .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Планировщик (нужен для @Cron в RequestProcessingService)
    ScheduleModule.forRoot(),

    // Подключение PostgreSQL через Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        dialect: 'postgres',
        host: cfg.get('DB_HOST', 'localhost'),
        port: parseInt(cfg.get('DB_PORT', '5432'), 10),
        username: cfg.get('DB_USER', 'ssto'),
        password: cfg.get('DB_PASSWORD', 'sstopass'),
        database: cfg.get('DB_NAME', 'sstodb'),

        // Полный реестр ваших моделей
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
          SystemSettings,
        ],

        // Автозагрузка моделей оставляем включённой, но без автосинхронизации в проде
        autoLoadModels: true,
        synchronize: false,

        // Включаем логирование SQL только в dev
        logging: cfg.get('NODE_ENV') === 'development',
      }),
    }),

    /**
     * Дополнительно даём forFeature на те модели, которые нужны
     * сервисам из providers текущего модуля (например, RequestProcessingService
     * с @InjectModel(SSASRequest) / @InjectModel(SSASTerminal)).
     */
    SequelizeModule.forFeature([
      SSASRequest,
      Signal,
      ConfirmationDocument,
      SSASTerminal,
      SystemSettings,
    ]),

    // Функциональные модули вашего приложения
    RequestModule, // RequestsController + ConfirmationController + сервисы заявок
    SignalModule,  // SignalController + PdfService + сервис сигналов
    TestingModule,
    UserModule,
    LogModule,
  ],

  controllers: [
    AppController,
    EmailController,
    HealthController,
    DevAuthController, // Keycloak OAuth2 авторизация
  ],

  providers: [
    AppService,

    // Почтовая подсистема
    EmailSenderService,
    EmailParserService,
    EmailTaskService,
    EmailService,

    // Подтверждения/Отчёты
    EnhancedConfirmationService,
    ReportService,

    // Планировщик обработки входящих писем/сигналов
    RequestProcessingService,

    // Безопасность
    AuthService,
    AuthGuard,
  ],
})
export class AppModule {}