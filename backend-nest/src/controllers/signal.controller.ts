// src/controllers/signal.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
// import { EmailService } from '../signal/email.service';
import { AuthGuard } from '../security/auth.guard';

@Controller('signals')
// @UseGuards(AuthGuard) // Временно отключено
export class SignalController {
  constructor(
    private readonly signalService: SignalService,
    // private readonly emailService: EmailService,
  ) {}

  @Post('send-confirmation/:requestId')
  async sendConfirmation(@Param('requestId') requestId: string) {
    try {
      const request = await this.signalService.findRequestById(requestId);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      // Здесь будет логика отправки подтверждения
      // await this.emailService.sendConfirmation(request);

      return {
        success: true,
        message: 'Подтверждение отправлено',
        requestId: requestId,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при отправке подтверждения',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-report/:requestId')
  async generateReport(@Param('requestId') requestId: string) {
    try {
      const request = await this.signalService.findRequestById(requestId);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      // Здесь будет логика генерации отчета
      const report = {
        requestId: requestId,
        generatedAt: new Date(),
        status: 'generated',
        // Добавить больше полей отчета
      };

      return {
        success: true,
        message: 'Отчет сгенерирован',
        report: report,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при генерации отчета',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('requests')
  async getAllRequests(@Query() query: any) {
    try {
      const requests = await this.signalService.findAllRequests(query);
      return {
        success: true,
        data: requests,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при получении заявок',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('requests/:id')
  async getRequestById(@Param('id') id: string) {
    try {
      const request = await this.signalService.findRequestById(id);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        data: request,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Ошибка при получении заявки',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}