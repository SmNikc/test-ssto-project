// src/controllers/confirmation-api.controller.ts v.2

import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { EnhancedConfirmationService } from '../services/enhanced-confirmation.service';

@Controller('api/confirmations')
export class ConfirmationApiController {
  constructor(
    private readonly confirmationService: EnhancedConfirmationService,
  ) {}

  // Включение/выключение автоматической отправки
  @Put('auto-send')
  async setAutoSend(@Body('enabled') enabled: boolean) {
    this.confirmationService.setAutoSendMode(enabled);
    return {
      success: true,
      message: `Автоматическая отправка ${enabled ? 'включена' : 'выключена'}`,
      auto_send_enabled: enabled,
    };
  }

  // Проверка совпадения сигнала с заявкой
  @Post('check-signal/:signalId')
  async checkSignal(@Param('signalId') signalId: string) {
    try {
      const result = await this.confirmationService.checkSignalMatch(+signalId);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Подготовка подтверждения (без отправки)
  @Post('prepare/:requestId')
  async prepareConfirmation(@Param('requestId') requestId: string) {
    try {
      const confirmation = await this.confirmationService.prepareConfirmation(+requestId);
      return {
        success: true,
        message: 'Подтверждение подготовлено',
        confirmation: {
          id: confirmation.id,
          document_number: confirmation.document_number,
          status: confirmation.status,
          recipient_email: confirmation.recipient_email,
          auto_send_enabled: confirmation.auto_send_enabled,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Отправка подтверждения вручную
  @Post(':id/send')
  async sendConfirmation(
    @Param('id') id: string,
    @Body('operator_name') operatorName?: string,
  ) {
    try {
      const result = await this.confirmationService.sendConfirmation(
        +id,
        operatorName || 'MANUAL',
      );
      return result;
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Получение списка подтверждений
  @Get()
  async getConfirmations(
    @Query('status') status?: string,
    @Query('auto_send') autoSend?: string,
    @Query('date_from') dateFrom?: string,
    @Query('date_to') dateTo?: string,
  ) {
    const filters: any = {};
    
    if (status) filters.status = status;
    if (autoSend !== undefined) filters.auto_send = autoSend === 'true';
    if (dateFrom) filters.date_from = new Date(dateFrom);
    if (dateTo) filters.date_to = new Date(dateTo);

    const confirmations = await this.confirmationService.getConfirmations(filters);
    
    return {
      success: true,
      total: confirmations.length,
      data: confirmations.map(c => ({
        id: c.id,
        document_number: c.document_number,
        status: c.status,
        recipient_email: c.recipient_email,
        auto_send_enabled: c.auto_send_enabled,
        sent_at: c.sent_at,
        sent_by: c.sent_by,
        test_request_id: c.test_request_id,
        vessel_name: c.testRequest?.vessel?.name,
      })),
    };
  }

  // Получение одного подтверждения
  @Get(':id')
  async getConfirmation(@Param('id') id: string) {
    const confirmations = await this.confirmationService.getConfirmations({
      id: +id,
    });

    if (!confirmations || confirmations.length === 0) {
      throw new HttpException(
        {
          success: false,
          message: 'Подтверждение не найдено',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      data: confirmations[0],
    };
  }

  // Скачивание PDF
  @Get(':id/pdf')
  async downloadPDF(@Param('id') id: string, @Res() res: Response) {
    try {
      const { buffer, filename } = await this.confirmationService.downloadPDF(+id);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      });
      
      res.send(buffer);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  // Предпросмотр HTML
  @Get(':id/preview')
  async previewHTML(@Param('id') id: string, @Res() res: Response) {
    const confirmations = await this.confirmationService.getConfirmations({
      id: +id,
    });

    if (!confirmations || confirmations.length === 0) {
      throw new HttpException(
        {
          success: false,
          message: 'Подтверждение не найдено',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(confirmations[0].html_content);
  }

  // Массовая отправка всех готовых подтверждений
  @Post('send-all-ready')
  async sendAllReady() {
    const confirmations = await this.confirmationService.getConfirmations({
      status: 'ready',
    });

    const results = [];
    for (const conf of confirmations) {
      try {
        const result = await this.confirmationService.sendConfirmation(conf.id, 'BATCH');
        results.push({
          id: conf.id,
          document_number: conf.document_number,
          status: 'sent',
          message: 'Успешно отправлено',
        });
      } catch (error) {
        results.push({
          id: conf.id,
          document_number: conf.document_number,
          status: 'failed',
          message: error.message,
        });
      }
    }

    return {
      success: true,
      total_processed: results.length,
      successful: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      results,
    };
  }
}