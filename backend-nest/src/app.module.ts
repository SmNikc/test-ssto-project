import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_GUARD } from '@nestjs/core';

import { RequestController } from './controllers/request.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { LogController } from './controllers/log.controller';
import { UserController } from './controllers/user.controller';
import { HealthController } from './controllers/health.controller';

import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { TestingService } from './testing/testing.service';
import { LogService } from './log/log.service';
import { UserService } from './user/user.service';

import SSASRequest from './models/request';
import Signal from './models/signal.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';

import { AuthService } from './security/auth.service';
import { AuthGuard } from './security/auth.guard';

@Module({
  imports: [
    SequelizeModule.forFeature([SSASRequest, Signal, Log, TestingScenario, User]),
  ],
  controllers: [
    RequestController,
    SignalController,
    TestingController,
    LogController,
    UserController,
    HealthController,
  ],
  providers: [
    RequestService,
    SignalService,
    TestingService,
    LogService,
    UserService,
    AuthService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
})
export class AppModule {}

3) RequestService — стандартный CRUD (совместим с контроллером)
