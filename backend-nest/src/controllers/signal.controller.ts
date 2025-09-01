// src/controllers/signal.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  Query,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
import { EmailService } from '../signal/email.service';
import { AuthGuard } from '../security/auth.guard';
// Добавьте эти импорты когда создадите сервисы
// import { ReportService } from '../services/report.service';
// import { EmailSenderService } from '../services/email-sender.service';
// import { RequestService } from '../services/request.service';

@Controller('signals')
@UseGuards(AuthGuard)
export class SignalController {
  constructor(
    private readonly signalService: SignalService,
    private readonly emailService: EmailService,
    // Добавьте эти сервисы после их создания:
    // @Inject(forwardRef(() => ReportService))
    // private readonly reportService: ReportService,
    // @Inject(forwardRef(() => EmailSenderService))
    // private readonly emailSenderService: EmailSenderService,
    // @Inject(forwardRef(() => RequestService))
    // private readonly requestService: RequestService,
  ) {}

  // ... существующие методы ...

  @Post('send-confirmation/:requestId')
  @HttpCode(HttpStatus.OK)
  async sendConfirmation(@Param('requestId') requestId: string) {
    try {
      // Временная заглушка - раскомментируйте после создания сервисов
      
      // // Получаем заявку
      // const request = await this.requestService.findOne(requestId);
      // if (!request) {
      //   return { 
      //     success: false, 
      //     message: 'Заявка не найдена' 
      //   };
      // }
      
      // // Получаем сигналы для этой заявки
      // const signals = await this.signalService.getSignalsByRequestId(requestId);
      // if (!signals || signals.length === 0) {
      //   return { 
      //     success: false, 
      //     message: 'Нет сигналов для данной заявки' 
      //   };
      // }
      
      // // Генерируем PDF
      // const pdfPath = await this.reportService.generateTestConfirmation(request, signals);
      
      // // Отправляем на email из заявки
      // await this.emailSenderService.sendConfirmation(request.email, pdfPath, request);
      
      // return { 
      //   success: true, 
      //   message: 'Подтверждение отправлено на ' + request.email 
      // };

      // Временный ответ
      return { 
        success: true, 
        message: 'Функция в разработке. Сервисы еще не созданы.' 
      };
      
    } catch (error) {
      console.error('Error sending confirmation:', error);
      return { 
        success: false, 
        message: 'Ошибка отправки подтверждения',
        error: error.message 
      };
    }
  }

  @Post('generate-report/:requestId')
  @HttpCode(HttpStatus.OK)
  async generateReport(@Param('requestId') requestId: string) {
    try {
      // Временная заглушка
      return { 
        success: true, 
        message: 'PDF отчет будет сгенерирован после создания ReportService',
        requestId 
      };
    } catch (error) {
      return { 
        success: false, 
        message: 'Ошибка генерации отчета',
        error: error.message 
      };
    }
  }
}