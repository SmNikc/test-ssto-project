import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { RequestController } from '../controllers/request.controller';
import { RequestService } from './request.service';

@Module({
  imports: [
    SequelizeModule.forFeature([SSASRequest]),
  ],
  controllers: [RequestController],
  providers: [RequestService],
})
export class RequestModule {}
