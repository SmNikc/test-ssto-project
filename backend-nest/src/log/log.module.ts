import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import Log from '../models/log.model';
import { LogService } from './log.service';
import { LogController } from '../controllers/log.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([Log]),
  ],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService],
})
export class LogModule {}
