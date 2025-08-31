import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { RequestService } from './request.service';  // ✅ Правильный путь
import { RequestController } from '../controllers/request-ssto.controller'; // ✅ ПРАВИЛЬНЫЙ импорт

@Module({
  imports: [
    // Регистрация модели SSASRequest для использования в модуле
    SequelizeModule.forFeature([SSASRequest])
  ],
  controllers: [RequestController],  // ✅ Класс называется RequestController
  providers: [RequestService],       // Сервис с бизнес-логикой для запросов
  exports: [RequestService],         // Экспорт для использования в других модулях
})
export class RequestModule {}