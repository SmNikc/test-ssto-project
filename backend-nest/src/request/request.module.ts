import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { RequestService } from '../services/request.service'; // ПРАВИЛЬНЫЙ сервис из services
import { RequestController } from '../controllers/request-ssto.controller'; // контроллер из controllers

@Module({
  imports: [SequelizeModule.forFeature([SSASRequest])],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}