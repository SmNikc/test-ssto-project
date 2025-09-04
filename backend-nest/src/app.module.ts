import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Controllers
import { HealthController } from './controllers/health.controller';
import { LogController } from './controllers/log.controller';
import { SignalController } from './controllers/signal.controller';
import { RequestController } from './controllers/request-ssto.controller';

// Services
import { LogService } from './log/log.service';
import { RequestService } from './request/request.service';
import { SignalService } from './signal/signal.service';
import { PdfService } from './signal/pdf.service';
import { EmailService } from './services/email.service';
import { MapService } from './services/map.service';
import { PoiskMoreService } from './services/poisk-more.service';

// Models
import Log from './models/log.model';
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import Vessel from './models/vessel.model';
import SystemSettings from './models/system-settings.model';
import SSASTerminal from './models/ssas-terminal.model';
import TestReport from './models/test-report.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'sstodb'),
        models: [Log, SSASRequest, Signal, Vessel, SystemSettings, SSASTerminal, TestReport],
        autoLoadModels: false,
        synchronize: false,
        logging: false,
      }),
    }),

    SequelizeModule.forFeature([Log, SSASRequest, Signal, Vessel, SystemSettings, SSASTerminal, TestReport]),
  ],

  controllers: [
    HealthController,
    LogController,
    RequestController,
    SignalController,
  ],

  providers: [
    PdfService,
    LogService,
    RequestService,
    SignalService,
    EmailService,
    MapService,
    PoiskMoreService,
  ],
})
export class AppModule {}