import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { AppController } from './app.controller';
import { EmailController } from './email/email.controller';
import { HealthController } from './controllers/health.controller';
import { DevAuthController } from './auth/dev-auth.controller';

// Services  
import { AppService } from './app.service';
import { EmailSenderService } from './email/email-sender.service';
import { EmailParserService } from './email/email-parser.service';
import { EmailTaskService } from './email/email-task.service';
import { EmailService } from './email/email.service';
import { EnhancedConfirmationService } from './services/enhanced-confirmation.service';
import { ReportService } from './services/report.service';
import { RequestProcessingService } from './services/request-processing.service';
import { AuthService } from './auth/auth.service';
import { AuthGuard } from './auth/auth.guard';

// Modules
import { RequestModule } from './request/request.module';
import { SignalModule } from './signal/signal.module';
import { TestingModule } from './testing/testing.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';

// Models
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

    // Планировщик задач
    ScheduleModule.forRoot(),

    // База данных - Sequelize с PostgreSQL
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        // Пытаемся получить DATABASE_URL
        const databaseUrl = cfg.get<string>('DATABASE_URL') || cfg.get<string>('DB_URL');
        
        // Значения по умолчанию или из отдельных переменных
        let host = cfg.get<string>('DB_HOST', 'localhost');
        let port = parseInt(cfg.get<string>('DB_PORT', '5432'), 10);
        let username = cfg.get<string>('DB_USER', 'ssto');
        let password = cfg.get<string>('DB_PASSWORD', 'sstopass');
        let database = cfg.get<string>('DB_NAME', 'sstodb');

        // Если есть DATABASE_URL, пытаемся его распарсить
        if (databaseUrl) {
          try {
            const parsed = new URL(databaseUrl);
            
            // Извлекаем параметры из URL
            host = parsed.hostname || host;
            port = parsed.port ? parseInt(parsed.port, 10) : port;
            username = parsed.username ? decodeURIComponent(parsed.username) : username;
            password = parsed.password ? decodeURIComponent(parsed.password) : password;
            // Убираем начальный слэш из pathname
            database = parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, '')) : database;
            
            console.log(`[Database] Parsed DATABASE_URL successfully`);
            console.log(`[Database] Connecting to ${host}:${port}/${database} as ${username}`);
          } catch (error) {
            console.warn('[Database] Failed to parse DATABASE_URL, falling back to individual variables', error.message);
          }
        } else {
          console.log(`[Database] Using individual DB_* variables`);
          console.log(`[Database] Connecting to ${host}:${port}/${database} as ${username}`);
        }

        return {
          dialect: 'postgres',
          host,
          port,
          username,
          password,
          database,
          
          // Полный реестр всех моделей
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

          // Автозагрузка моделей включена, но без автосинхронизации в продакшене
          autoLoadModels: true,
          synchronize: false, // ВАЖНО: false для production
          
          // Логирование SQL только в development
          logging: cfg.get('NODE_ENV') === 'development' ? console.log : false,
          
          // Дополнительные настройки подключения
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          
          // Повторные попытки подключения
          retry: {
            max: 5,
            match: [
              /SequelizeConnectionError/,
              /SequelizeConnectionRefusedError/,
              /SequelizeHostNotFoundError/,
              /SequelizeHostNotReachableError/,
              /SequelizeInvalidConnectionError/,
              /SequelizeConnectionTimedOutError/
            ]
          }
        };
      },
    }),

    // Регистрация моделей для инъекций
    SequelizeModule.forFeature([
      SSASRequest,
      Signal,
      ConfirmationDocument,
      SSASTerminal,
      SystemSettings,
    ]),

    // Функциональные модули приложения
    RequestModule,  // RequestsController + ConfirmationController + сервисы заявок
    SignalModule,   // SignalController + PdfService + сервис сигналов  
    TestingModule,  // TestingController + TestingService
    UserModule,     // UserController + UserService
    LogModule,      // LogController + LogService
  ],

  controllers: [
    AppController,
    EmailController,
    HealthController,
    DevAuthController,
  ],

  providers: [
    AppService,
    
    // Почтовая подсистема
    EmailSenderService,
    EmailParserService,
    EmailTaskService,
    EmailService,
    
    // Подтверждения и отчёты
    EnhancedConfirmationService,
    ReportService,
    
    // Обработка заявок
    RequestProcessingService,
    
    // Безопасность
    AuthService,
    AuthGuard,
  ],
})
export class AppModule {}