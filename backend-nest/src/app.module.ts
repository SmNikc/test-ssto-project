// backend-nest/src/app.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

// Контроллеры
import { RequestController } from './controllers/request.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { UserController } from './controllers/user.controller';
import { LogController } from './controllers/log.controller';
import { HealthController } from './controllers/health.controller';

// Сервисы
import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { TestingService } from './testing/testing.service';
import { UserService } from './user/user.service';
import { LogService } from './log/log.service';

// Модели
import { SSASRequest } from './models/request.model';
import { Signal } from './models/signal.model';
import { Log } from './models/log.model';
import { TestingScenario } from './models/testingScenario.model';
import { User } from './models/user.model';

@Module({
  imports: [
    // Предполагается, что SequelizeModule.forRoot(...) у вас уже подключён в другом модуле/файле.
    SequelizeModule.forFeature([SSASRequest, Signal, Log, TestingScenario, User]),
  ],
  controllers: [
    HealthController,
    UserController,
    LogController,
    RequestController,
    SignalController,
    TestingController,
  ],
  providers: [
    UserService,
    LogService,
    RequestService,
    SignalService,
    TestingService,
  ],
})
export class AppModule {}
