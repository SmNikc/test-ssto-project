// backend-nest/src/email/email.controller.ts
// Правильный контроллер для email с нужными endpoints

import { Controller, Post, Get, Body } from '@nestjs/common';
import { EmailService } from '../services/email.service';

@Controller('api/email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // Отправка email
  @Post('send')
  async sendEmail(@Body() body: any) {
    try {
      const result = await this.emailService.sendEmail({
        to: body.to,
        subject: body.subject,
        text: body.text,
        html: body.html,
        attachments: body.attachments
      });
      
      return {
        success: true,
        messageId: result.messageId,
        message: `Email отправлен на ${body.to}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Проверка входящих
  @Get('check')
  async checkEmails() {
    try {
      const result = await this.emailService.checkIncomingEmails();
      return result;
    } catch (error) {
      return {
        requests: [],
        signals: [],
        unrecognized: [],
        error: error.message
      };
    }
  }

  // Парсинг email
  @Post('parse')
  async parseEmail(@Body() body: any) {
    // Используем метод parseEmail если он public
    // или создаем простой парсер
    const parsed: any = {
      type: 'unknown',
      vessel: null,
      mmsi: null,
      terminal: null
    };

    const text = body.text || '';
    
    // Извлекаем данные
    const vesselMatch = text.match(/судно[:\s]+([^\n]+)/i);
    if (vesselMatch) parsed.vessel = vesselMatch[1].trim();
    
    const mmsiMatch = text.match(/mmsi[:\s]+(\d{9})/i);
    if (mmsiMatch) parsed.mmsi = mmsiMatch[1];
    
    const terminalMatch = text.match(/стойка|терминал[:\s]+([^\n]+)/i);
    if (terminalMatch) parsed.terminal = terminalMatch[1].trim();
    
    // Определяем тип
    if (body.subject?.match(/заявка|тест/i)) {
      parsed.type = 'request';
    } else if (body.subject?.match(/сигнал|alert/i)) {
      parsed.type = 'signal';
    }
    
    return parsed;
  }
}