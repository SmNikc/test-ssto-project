// backend-nest/src/ssto.module.ts
// ПОЛНЫЙ КОД С ИСПРАВЛЕНИЯМИ

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Импорт моделей
import SSASRequest from './models/request';
import Signal from './models/signal.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';
import Log from './models/log.model';

// ИСПРАВЛЕНО: Правильный путь к RequestService
import { RequestService } from './request/request.service';  // ✅ Исправлен путь

// Импорт других сервисов (проверьте пути)
import { SignalService } from './signal/signal.service';
import { TestingService } from './testing/testing.service';
import { UserService } from './user/user.service';
import { LogService } from './log/log.service';

// Импорт контроллеров
import { RequestController } from './controllers/request-ssto.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { UserController } from './controllers/user.controller';
import { LogController } from './controllers/log.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forFeature([
      SSASRequest,
      Signal,
      TestingScenario,
      User,
      Log,
    ]),
  ],
  controllers: [
    RequestController,
    SignalController,
    TestingController,
    UserController,
    LogController,
    HealthController,
  ],
  providers: [
    RequestService,
    SignalService,
    TestingService,
    UserService,
    LogService,
  ],
  exports: [
    RequestService,
    SignalService,
    TestingService,
    UserService,
    LogService,
  ],
})
export class SstoModule {}