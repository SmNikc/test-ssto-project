// src/app.module.ts
// Полностью обновленный главный модуль
// Замените содержимое вашего app.module.ts на это

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Controllers
import { AppController } from './app.controller';
import { RequestController } from './controllers/request.controller';
import { SignalController } from './controllers/signal.controller';

// Services
import { AppService } from './app.service';
import { SignalService } from './signal/signal.service';
import { PdfService } from './signal/pdf.service';

// Models
import SSASRequest from './models/request.model';
import Signal from './models/signal.model';
import Vessel from './models/vessel.model';

@Module({
  imports: [
    // Конфигурация
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // База данных - Sequelize с PostgreSQL
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'ssto'),
        password: configService.get('DB_PASSWORD', 'sstopass'),
        database: configService.get('DB_NAME', 'sstodb'),
        models: [SSASRequest, Signal, Vessel],
        autoLoadModels: true,
        synchronize: false, // Важно: false для production
        logging: false, // Отключаем логи SQL
      }),
    }),
    
    // Регистрируем модели для инъекции
    SequelizeModule.forFeature([SSASRequest, Signal, Vessel]),
  ],
  controllers: [
    AppController,
    RequestController,
    SignalController,
  ],
  providers: [
    AppService,
    SignalService,
    PdfService,
  ],
})
export class AppModule {}