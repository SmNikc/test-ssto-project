// src/signal/signal.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SignalController } from '../controllers/signal.controller';
import { SignalService } from './signal.service';
import { EmailService } from './email.service';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Signal, SSASRequest]),
    SecurityModule
  ],
  controllers: [SignalController],
  providers: [SignalService, EmailService],
  exports: [SignalService, EmailService]
})
export class SignalModule {}