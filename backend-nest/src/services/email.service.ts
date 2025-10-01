import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildRecipientList } from '../email/recipient.policy';

const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

@Injectable()
export class EmailService {
  private transporter: any;
  private imapConnection: any;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  /**
   * Инициализация SMTP транспортера
   */
  private initializeTransporter(): void {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get('SMTP_PORT'),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  /**
   * Подключение к IMAP серверу
   */
  async connectImap(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.imapConnection = new Imap({
        user: this.configService.get('IMAP_USER'),
        password: this.configService.get('IMAP_PASS'),
        host: this.configService.get('IMAP_HOST'),
        port: this.configService.get('IMAP_PORT', 993),
        tls: true,
        tlsOptions: { rejectUnauthorized: false },
      });

      this.imapConnection.once('ready', () => {
        console.log('IMAP connection established');
        resolve();
      });

      this.imapConnection.once('error', (err: any) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });

      this.imapConnection.connect();
    });
  }

  /**
   * Отключение от IMAP сервера
   */
  async disconnectImap(): Promise<void> {
    if (this.imapConnection) {
      this.imapConnection.end();
    }
  }

  /**
   * Получение писем из папки "Входящие"
   */
  async fetchEmails(criteria: any[] = ['UNSEEN']): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const emails: any[] = [];

      this.imapConnection.openBox('INBOX', false, (err: any, box: any) => {
        if (err) {
          reject(err);
          return;
        }

        const fetchOptions = {
          bodies: '',
          markSeen: true,
        };

        const fetch = this.imapConnection.seq.fetch(
          box.messages.total + ':*',
          fetchOptions
        );

        fetch.on('message', (msg: any) => {
          msg.on('body', (stream: any) => {
            simpleParser(stream, async (err: any, parsed: any) => {
              if (!err) {
                emails.push({
                  from: parsed.from?.text,
                  subject: parsed.subject,
                  date: parsed.date,
                  text: parsed.text,
                  html: parsed.html,
                  attachments: parsed.attachments,
                });
              }
            });
          });
        });

        fetch.once('end', () => {
          resolve(emails);
        });

        fetch.once('error', (err: any) => {
          reject(err);
        });
      });
    });
  }

  /**
   * Парсинг заявки из письма
   */
  parseRequestFromEmail(email: any): any {
    // Ищем ключевые слова в теме и теле письма
    const subject = email.subject?.toLowerCase() || '';
    const text = email.text?.toLowerCase() || '';

    const isTestRequest = 
      subject.includes('тест') || 
      subject.includes('ссто') ||
      subject.includes('ssas') ||
      text.includes('тестирование ссто');

    if (!isTestRequest) {
      return null;
    }

    // Извлекаем данные из письма (простой парсер)
    const extractField = (fieldName: string, content: string): string | null => {
      const patterns = [
        new RegExp(`${fieldName}[:\\s]+([^\\n]+)`, 'i'),
        new RegExp(`${fieldName}[:\\s]*([^,;]+)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
      return null;
    };

    const fullText = `${email.subject || ''}\n${email.text || ''}`;

    return {
      source: 'email',
      emailFrom: email.from,
      emailSubject: email.subject,
      emailDate: email.date,
      vesselName: extractField('судно|vessel', fullText),
      mmsi: extractField('mmsi', fullText),
      imo: extractField('imo', fullText),
      callSign: extractField('позывной|call sign', fullText),
      testDate: extractField('дата тест|test date', fullText),
      contactPerson: extractField('контакт|contact', fullText),
      contactEmail: email.from,
      rawContent: email.text,
    };
  }

  /**
   * Мониторинг новых писем
   */
  async startEmailMonitoring(callback: (request: any) => void): Promise<void> {
    setInterval(async () => {
      try {
        await this.connectImap();
        const emails = await this.fetchEmails(['UNSEEN']);
        
        for (const email of emails) {
          const request = this.parseRequestFromEmail(email);
          if (request) {
            callback(request);
          }
        }

        await this.disconnectImap();
      } catch (error) {
        console.error('Email monitoring error:', error);
      }
    }, 60000); // Проверка каждую минуту
  }

  /**
   * Отправка уведомления о новой заявке
   */
  async sendNewRequestNotification(request: any): Promise<void> {
    const recipients = buildRecipientList([
      this.configService.get('OPERATOR_EMAIL'),
      request.contactEmail,
    ].filter(Boolean) as string[]);

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `Новая заявка на тестирование ССТО - ${request.vesselName || 'Без названия'}`,
      html: `
        <h2>Получена новая заявка на тестирование ССТО</h2>
        <p><strong>Судно:</strong> ${request.vesselName || 'Не указано'}</p>
        <p><strong>MMSI:</strong> ${request.mmsi || 'Не указан'}</p>
        <p><strong>Дата теста:</strong> ${request.testDate || 'Не указана'}</p>
        <p><strong>Контактное лицо:</strong> ${request.contactPerson || 'Не указано'}</p>
        <p><strong>Email:</strong> ${request.contactEmail || 'Не указан'}</p>
        <hr>
        <p><em>Заявка получена из email: ${request.emailFrom}</em></p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка подтверждения о получении заявки
   */
  async sendRequestConfirmation(request: any): Promise<void> {
    const recipients = buildRecipientList(request.contactEmail);

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `Подтверждение получения заявки на тестирование ССТО`,
      html: `
        <h2>Ваша заявка получена</h2>
        <p>Уважаемый(ая) ${request.contactPerson || 'Заявитель'},</p>
        <p>Мы получили вашу заявку на тестирование ССТО для судна ${request.vesselName || 'Без названия'}.</p>
        <p>Заявке присвоен номер: ${request.requestNumber || 'В обработке'}</p>
        <p>Мы свяжемся с вами в ближайшее время для согласования деталей.</p>
        <br>
        <p>С уважением,<br>Служба тестирования ССТО</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка напоминания о предстоящем тесте
   */
  async sendTestReminder(request: any, reminderType: 'T-30' | 'T-0'): Promise<void> {
    const daysText = reminderType === 'T-30' ? '30 дней' : '15 дней';
    
    const recipients = buildRecipientList([
      request.contactEmail,
      request.ownerEmail,
      this.configService.get('OPERATOR_EMAIL'),
    ].filter(Boolean) as string[]);

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `Напоминание: Тестирование ССТО через ${daysText} - ${request.vesselName}`,
      html: `
        <h2>Напоминание о тестировании ССТО</h2>
        <p><strong>Судно:</strong> ${request.vesselName}</p>
        <p><strong>MMSI:</strong> ${request.mmsi}</p>
        <p><strong>Дата теста:</strong> ${request.testDate}</p>
        <p><strong>Осталось дней:</strong> ${daysText}</p>
        <hr>
        <p>Пожалуйста, подтвердите готовность к тестированию.</p>
        <p>В случае необходимости переноса, свяжитесь с нами заранее.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка результатов теста
   */
  async sendTestResults(request: any, results: any, pdfBuffer?: Buffer): Promise<void> {
    const recipients = buildRecipientList([
      request.contactEmail,
      request.ownerEmail,
      request.operatorEmail,
      this.configService.get('ARCHIVE_EMAIL'),
    ].filter(Boolean) as string[]);

    const statusText = results.success ? 'УСПЕШНО' : 'НЕ ПРОЙДЕН';
    const statusColor = results.success ? 'green' : 'red';

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `Результаты тестирования ССТО - ${request.vesselName} - ${statusText}`,
      html: `
        <h2>Результаты тестирования ССТО</h2>
        <p><strong>Судно:</strong> ${request.vesselName}</p>
        <p><strong>MMSI:</strong> ${request.mmsi}</p>
        <p><strong>Дата теста:</strong> ${request.testDate}</p>
        <p><strong>Результат:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        <hr>
        <h3>Детали тестирования:</h3>
        <p><strong>Время начала:</strong> ${results.startTime}</p>
        <p><strong>Время завершения:</strong> ${results.endTime}</p>
        <p><strong>Оператор:</strong> ${results.operatorName}</p>
        ${results.comments ? `<p><strong>Комментарии:</strong> ${results.comments}</p>` : ''}
        <hr>
        <p>Подробный отчет во вложении.</p>
      `,
      attachments: pdfBuffer ? [{
        filename: `SSTO_Test_Report_${request.vesselName}_${new Date().toISOString().split('T')[0]}.pdf`,
        content: pdfBuffer,
      }] : [],
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка уведомления об ошибке
   */
  async sendErrorNotification(error: any, context: string): Promise<void> {
    const recipients = buildRecipientList(this.configService.get('ADMIN_EMAIL'));

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `[ССТО] Ошибка системы - ${context}`,
      html: `
        <h2>Обнаружена ошибка в системе ССТО</h2>
        <p><strong>Контекст:</strong> ${context}</p>
        <p><strong>Время:</strong> ${new Date().toISOString()}</p>
        <hr>
        <h3>Детали ошибки:</h3>
        <pre>${JSON.stringify(error, null, 2)}</pre>
        <hr>
        <p>Требуется проверка системы.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (sendError) {
      console.error('Failed to send error notification:', sendError);
    }
  }

  /**
   * Универсальная функция отправки email
   */
  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }): Promise<any> {
    const recipients = buildRecipientList(options.to);
    
    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      attachments: options.attachments || [],
    };

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка отчета по email
   */
  async sendTestReport(testData: any, pdfBuffer?: Buffer): Promise<void> {
    const recipients = buildRecipientList([
      testData.requesterEmail,
      testData.ownerEmail, 
      testData.operatorEmail,
    ].filter(Boolean) as string[]);

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: `Отчет о тестировании ССТО - ${testData.vesselName}`,
      html: '<h2>Тестирование ССТО завершено</h2><p>Результаты во вложении.</p>',
      attachments: pdfBuffer ? [{
        filename: `report_${testData.vesselName}_${Date.now()}.pdf`,
        content: pdfBuffer,
      }] : [],
    };

    await this.transporter.sendMail(mailOptions);
  }
}
