// backend-nest/src/email/email.module.ts
// Модуль который объединяет все email сервисы с правильными импортами

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailController } from './email.controller';
import { EmailService } from '../services/email.service';
import { EmailSenderService } from '../services/email-sender.service';
import { EmailParserService } from '../services/email-parser.service';
import { RequestModule } from '../request/request.module'; // Импорт RequestModule для EmailParserService

@Module({
  imports: [
    ConfigModule,
    RequestModule // EmailParserService нуждается в RequestService
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailSenderService, 
    EmailParserService
  ],
  exports: [
    EmailService,
    EmailSenderService,
    EmailParserService
  ]
})
export class EmailModule {}