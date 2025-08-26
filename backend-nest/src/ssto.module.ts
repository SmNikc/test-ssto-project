import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

// Models
import SSASRequest from './models/request';
import Signal from './models/signal.model';

// Services
import { RequestService } from './services/request.service';
import { EmailService } from './services/email.service';

// Controllers
import { RequestController } from './controllers/request-ssto.controller';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([SSASRequest, Signal]),
  ],
  controllers: [RequestController],
  providers: [RequestService, EmailService],
  exports: [RequestService, EmailService],
})
export class SstoModule {}