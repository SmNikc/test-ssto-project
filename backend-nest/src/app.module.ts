import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { RequestModule } from './request/request.module';
import { SignalModule } from './signal/signal.module';
import { NotificationModule } from './notification/notification.module';
import { ImapModule } from './imap/imap.module';
import { AuthModule } from './auth/auth.module';
import { ReportModule } from './report/report.module';
import { TestingModule } from './testing/testing.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';
import { IntegrationModule } from './integration/integration.module';
import { BackupModule } from './backup/backup.module';
import { HealthModule } from './health/health.module';
import SSASRequest from './models/request';
import Signal from './models/signal.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';
import Log from './models/log.model';

@Module({
  imports: [
    ConfigModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      uri: process.env.DB_URL,
      models: [SSASRequest, Signal, TestingScenario, User, Log],
      autoLoadModels: true,
      synchronize: true,
    }),
    RequestModule,
    SignalModule,
    NotificationModule,
    ImapModule,
    AuthModule,
    ReportModule,
    TestingModule,
    UserModule,
    LogModule,
    IntegrationModule,
    BackupModule,
    HealthModule,
  ],
})
export class AppModule {}
