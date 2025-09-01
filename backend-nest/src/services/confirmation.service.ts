// src/services/confirmation.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestRequest from '../models/test-request.model';
import Vessel from '../models/vessel.model';
import { EmailService } from './email.service';
import { formatInTimeZone } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

@Injectable()
export class ConfirmationService {
  private readonly logger = new Logger(ConfirmationService.name);

  constructor(
    @InjectModel(TestRequest)
    private testRequestModel: typeof TestRequest,
    private emailService: EmailService,
  ) {}

  async sendConfirmation(requestId: number): Promise<any> {
    try {
      // Получаем заявку с данными судна
      const request = await this.testRequestModel.findByPk(requestId, {
        include: [Vessel],
      });

      if (!request) {
        throw new Error(`Заявка #${requestId} не найдена`);
      }

      if (!request.vessel) {
        throw new Error(`Судно для заявки #${requestId} не найдено`);
      }

      if (request.status !== 'approved') {
        throw new Error(`Заявка #${requestId} не одобрена. Текущий статус: ${request.status}`);
      }

      // Форматируем дату и время теста
      const testDateTime = formatInTimeZone(
        request.test_date,
        'Europe/Moscow',
        'dd MMMM yyyy года в HH:mm',
        { locale: ru }
      );

      // Форматируем координаты судна
      const latitude = request.vessel.latitude || 0;
      const longitude = request.vessel.longitude || 0;
      const latDirection = latitude >= 0 ? 'N' : 'S';
      const lonDirection = longitude >= 0 ? 'E' : 'W';
      const formattedCoordinates = `${Math.abs(latitude).toFixed(4)}°${latDirection}, ${Math.abs(longitude).toFixed(4)}°${lonDirection}`;

      // Создаем HTML письмо
      const htmlContent = this.generateConfirmationEmail(request, testDateTime, formattedCoordinates);

      // Отправляем email
      const emailResult = await this.emailService.sendEmail({
        to: request.vessel.owner_email,
        subject: `Подтверждение теста ГМССБ для судна ${request.vessel.name}`,
        html: htmlContent,
        text: this.generatePlainTextEmail(request, testDateTime, formattedCoordinates),
      });

      // Обновляем статус заявки
      await request.update({
        confirmation_sent: true,
        confirmation_sent_at: new Date(),
      });

      this.logger.log(`Подтверждение отправлено для заявки #${requestId}`);

      return {
        success: true,
        message: `Подтверждение отправлено на ${request.vessel.owner_email}`,
        request_id: requestId,
        vessel_name: request.vessel.name,
        email_sent_to: request.vessel.owner_email,
        test_date: testDateTime,
      };
    } catch (error) {
      this.logger.error(`Ошибка отправки подтверждения для заявки #${requestId}:`, error);
      throw error;
    }
  }

  async sendAllConfirmations(): Promise<any> {
    try {
      // Получаем все одобренные заявки, которым еще не отправлено подтверждение
      const requests = await this.testRequestModel.findAll({
        where: {
          status: 'approved',
          confirmation_sent: false,
        },
        include: [Vessel],
      });

      const results = [];
      let successful = 0;
      let failed = 0;

      for (const request of requests) {
        try {
          await this.sendConfirmation(request.id);
          successful++;
          results.push({
            request_id: request.id,
            vessel: request.vessel?.name || 'Unknown',
            status: 'success',
          });
        } catch (error) {
          failed++;
          results.push({
            request_id: request.id,
            vessel: request.vessel?.name || 'Unknown',
            status: 'failed',
            error: error.message,
          });
        }
      }

      return {
        success: true,
        message: `Обработано заявок: ${requests.length}`,
        total_processed: requests.length,
        successful,
        failed,
        results,
      };
    } catch (error) {
      this.logger.error('Ошибка массовой отправки подтверждений:', error);
      throw error;
    }
  }

  private generateConfirmationEmail(
    request: TestRequest,
    testDateTime: string,
    coordinates: string
  ): string {
    const vessel = request.vessel;
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px 10px 0 0;
            margin: -30px -30px 30px -30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .section h2 {
            color: #667eea;
            margin-top: 0;
            font-size: 18px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 2fr;
            gap: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #555;
        }
        .info-value {
            color: #333;
        }
        .important {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .important h3 {
            color: #856404;
            margin-top: 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .signature {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ГМСКЦ - Глобальный морской спасательно-координационный центр</h1>
            <p>Подтверждение проведения теста оборудования ГМССБ</p>
        </div>

        <p>Уважаемый владелец судна <strong>${vessel.name}</strong>,</p>
        
        <p>Настоящим подтверждаем, что ваша заявка на проведение теста оборудования ГМССБ 
        была <strong style="color: #28a745;">ОДОБРЕНА</strong>.</p>

        <div class="section">
            <h2>📋 Информация о судне</h2>
            <div class="info-grid">
                <div class="info-label">Название судна:</div>
                <div class="info-value">${vessel.name}</div>
                
                <div class="info-label">IMO номер:</div>
                <div class="info-value">${vessel.imo_number}</div>
                
                <div class="info-label">Позывной:</div>
                <div class="info-value">${vessel.call_sign}</div>
                
                <div class="info-label">MMSI:</div>
                <div class="info-value">${vessel.mmsi}</div>
                
                <div class="info-label">Тип судна:</div>
                <div class="info-value">${vessel.vessel_type}</div>
                
                <div class="info-label">Флаг:</div>
                <div class="info-value">${vessel.flag}</div>
                
                <div class="info-label">Текущие координаты:</div>
                <div class="info-value">${coordinates}</div>
            </div>
        </div>

        <div class="section">
            <h2>📅 Детали теста</h2>
            <div class="info-grid">
                <div class="info-label">Дата и время теста:</div>
                <div class="info-value"><strong>${testDateTime} (МСК)</strong></div>
                
                <div class="info-label">Тип теста:</div>
                <div class="info-value">${request.test_type}</div>
                
                <div class="info-label">Номер заявки:</div>
                <div class="info-value">#${request.id}</div>
            </div>
        </div>

        <div class="important">
            <h3>⚠️ Важная информация</h3>
            <ul>
                <li>Убедитесь, что все оборудование ГМССБ находится в рабочем состоянии</li>
                <li>Проверьте актуальность документации по радиооборудованию</li>
                <li>Экипаж должен быть готов к проведению теста в указанное время</li>
                <li>Тест будет проводиться на частотах: 2182 кГц, 156.8 МГц (16 канал УКВ)</li>
            </ul>
        </div>

        <div class="section">
            <h2>📞 Контактная информация</h2>
            <p>По всем вопросам обращайтесь:</p>
            <div class="info-grid">
                <div class="info-label">Телефон:</div>
                <div class="info-value">+7 (495) 626-10-00</div>
                
                <div class="info-label">Email:</div>
                <div class="info-value">gmskc@morflot.ru</div>
                
                <div class="info-label">Дежурная служба:</div>
                <div class="info-value">Круглосуточно</div>
            </div>
        </div>

        <div class="signature">
            <p><strong>С уважением,</strong></p>
            <p>
                <strong>ГМСКЦ России</strong><br>
                Глобальный морской спасательно-координационный центр<br>
                Федеральное агентство морского и речного транспорта
            </p>
        </div>

        <div class="footer">
            <p>Это письмо сгенерировано автоматически системой ГМСКЦ.</p>
            <p>© ${new Date().getFullYear()} ГМСКЦ России. Все права защищены.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generatePlainTextEmail(
    request: TestRequest,
    testDateTime: string,
    coordinates: string
  ): string {
    const vessel = request.vessel;
    
    return `
ГМСКЦ - Глобальный морской спасательно-координационный центр
Подтверждение проведения теста оборудования ГМССБ

Уважаемый владелец судна ${vessel.name},

Настоящим подтверждаем, что ваша заявка на проведение теста оборудования ГМССБ была ОДОБРЕНА.

ИНФОРМАЦИЯ О СУДНЕ:
- Название судна: ${vessel.name}
- IMO номер: ${vessel.imo_number}
- Позывной: ${vessel.call_sign}
- MMSI: ${vessel.mmsi}
- Тип судна: ${vessel.vessel_type}
- Флаг: ${vessel.flag}
- Текущие координаты: ${coordinates}

ДЕТАЛИ ТЕСТА:
- Дата и время теста: ${testDateTime} (МСК)
- Тип теста: ${request.test_type}
- Номер заявки: #${request.id}

ВАЖНАЯ ИНФОРМАЦИЯ:
- Убедитесь, что все оборудование ГМССБ находится в рабочем состоянии
- Проверьте актуальность документации по радиооборудованию
- Экипаж должен быть готов к проведению теста в указанное время
- Тест будет проводиться на частотах: 2182 кГц, 156.8 МГц (16 канал УКВ)

КОНТАКТНАЯ ИНФОРМАЦИЯ:
- Телефон: +7 (495) 626-10-00
- Email: gmskc@morflot.ru
- Дежурная служба: Круглосуточно

С уважением,
ГМСКЦ России
Глобальный морской спасательно-координационный центр
Федеральное агентство морского и речного транспорта

© ${new Date().getFullYear()} ГМСКЦ России. Все права защищены.
    `;
  }
}