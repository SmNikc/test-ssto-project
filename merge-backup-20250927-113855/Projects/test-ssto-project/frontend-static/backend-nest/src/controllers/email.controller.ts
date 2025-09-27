// src/controllers/email.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('api/test')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('email')
  async testEmail(
    @Body() emailData: { to: string; subject: string; text: string; html?: string },
  ) {
    try {
      await this.emailService.sendEmail(emailData);
      return {
        success: true,
        message: `Email отправлен на ${emailData.to}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}