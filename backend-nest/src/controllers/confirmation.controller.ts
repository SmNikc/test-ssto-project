// backend-nest/src/controllers/confirmation.controller.ts
// ПОЛНОФУНКЦИОНАЛЬНЫЙ контроллер для отправки подтверждений
import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  Logger,
  HttpStatus,
  HttpCode,
  BadRequestException,
  NotFoundException
} from '@nestjs/common';
import { RequestService } from '../request/request.service';
import { SignalService } from '../signal/signal.service';
import { EmailSenderService } from '../services/email-sender.service';
import { ReportService } from '../services/report.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller('api')
export class ConfirmationController {
  private readonly logger = new Logger(ConfirmationController.name);

  constructor(
    private requestService: RequestService,
    private signalService: SignalService,
    private emailSenderService: EmailSenderService,
    private reportService: ReportService,
  ) {}

  // ===================================
  // ОТПРАВКА ПОДТВЕРЖДЕНИЙ
  // ===================================

  @Post('requests/:id/send-confirmation')
  @HttpCode(HttpStatus.OK)
  async sendConfirmation(
    @Param('id') id: string,
    @Body() options: {
      send_email?: boolean; 
      generate_pdf?: boolean;
      test_mode?: boolean;
    } = {},
  ) {
    this.logger.log(`📧 Отправка подтверждения для заявки ID: ${id}`);
    
    try {
      // 1. Получаем заявку
      const request = await this.requestService.findOne(id);
      if (!request) {
        throw new NotFoundException(`Заявка #${id} не найдена`);
      }

      this.logger.log(`Заявка найдена: ${request.vessel_name} (MMSI: ${request.mmsi})`);

      // 2. Проверяем статус заявки
      if (request.status !== 'approved' && request.status !== 'completed') {
        this.logger.warn(`Заявка #${id} не одобрена. Статус: ${request.status}`);
        if (!options.test_mode) {
          throw new BadRequestException(
            `Заявка должна быть одобрена. Текущий статус: ${request.status}`
          );
        }
      }

      // 3. Создаем папку temp если её нет
      const tempDir = path.join(process.cwd(), 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        this.logger.log(`📁 Создана папка: ${tempDir}`);
      }

      // 4. Генерируем PDF (если не отключено)
      let pdfPath = null;
      if (options.generate_pdf !== false) {
        this.logger.log('📄 Генерация PDF подтверждения...');
        
        // Ищем связанный сигнал
        const signal = request.signal_id 
          ? await this.signalService.findOne(request.signal_id)
          : null;
        
        pdfPath = await this.reportService.generateTestConfirmation(request, signal);
        this.logger.log(`✅ PDF создан: ${pdfPath}`);
      }

      // 5. Отправляем email (если не отключено)
      let emailSent = false;
      if (options.send_email !== false) {
        this.logger.log(`📨 Отправка email на: ${request.contact_email}`);
        
        if (pdfPath && fs.existsSync(pdfPath)) {
          // Отправка с PDF вложением
          await this.emailSenderService.sendConfirmation(
            request.contact_email,
            pdfPath,
            request
          );
          emailSent = true;
        } else {
          // Отправка простого письма без PDF
          const subject = `Подтверждение тестирования ССТО - ${request.vessel_name}`;
          const html = this.generateEmailHtml(request);
          
          await this.emailSenderService.sendEmail(
            request.contact_email,
            subject,
            this.generateEmailText(request),
            html
          );
          emailSent = true;
        }
        
        this.logger.log('✅ Email отправлен успешно');
      }

      // 6. Обновляем статус заявки
      if (request.status === 'approved') {
        await this.requestService.updateStatus(id, 'completed');
        this.logger.log('✅ Статус заявки обновлен на "completed"');
      }

      // 7. Возвращаем результат
      return {
        success: true,
        message: 'Подтверждение отправлено успешно',
        data: {
          request_id: id,
          vessel_name: request.vessel_name,
          mmsi: request.mmsi,
          email_sent: emailSent,
          email_sent_to: request.contact_email,
          pdf_generated: !!pdfPath,
          pdf_path: pdfPath,
          status: 'completed'
        },
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка отправки подтверждения: ${error.message}`);
      throw error;
    }
  }

  // ===================================
  // МАССОВАЯ ОТПРАВКА
  // ===================================

  @Post('send-all-confirmations')
  @HttpCode(HttpStatus.OK)
  async sendAllConfirmations() {
    this.logger.log('📧 Массовая отправка подтверждений...');
    
    try {
      // Получаем все одобренные заявки
      const allRequests = await this.requestService.findAll();
      const requests = allRequests.filter(r => r.status === 'approved');
      
      if (!requests || requests.length === 0) {
        return {
          success: true,
          message: 'Нет одобренных заявок для отправки',
          total_processed: 0,
          results: [],
        };
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const request of requests) {
        try {
          this.logger.log(`Обработка заявки ${request.id}: ${request.vessel_name}`);
          
          const result = await this.sendConfirmation(request.id, {
            send_email: true,
            generate_pdf: true,
          });
          
          results.push({
            request_id: request.id,
            vessel: request.vessel_name,
            status: 'sent',
            details: result.data,
          });
          successCount++;
        } catch (error) {
          results.push({
            request_id: request.id,
            vessel: request.vessel_name,
            status: 'failed',
            error: error.message,
          });
          errorCount++;
        }
      }

      return {
        success: true,
        message: `Обработано заявок: ${requests.length}`,
        total_processed: requests.length,
        successful: successCount,
        failed: errorCount,
        results,
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка массовой отправки: ${error.message}`);
      throw error;
    }
  }

  // ===================================
  // ТЕСТИРОВАНИЕ
  // ===================================

  @Get('test/smtp')
  async testSmtp() {
    this.logger.log('🔧 Тестирование SMTP соединения...');
    
    try {
      const result = await this.emailSenderService.testConnection();
      return {
        success: result,
        message: result 
          ? '✅ SMTP соединение установлено' 
          : '❌ SMTP соединение не удалось',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка тестирования SMTP',
        error: error.message,
      };
    }
  }

  @Post('test/email')
  async testEmail(@Body() data: { to: string; subject?: string; text?: string }) {
    this.logger.log(`📧 Тестовая отправка email на: ${data.to}`);
    
    if (!data.to) {
      throw new BadRequestException('Email адрес обязателен');
    }

    try {
      const subject = data.subject || 'Тест системы ССТО';
      const text = data.text || 'Это тестовое сообщение от системы ССТО';
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Тестовое сообщение</h2>
          <p>${text}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Отправлено: ${new Date().toLocaleString('ru-RU')}<br>
            Система: ССТО Test API v1.0.0
          </p>
        </div>
      `;

      await this.emailSenderService.sendEmail(data.to, subject, text, html);
      
      return {
        success: true,
        message: `Email отправлен на ${data.to}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`❌ Ошибка отправки тестового email: ${error.message}`);
      return {
        success: false,
        message: 'Ошибка отправки email',
        error: error.message,
      };
    }
  }

  // ===================================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ===================================

  private generateEmailText(request: any): string {
    return `
ФГБУ «МОРСПАССЛУЖБА»
Главный морской спасательно-координационный центр

Подтверждаем получение тестового сообщения ССТО

Судно: ${request.vessel_name}
MMSI: ${request.mmsi}
IMO: ${request.imo || 'Не указан'}
Судовладелец: ${request.ship_owner}
Дата теста: ${new Date(request.test_date).toLocaleString('ru-RU')}

Статус: УСПЕШНО

С уважением,
Оперативный дежурный ГМСКЦ
тел.: +7 (495) 626-10-52
email: od.smrcc@morspas.ru
    `.trim();
  }

  private generateEmailHtml(request: any): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Шапка -->
  <div style="background: #003d7a; color: white; padding: 20px;">
    <h2 style="margin: 0;">ФГБУ «МОРСПАССЛУЖБА»</h2>
    <p style="margin: 5px 0;">Главный морской спасательно-координационный центр</p>
  </div>
  
  <!-- Содержание -->
  <div style="padding: 20px; background: #f5f5f5;">
    <h3 style="color: #003d7a;">Подтверждение тестирования ССТО</h3>
    
    <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
      <p style="margin: 10px 0;"><strong>Судно:</strong> ${request.vessel_name}</p>
      <p style="margin: 10px 0;"><strong>MMSI:</strong> ${request.mmsi}</p>
      <p style="margin: 10px 0;"><strong>IMO:</strong> ${request.imo || 'Не указан'}</p>
      <p style="margin: 10px 0;"><strong>Судовладелец:</strong> ${request.ship_owner}</p>
      <p style="margin: 10px 0;"><strong>Дата теста:</strong> ${new Date(request.test_date).toLocaleString('ru-RU')}</p>
    </div>
    
    <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px;">
      <h4 style="margin: 0;">✅ Тест пройден успешно</h4>
      <p style="margin: 10px 0 0 0;">Тестовый сигнал ССТО получен и обработан.</p>
    </div>
  </div>
  
  <!-- Подпись -->
  <div style="padding: 20px; background: #e9e9e9; font-size: 12px; color: #666;">
    <p style="margin: 5px 0;">С уважением,</p>
    <p style="margin: 5px 0;"><strong>Оперативный дежурный ГМСКЦ</strong></p>
    <p style="margin: 5px 0;">тел.: +7 (495) 626-10-52</p>
    <p style="margin: 5px 0;">email: od.smrcc@morspas.ru</p>
    <p style="margin: 15px 0 5px 0; font-size: 10px; color: #999;">
      Данное письмо сформировано автоматически системой ССТО<br>
      ${new Date().toLocaleString('ru-RU')}
    </p>
  </div>
</div>
    `.trim();
  }
}