import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');

@Injectable()
export class EmailService {
  private transporter: any;
  private imap: any;

  constructor(private configService: ConfigService) {
    // Настройка SMTP
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD')
      }
    });

    // Настройка IMAP
    this.imap = new Imap({
      user: this.configService.get('IMAP_USER'),
      password: this.configService.get('IMAP_PASSWORD'),
      host: this.configService.get('IMAP_HOST', 'imap.gmail.com'),
      port: this.configService.get('IMAP_PORT', 993),
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });
  }

  /**
   * Проверка входящих email с сигналами
   */
  async checkIncomingSignals(): Promise<any[]> {
    const signals = [];
    
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              reject(err);
              return;
            }

            if (results.length === 0) {
              this.imap.end();
              resolve([]);
              return;
            }

            const fetch = this.imap.fetch(results, { bodies: '', markSeen: true });

            fetch.on('message', (msg) => {
              let rawEmail = '';

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  rawEmail += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(rawEmail);
                    const signalData = this.parseSignalFromEmail(parsed);
                    if (signalData) {
                      signals.push(signalData);
                    }
                  } catch (parseErr) {
                    console.error('Ошибка парсинга:', parseErr);
                  }
                });
              });
            });

            fetch.once('end', () => {
              this.imap.end();
              resolve(signals);
            });

            fetch.once('error', reject);
          });
        });
      });

      this.imap.once('error', reject);
      this.imap.connect();
    });
  }

  /**
   * Парсинг сигнала из email - поддержка русских дат
   */
  private parseSignalFromEmail(parsed: any): any {
    const text = parsed.text || '';
    const subject = parsed.subject || '';

    const patterns = {
      mmsi: /MMSI[:\s]+(\d{9})/i,
      terminal: /Terminal[:\s]+([A-Z0-9-]+)/i,
      inmarsat: /(\d{9,})/,
      iridium: /IR-(\d+)/i,
      time: /Time[:\s]+([^\n\r]+)/i,
      lat: /Lat[:\s]+([-\d.]+)/i,
      lon: /Lon[:\s]+([-\d.]+)/i
    };

    const signal: any = {
      receivedAt: new Date(),
      emailSubject: subject,
      emailFrom: parsed.from?.text,
      rawMessage: text
    };

    // Извлекаем данные
    const mmsiMatch = text.match(patterns.mmsi);
    if (mmsiMatch) signal.mmsi = mmsiMatch[1];

    const terminalMatch = text.match(patterns.terminal);
    if (terminalMatch) {
      signal.terminalId = terminalMatch[1];
    } else {
      const inmarsatMatch = text.match(patterns.inmarsat);
      if (inmarsatMatch && inmarsatMatch[1].length === 9) {
        signal.terminalId = inmarsatMatch[1];
        signal.terminalType = 'INMARSAT';
      }
    }

    // Парсинг времени с поддержкой русского формата
    const timeMatch = text.match(patterns.time);
    if (timeMatch) {
      signal.signalTime = this.parseRussianDate(timeMatch[1]);
    }

    const latMatch = text.match(patterns.lat);
    const lonMatch = text.match(patterns.lon);
    if (latMatch && lonMatch) {
      signal.latitude = parseFloat(latMatch[1]);
      signal.longitude = parseFloat(lonMatch[1]);
    }

    // Определяем тип сигнала
    if (text.toLowerCase().includes('test')) {
      signal.signalType = 'test_406';
    } else {
      signal.signalType = 'real_alert';
    }

    return signal.terminalId || signal.mmsi ? signal : null;
  }

  /**
   * Парсинг русских дат
   */
  private parseRussianDate(dateStr: string): Date {
    const months = {
      'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
      'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
      'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
    };

    const match = dateStr.match(/(\d+)\s+(\w+)\s+(\d{4})\s+г?\.\s+(\d{1,2}):(\d{2}):(\d{2})/);
    if (match) {
      const month = months[match[2].toLowerCase()];
      if (month !== undefined) {
        return new Date(
          parseInt(match[3]), month, parseInt(match[1]),
          parseInt(match[4]), parseInt(match[5]), parseInt(match[6])
        );
      }
    }

    return new Date(dateStr);
  }

  /**
   * Универсальная отправка email
   */
  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }): Promise<any> {
    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      attachments: options.attachments || [],
    };

    return await this.transporter.sendMail(mailOptions);
  }

  /**
   * Отправка отчета по email
   */
  async sendTestReport(testData: any, pdfBuffer?: Buffer): Promise<void> {
    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: testData.requesterEmail,
      subject: 'Отчет о тестировании ССТО - ' + testData.vesselName,
      html: '<h2>Тестирование ССТО завершено</h2><p>Результаты во вложении.</p>',
      attachments: pdfBuffer ? [{
        filename: 'report.pdf',
        content: pdfBuffer
      }] : []
    };

    await this.transporter.sendMail(mailOptions);
  }
}
