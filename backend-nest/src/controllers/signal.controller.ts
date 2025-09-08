// backend-nest/src/controllers/signal.controller.ts
// Контроллер сигналов. Гарантируем сериализацию с signal_number во всех ответах списков/объектов.

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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

  /** Гарантируем наличие signal_number в JSON */
  private withSignalNumber(row: any) {
    if (!row) return row;
    const plain = typeof row.toJSON === 'function' ? row.toJSON() : row;
    const sn =
      (typeof row.getDataValue === 'function' &&
        row.getDataValue('signal_number')) ||
      plain.signal_number ||
      row['signal_number'];
    return { ...plain, signal_number: sn };
  }

  /** GET /signals — список сигналов с signal_number */
  @Get()
  async getAllSignals() {
    try {
      const rows = await this.signalService.findAll();
      const data = (rows || []).map((s) => this.withSignalNumber(s));
      return { success: true, count: data.length, data };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Ошибка при получении сигналов',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('send-confirmation/:requestId')
  async sendConfirmation(@Param('requestId') requestId: string) {
    try {
      const request = await this.signalService.findRequest(requestId);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }
      return {
        success: true,
        message: 'Подтверждение отправлено',
        requestId,
      };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Ошибка при отправке подтверждения',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-report/:requestId')
  async generateReport(@Param('requestId') requestId: string) {
    try {
      const request = await this.signalService.findRequest(requestId);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }

      // Данные берём напрямую из заявки (без обращения к справочнику судов)
      const requestData = {
        id: request.id,
        vessel_name: (request as any).vessel_name || 'Неизвестное судно',
        mmsi: (request as any).mmsi || 'Неизвестно',
        imo: (request as any).imo_number || 'Неизвестно',
        status: (request as any).status,
        test_date: (request as any).planned_test_date,
      };

      const html = this.pdfService.generateConfirmation(requestData);

      return {
        success: true,
        message: 'Отчет сгенерирован',
        html,
        requestId,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Ошибка при генерации отчета',
      };
    }
  }

  // Сопутствующие запросы к заявкам
  @Get('requests')
  async getAllRequests(@Query() _query: any) {
    try {
      const requests = await this.signalService.findAllRequests();
      return { success: true, data: requests };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Ошибка при получении заявок',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('requests/:id')
  async getRequestById(@Param('id') id: string) {
    try {
      const request = await this.signalService.findRequest(id);
      if (!request) {
        throw new HttpException('Заявка не найдена', HttpStatus.NOT_FOUND);
      }
      return { success: true, data: request };
    } catch (error: any) {
      throw new HttpException(
        error.message || 'Ошибка при получении заявки',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
