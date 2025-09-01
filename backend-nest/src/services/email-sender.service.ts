// backend-nest/src/services/email-sender.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const config = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true', // Сравниваем со строкой 'true'
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASSWORD'),
      },
    };

    this.logger.log(`Initializing SMTP: ${config.host}:${config.port}`);
    
    this.transporter = nodemailer.createTransport(config);

    // Проверяем подключение при инициализации
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error(`SMTP connection failed: ${error.message}`);
      } else {
        this.logger.log('✅ SMTP server ready to send emails');
      }
    });
  }

  async sendConfirmation(email: string, pdfPath: string, request: any) {
    try {
      this.logger.log(`📧 Sending confirmation to: ${email}`);
      
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
        to: email,
        subject: `Подтверждение тестирования ССТО - ${request.vessel_name} MMSI: ${request.mmsi}`,
        text: `
ФГБУ «МОРСПАССЛУЖБА»
Главный морской спасательно-координационный центр

Подтверждаем получение тестового сообщения ССТО

Судно: ${request.vessel_name}
MMSI: ${request.mmsi}
IMO: ${request.imo || 'Не указан'}
Дата теста: ${new Date(request.test_date).toLocaleString('ru-RU')}

Статус: УСПЕШНО

Подробная информация в приложенном документе.

Оперативный дежурный ГМСКЦ
тел.: +7 (495) 626-10-52
email: od.smrcc@morspas.ru
        `,
        html: `
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <div style="border-bottom: 2px solid #003d7a; padding-bottom: 10px;">
    <h2 style="color: #003d7a;">ФГБУ «МОРСПАССЛУЖБА»</h2>
    <h3 style="color: #666;">Главный морской спасательно-координационный центр</h3>
  </div>
  
  <div style="margin: 20px 0;">
    <h3>Подтверждаем получение тестового сообщения ССТО</h3>
    
    <table style="border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 8px; font-weight: bold;">Судно:</td>
        <td style="padding: 8px;">${request.vessel_name}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold;">MMSI:</td>
        <td style="padding: 8px;">${request.mmsi}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold;">IMO:</td>
        <td style="padding: 8px;">${request.imo || 'Не указан'}</td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 8px; font-weight: bold;">Дата теста:</td>
        <td style="padding: 8px;">${new Date(request.test_date).toLocaleString('ru-RU')}</td>
      </tr>
      <tr>
        <td style="padding: 8px; font-weight: bold;">Статус:</td>
        <td style="padding: 8px; color: green; font-weight: bold;">✅ УСПЕШНО</td>
      </tr>
    </table>
    
    <p>Подробная информация в приложенном документе.</p>
  </div>
  
  <div style="border-top: 1px solid #ccc; margin-top: 30px; padding-top: 10px; font-size: 12px; color: #666;">
    <p>Оперативный дежурный ГМСКЦ<br>
    тел.: +7 (495) 626-10-52<br>
    email: od.smrcc@morspas.ru</p>
  </div>
</div>
        `,
        attachments: [
          {
            filename: `ГМСКЦ_подтверждение_${request.mmsi}_${new Date().toISOString().split('T')[0]}.pdf`,
            path: pdfPath,
          },
        ],
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent successfully! Message ID: ${info.messageId}`);
      
      return info;
    } catch (error) {
      this.logger.error(`❌ Failed to send confirmation: ${error.message}`);
      throw error;
    }
  }

  // Метод для отправки простого email без PDF
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      const mailOptions = {
        from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
        to,
        subject,
        text,
        html: html || text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Email sent to ${to}`);
      return info;
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error.message}`);
      throw error;
    }
  }

  // Тестовый метод для проверки SMTP
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ SMTP connection test successful');
      return true;
    } catch (error) {
      this.logger.error(`❌ SMTP connection test failed: ${error.message}`);
      return false;
    }
  }
}