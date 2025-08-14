import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RequestController } from '../controllers/request.controller';
import { RequestService } from './request.service';
import SSASRequest from '../models/request';

@Module({
  imports: [SequelizeModule.forFeature([SSASRequest])],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
