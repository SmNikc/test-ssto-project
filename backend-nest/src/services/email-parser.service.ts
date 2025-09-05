// backend-nest/src/services/email-parser.service.ts
// Простой парсер email для демонстрации

import { Injectable, Logger } from '@nestjs/common';
import { RequestService } from '../request/request.service';

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  constructor(private readonly requestService: RequestService) {}

  /**
   * Парсит текст email и извлекает данные заявки
   */
  async parseEmailToRequest(emailContent: {
    from: string;
    subject: string;
    body: string;
    receivedAt: Date;
  }) {
    this.logger.log(`Парсинг email от ${emailContent.from}`);

    // Извлекаем MMSI из текста
    const mmsiMatch = emailContent.body.match(/MMSI\s*:?\s*(\d{9})/i);
    const mmsi = mmsiMatch ? mmsiMatch[1] : this.generateDemoMMSI();

    // Извлекаем название судна
    const vesselMatch = emailContent.body.match(/судн[оае]\s*:?\s*"?([^"\n,]+)"?/i);
    const vesselName = vesselMatch ? vesselMatch[1].trim() : 'Неизвестное судно';

    // Извлекаем IMO
    const imoMatch = emailContent.body.match(/IMO\s*:?\s*(\d{7})/i);
    const imo = imoMatch ? imoMatch[1] : this.generateDemoIMO();

    // Извлекаем дату/время
    const dateMatch = emailContent.body.match(/(\d{1,2}[\s\-\.\/]\d{1,2}[\s\-\.\/]\d{2,4})/);
    const timeMatch = emailContent.body.match(/(\d{1,2}:\d{2})/);
    
    let testDate = new Date();
    if (dateMatch) {
      // Простой парсинг даты
      testDate = new Date(dateMatch[1]);
    }

    // Извлекаем контактные данные из email
    const emailParts = emailContent.from.match(/(.+)@(.+)/);
    const contactPerson = emailParts ? emailParts[1].replace(/[._-]/g, ' ') : 'Не указано';

    // Извлекаем телефон если есть
    const phoneMatch = emailContent.body.match(/\+?\d[\d\s\-\(\)]{10,}/);
    const contactPhone = phoneMatch ? phoneMatch[0] : '+7 (000) 000-00-00';

    // Создаем заявку
    const requestData = {
      vessel_name: vesselName,
      mmsi: mmsi,
      imo: imo,
      ssas_number: `SSAS${imo}`,
      owner_organization: this.extractOrganization(emailContent.from),
      contact_person: contactPerson,
      contact_phone: contactPhone,
      contact_email: emailContent.from,
      test_date: testDate,
      test_datetime: testDate,
      start_time: timeMatch ? timeMatch[1] : '10:00',
      end_time: this.calculateEndTime(timeMatch ? timeMatch[1] : '10:00'),
      notes: `Заявка получена по email от ${emailContent.from}\nТема: ${emailContent.subject}`,
      status: 'pending',
      source: 'email',
      original_email: emailContent.body.substring(0, 500) // Сохраняем часть оригинала
    };

    this.logger.log(`Распознано: ${vesselName} (MMSI: ${mmsi})`);

    try {
      const request = await this.requestService.create(requestData);
      this.logger.log(`✅ Заявка создана: ${request.id}`);
      return {
        success: true,
        request: request,
        message: `Заявка от ${vesselName} успешно создана из email`
      };
    } catch (error) {
      this.logger.error(`Ошибка создания заявки: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Обработка нескольких email
   */
  async processEmails(emails: any[]) {
    const results = [];
    
    for (const email of emails) {
      const result = await this.parseEmailToRequest(email);
      results.push(result);
    }

    return {
      processed: emails.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    };
  }

  // Вспомогательные методы
  
  private generateDemoMMSI(): string {
    return '273' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  private generateDemoIMO(): string {
    return '9' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  private extractOrganization(email: string): string {
    const domain = email.split('@')[1];
    if (domain) {
      const orgName = domain.split('.')[0];
      return orgName.charAt(0).toUpperCase() + orgName.slice(1) + ' Shipping';
    }
    return 'Неизвестная организация';
  }

  private calculateEndTime(startTime: string): string {
    // Добавляем 4 часа к времени начала
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 4) % 24;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}

// Контроллер для демонстрации
import { Controller, Post, Body, Get } from '@nestjs/common';

@Controller('api/email')
export class EmailParserController {
  constructor(private readonly emailParser: EmailParserService) {}

  @Post('parse')
  async parseEmail(@Body() emailData: any) {
    return this.emailParser.parseEmailToRequest(emailData);
  }

  @Post('parse-batch')
  async parseMultipleEmails(@Body() emails: any[]) {
    return this.emailParser.processEmails(emails);
  }

  @Get('demo')
  async createDemoEmailRequests() {
    // Создаем демо email-заявки
    const demoEmails = [
      {
        from: 'captain@vessel.ru',
        subject: 'Тест ССТО',
        body: 'Добрый день! Прошу провести тестирование системы ССТО на судне "Капитан Петров" (MMSI 273123456). Завтра в 10:00 по московскому времени.',
        receivedAt: new Date()
      },
      {
        from: 'shipping@baltic.ru',
        subject: 'Заявка на проверку',
        body: 'Требуется тестирование ССТО. Судно: Балтика, MMSI: 273654321, IMO: 9876543. Дата: 16 января, время 14:30.',
        receivedAt: new Date()
      }
    ];

    return this.emailParser.processEmails(demoEmails);
  }
}