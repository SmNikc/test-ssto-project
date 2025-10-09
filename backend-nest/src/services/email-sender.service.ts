import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSenderService implements OnModuleInit {
  private readonly logger = new Logger(EmailSenderService.name);
  private transporter: any;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter() {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    const user = this.configService.get<string>('SMTP_USER');
    const pass =
      this.configService.get<string>('SMTP_PASS') ??
      this.configService.get<string>('SMTP_PASSWORD');
    const fromAddress = this.configService.get<string>('SMTP_FROM');
    const fromName = this.configService.get<string>('SMTP_FROM_NAME');
    this.defaultFrom =
      fromAddress || (fromName && user ? `${fromName} <${user}>` : user || 'ГМСКЦ <noreply@gmskc.ru>');

    if (!user || !pass) {
      this.logger.warn('SMTP credentials not configured');
      return;
    }

    this.logger.log(`Initializing SMTP: ${host}:${port}`);

    const config = {
      host,
      port,
      secure: this.isSecureTransport(),
      auth: { user, pass }
    };

    this.transporter = nodemailer.createTransport(config);

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection established');
    } catch (error) {
      this.logger.warn('SMTP verification skipped:', error.message);
    }
  }

  private isSecureTransport(): boolean {
    const secureValue = this.configService.get<string>('SMTP_SECURE', '');
    if (secureValue) {
      return ['true', '1', 'yes', 'on'].includes(secureValue.toLowerCase());
    }

    const port = Number(this.configService.get<string>('SMTP_PORT', '587'));
    return port === 465;
  }

  // Основной метод отправки
  async sendEmail(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      throw new Error('Email service not initialized');
    }
    
    const mailOptions = {
      from: this.defaultFrom,
      to,
      subject,
      text,
      html: html || text
    };

    return await this.transporter.sendMail(mailOptions);
  }

  // Метод для отправки подтверждений
  async sendConfirmation(to: string, subject: string, payload: any) {
    const html = this.generateConfirmationHtml(payload);
    return await this.sendEmail(to, subject, JSON.stringify(payload), html);
  }

  // Тестирование подключения
  async testConnection() {
    if (!this.transporter) {
      return { success: false, message: 'Transporter not initialized' };
    }
    
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Генерация HTML для подтверждения
  private generateConfirmationHtml(payload: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Подтверждение от ГМСКЦ</h2>
        <pre>${JSON.stringify(payload, null, 2)}</pre>
      </div>
    `;
  }
}
