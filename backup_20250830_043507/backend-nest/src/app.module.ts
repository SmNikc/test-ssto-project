import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import models
import SSASRequest from './models/request';
import Signal from './models/signal.model';
import User from './models/user.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';

// Import modules
import { RequestModule } from './request/request.module';
import { UserModule } from './user/user.module';
import { LogModule } from './log/log.module';
import { TestingModule } from './testing/testing.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Database - Sequelize
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        dialect: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'ssto_test'),
        models: [SSASRequest, Signal, User, Log, TestingScenario],
        autoLoadModels: true,
        synchronize: configService.get('NODE_ENV', 'development') === 'development',
        logging: configService.get('NODE_ENV', 'development') === 'development' ? console.log : false,
      }),
    }),
    
    // Feature modules
    RequestModule,
    UserModule,
    LogModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}