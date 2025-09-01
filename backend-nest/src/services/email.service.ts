// src/services/email.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Получаем конфигурацию из переменных окружения
    const emailConfig = {
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<boolean>('SMTP_SECURE', false),
      auth: {
        user: this.configService.get<string>('SMTP_USER', ''),
        pass: this.configService.get<string>('SMTP_PASS', ''),
      },
    };

    this.defaultFrom = this.configService.get<string>(
      'SMTP_FROM',
      'ГМСКЦ <noreply@gmskc.ru>',
    );

    // Создаем транспортер для отправки писем
    this.transporter = nodemailer.createTransport(emailConfig);

    // Проверяем подключение
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP connection failed:', error);
      } else {
        this.logger.log('SMTP server is ready to send emails');
      }
    });
  }

  // Общий метод отправки email
  async sendEmail(emailData: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    from?: string;
  }): Promise<any> {
    try {
      const mailOptions = {
        from: emailData.from || this.defaultFrom,
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent to ${emailData.to}: ${result.messageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${emailData.to}:`, error);
      throw error;
    }
  }

  // Тестовая отправка писем для отладки
  async sendTestEmail(to: string): Promise<any> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>Тестовое письмо ГМСКЦ</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <p>Это тестовое письмо от системы ГМСКЦ.</p>
          <p>Если вы получили это письмо, значит email-сервис работает корректно.</p>
          <p><strong>Время отправки:</strong> ${new Date().toLocaleString('ru-RU')}</p>
        </div>
        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
          © ${new Date().getFullYear()} ГМСКЦ России
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Тестовое письмо от ГМСКЦ',
      text: 'Это тестовое письмо от системы ГМСКЦ. Email-сервис работает корректно.',
      html: htmlContent,
    });
  }

  // Отправка уведомления о новой заявке
  async sendNewRequestNotification(requestData: {
    vessel_name: string;
    imo_number: string;
    test_type: string;
    test_date: string;
    operator_email: string;
  }): Promise<any> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>Новая заявка на тестирование ГМССБ</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <h2>Детали заявки:</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Судно:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${requestData.vessel_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>IMO номер:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${requestData.imo_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Тип теста:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${requestData.test_type}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Дата теста:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${requestData.test_date}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">
            <a href="#" style="display: inline-block; padding: 10px 20px; background-color: #667eea; color: white; text-decoration: none; border-radius: 5px;">
              Перейти к заявке
            </a>
          </p>
        </div>
        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
          © ${new Date().getFullYear()} ГМСКЦ России
        </div>
      </div>
    `;

    return this.sendEmail({
      to: requestData.operator_email,
      subject: `Новая заявка на тестирование: ${requestData.vessel_name}`,
      html: htmlContent,
    });
  }

  // Отправка уведомления об изменении статуса заявки
  async sendStatusChangeNotification(data: {
    request_id: number;
    vessel_name: string;
    old_status: string;
    new_status: string;
    owner_email: string;
    rejection_reason?: string;
  }): Promise<any> {
    const statusColors = {
      approved: '#28a745',
      rejected: '#dc3545',
      completed: '#17a2b8',
      pending: '#ffc107',
    };

    const statusTexts = {
      approved: 'ОДОБРЕНА',
      rejected: 'ОТКЛОНЕНА',
      completed: 'ЗАВЕРШЕНА',
      pending: 'НА РАССМОТРЕНИИ',
    };

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1>Изменение статуса заявки</h1>
        </div>
        <div style="padding: 20px; background-color: #f5f5f5;">
          <p>Уважаемый владелец судна <strong>${data.vessel_name}</strong>,</p>
          <p>Статус вашей заявки #${data.request_id} был изменен:</p>
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="text-align: center; font-size: 18px;">
              Новый статус: 
              <span style="color: ${statusColors[data.new_status]}; font-weight: bold;">
                ${statusTexts[data.new_status]}
              </span>
            </p>
            ${
              data.rejection_reason
                ? `<p style="color: #dc3545;"><strong>Причина отклонения:</strong> ${data.rejection_reason}</p>`
                : ''
            }
          </div>
          <p>С уважением,<br>ГМСКЦ России</p>
        </div>
        <div style="text-align: center; padding: 10px; color: #666; font-size: 12px;">
          © ${new Date().getFullYear()} ГМСКЦ России
        </div>
      </div>
    `;

    return this.sendEmail({
      to: data.owner_email,
      subject: `Изменение статуса заявки #${data.request_id}`,
      html: htmlContent,
    });
  }

  // Массовая рассылка
  async sendBulkEmails(
    recipients: string[],
    subject: string,
    content: { text?: string; html?: string },
  ): Promise<any[]> {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail({
          to: recipient,
          subject,
          text: content.text,
          html: content.html,
        });
        results.push({ recipient, success: true, messageId: result.messageId });
      } catch (error) {
        results.push({ recipient, success: false, error: error.message });
      }
    }
    
    return results;
  }

  // Проверка валидности email адреса
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Создание HTML шаблона письма (вспомогательный метод)
  private createEmailTemplate(title: string, content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${title}</h1>
          </div>
          <div style="padding: 30px;">
            ${content}
          </div>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} ГМСКЦ России</p>
            <p style="margin: 5px 0 0 0;">Глобальный морской спасательно-координационный центр</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}