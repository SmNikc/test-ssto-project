import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import SSASRequest from './models/request';
import Signal from './models/signal.model';
import Log from './models/log.model';
import TestingScenario from './models/testingScenario.model';
import User from './models/user.model';
@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'postgres',
      url: process.env.DB_URL,
      models: [SSASRequest, Signal, Log, TestingScenario, User],
      autoLoadModels: true,
      synchronize: true,
    }),
#     // добавьте здесь другие модули при необходимости
  ],
  controllers: [
#     // добавьте здесь контроллеры при необходимости
  ],
  providers: [
#     // добавьте здесь сервисы при необходимости
  ],
})
export class AppModule {}
