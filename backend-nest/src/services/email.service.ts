import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildRecipientList } from '../email/recipient.policy';
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
   * Проверка входящих email с сигналами и заявками
   */
  async checkIncomingEmails(): Promise<any> {
    const results = {
      signals: [],
      requests: [],
      unrecognized: []
    };
    
    return new Promise((resolve, reject) => {
      this.imap.once('ready', () => {
        this.imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          this.imap.search(['UNSEEN'], (err, searchResults) => {
            if (err) {
              reject(err);
              return;
            }

            if (searchResults.length === 0) {
              this.imap.end();
              resolve(results);
              return;
            }

            const fetch = this.imap.fetch(searchResults, { bodies: '', markSeen: true });

            fetch.on('message', (msg) => {
              let rawEmail = '';

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  rawEmail += chunk.toString('utf8');
                });

                stream.once('end', async () => {
                  try {
                    const parsed = await simpleParser(rawEmail);
                    
                    // Определяем тип письма
                    const emailType = this.detectEmailType(parsed);
                    
                    if (emailType === 'signal') {
                      const signalData = this.parseSignalFromEmail(parsed);
                      if (signalData) {
                        results.signals.push(signalData);
                      }
                    } else if (emailType === 'request') {
                      const requestData = this.parseRequestFromEmail(parsed);
                      if (requestData) {
                        results.requests.push(requestData);
                      }
                    } else {
                      results.unrecognized.push({
                        subject: parsed.subject,
                        from: parsed.from?.text,
                        date: parsed.date,
                        preview: (parsed.text || '').substring(0, 200)
                      });
                    }
                  } catch (parseErr) {
                    console.error('Ошибка парсинга email:', parseErr);
                  }
                });
              });
            });

            fetch.once('end', () => {
              this.imap.end();
              resolve(results);
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
   * Определение типа письма с приоритетом на тему
   */
  private detectEmailType(parsed: any): 'signal' | 'request' | 'unknown' {
    const text = (parsed.text || '').toLowerCase();
    const subject = (parsed.subject || '').toLowerCase();
    
    // ПРИОРИТЕТ 1: Проверяем тему письма на ключевые слова заявки
    const requestSubjectKeywords = [
      'заявка', 'заявке', 'заявку',
      'ссто', 
      'тест', 'теста', 'тесте', 'тестирование', 'тестирования', 'тестировании',
      'проверка', 'проверке', 'проверку', 'проверки', 'проверить', 'проверяем'
    ];
    
    const hasRequestKeywordsInSubject = requestSubjectKeywords.some(kw => subject.includes(kw));
    
    if (hasRequestKeywordsInSubject) {
      console.log(`Обнаружена ЗАЯВКА по теме письма: "${parsed.subject}"`);
      return 'request';
    }
    
    // ПРИОРИТЕТ 2: Проверяем на признаки сигнала ССТО
    const signalKeywords = ['mmsi', 'terminal', 'lat:', 'lon:', 'latitude', 'longitude', 'alert', 'distress'];
    const signalScore = signalKeywords.filter(kw => text.includes(kw) || subject.includes(kw)).length;
    
    if (signalScore >= 3) {
      console.log(`Обнаружен СИГНАЛ по содержимому`);
      return 'signal';
    }
    
    // ПРИОРИТЕТ 3: Проверяем текст на признаки заявки
    const requestTextKeywords = [
      'просим провести', 'необходимо протестировать', 'планируем тест',
      'требуется проверка', 'судно', 'vessel', 'imo', 'название судна'
    ];
    const requestTextScore = requestTextKeywords.filter(kw => text.includes(kw)).length;
    
    if (requestTextScore >= 2) {
      console.log(`Вероятная заявка по содержимому текста`);
      return 'request';
    }
    
    console.log(`Не удалось определить тип письма: "${parsed.subject}"`);
    return 'unknown';
  }

  /**
   * Парсинг неформализованной заявки на тестирование
   */
  private parseRequestFromEmail(parsed: any): any {
    const text = parsed.text || '';
    const subject = parsed.subject || '';
    
    const request: any = {
      emailSubject: subject,
      emailFrom: parsed.from?.text,
      emailDate: parsed.date,
      rawMessage: text,
      parsedData: {}
    };

    // Извлечение email отправителя
    const emailMatch = parsed.from?.text?.match(/<(.+@.+)>/);
    request.parsedData.requesterEmail = emailMatch ? emailMatch[1] : parsed.from?.text;
    
    // Извлечение имени отправителя
    const nameMatch = parsed.from?.text?.match(/^([^<]+)</);
    request.parsedData.requesterName = nameMatch ? nameMatch[1].trim() : 'Не указано';

    // Паттерны для извлечения данных
    const patterns = {
      terminal: [
        /(?:номер стойки|стойка|terminal|терминал)[:\s]*([0-9]{9}|IR-[0-9]+)/i,
        /(?:ИНМАРСАТ|INMARSAT)[:\s]*([0-9]{9})/i,
        /(?:ИРИДИУМ|IRIDIUM)[:\s]*(IR-[0-9]+)/i,
        /\b([0-9]{9})\b/
      ],
      mmsi: [
        /MMSI[:\s]*([0-9]{9})/i,
        /ММСИ[:\s]*([0-9]{9})/i
      ],
      vessel: [
        /(?:судно|vessel|ship|название)[:\s]*([А-Яа-яA-Za-z0-9\s\-\.]+?)(?:\n|,|;|$)/i,
        /(?:т\/х|м\/в|MV|MT)\s+([А-Яа-яA-Za-z0-9\s\-\.]+?)(?:\n|,|;|$)/i,
        /«([^»]+)»/,
        /"([^"]+)"/
      ],
      imo: [
        /IMO[:\s]*([0-9]{7})/i,
        /ИМО[:\s]*([0-9]{7})/i
      ],
      testDate: [
        /(?:дата|date|планируем|тестирование)[:\s]*([0-9]{1,2}[\.\-\/][0-9]{1,2}[\.\-\/][0-9]{2,4})/i,
        /([0-9]{1,2})\s+(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)\s+([0-9]{4})/i
      ],
      phone: [
        /(?:тел|телефон|phone|mobile)[:\s]*([\+\d\s\-\(\)]+)/i,
        /(\+7[\s\-\(\)]*\d{3}[\s\-\(\)]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2})/
      ],
      company: [
        /(?:компания|организация|company|ООО|ОАО|ЗАО|ПАО|LLC|Ltd)[:\s]*([А-Яа-яA-Za-z0-9\s\-\.\"]+?)(?:\n|,|;|$)/i
      ]
    };

    // Применяем паттерны
    for (const [field, fieldPatterns] of Object.entries(patterns)) {
      for (const pattern of fieldPatterns) {
        const match = text.match(pattern);
        if (match) {
          if (field === 'testDate' && match[2]) {
            request.parsedData[field] = this.parseRussianDate(`${match[1]} ${match[2]} ${match[3]}`);
          } else {
            request.parsedData[field] = match[1]?.trim();
          }
          break;
        }
      }
    }

    // Определяем тип системы по номеру терминала
    if (request.parsedData.terminal) {
      if (request.parsedData.terminal.startsWith('IR-')) {
        request.parsedData.terminalType = 'IRIDIUM';
      } else if (request.parsedData.terminal.match(/^[0-9]{9}$/)) {
        request.parsedData.terminalType = 'INMARSAT';
      }
    }

    // Проверка минимальных данных для заявки
    if (request.parsedData.terminal || request.parsedData.vessel || request.parsedData.mmsi) {
      return request;
    }

    return null;
  }

  /**
   * Парсинг сигнала из email
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
    const months: { [key: string]: number } = {
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

    // Пробуем стандартный парсинг
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date() : date;
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
    const recipients = buildRecipientList(options.to);

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: recipients,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      attachments: options.attachments || []
    };

    return await this.transporter.sendMail(mailOptions);
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
        filename: 'report.pdf',
        content: pdfBuffer
      }] : []
    };

    await this.transporter.sendMail(mailOptions);
  }
}
