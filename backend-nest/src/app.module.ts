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

// Models - только основные
import Log from './models/log.model';
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import Vessel from './models/vessel.model';

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
        models: [Log, SSASRequest, Signal, Vessel],
        autoLoadModels: false,
        synchronize: false,
        logging: false,
      }),
    }),

    SequelizeModule.forFeature([Log, SSASRequest, Signal, Vessel]),
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
  ],
})
export class AppModule {}

