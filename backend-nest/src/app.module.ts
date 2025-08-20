
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { RequestController } from './controllers/request.controller';
import { SignalController } from './controllers/signal.controller';
import { TestingController } from './controllers/testing.controller';
import { UserController } from './controllers/user.controller';
import { LogController } from './controllers/log.controller';
import { HealthController } from './controllers/health.controller';

import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { TestingService } from './testing/testing.service';
import { UserService } from './user/user.service';
import { LogService } from './log/log.service';

import SSASRequest from './models/request';
import Signal from './models/signal.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';

import { AuthService } from './security/auth.service';
import { AuthGuard } from './security/auth.guard';

@Module({
  imports: [SequelizeModule.forFeature([SSASRequest, Signal, Log, TestingScenario, User])],
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
    AuthService,
    AuthGuard,
  ],
})
export class AppModule {}
