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
import { PdfService } from '../signal/pdf.service';

@Controller('signals')
export class SignalController {
  constructor(
    private readonly signalService: SignalService,
    private readonly pdfService: PdfService,
  ) {}

  @Post('send-confirmation/:requestId')
  async sendConfirmation(@Param('requestId') requestId: string) {
    try {
      const request = await this.signalService.findRequest(Number(requestId));
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

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
      const request = await this.signalService.findRequest(Number(requestId));
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      // Используем данные напрямую из request, без vessel
      const requestData = {
        id: request.id,
        vessel_name: request.vessel_name || 'Неизвестное судно',
        mmsi: request.mmsi || 'Неизвестно',
        imo: request.imo_number || 'Неизвестно',
        status: request.status,
        test_date: request.planned_test_date,
      };

      const html = this.pdfService.generateConfirmation(requestData);
      
      return {
        success: true,
        message: 'Отчет сгенерирован',
        html: html,
        requestId: requestId,
      };
    } catch (error) {
      console.error('Generate report error:', error);
      return {
        success: false,
        message: error.message || 'Ошибка при генерации отчета',
      };
    }
  }

  @Get('requests')
  async getAllRequests(@Query() query: any) {
    try {
      const requests = await this.signalService.findAllRequests();
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
      const request = await this.signalService.findRequest(Number(id));
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


