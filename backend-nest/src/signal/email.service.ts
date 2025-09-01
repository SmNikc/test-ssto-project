// backend-nest/src/signal/email.service.ts
// РАСШИРЕННАЯ версия для чтения и ССТО сигналов, и заявок по email
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalService } from './signal.service';
import { RequestService } from '../request/request.service'; // Добавим для заявок
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';

@Injectable()
export class EmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name);
  private imap: Imap;
  private checkInterval: NodeJS.Timeout;
  
  constructor(
    private configService: ConfigService,
    private signalService: SignalService,
    private requestService: RequestService, // Добавим для обработки заявок
  ) {}

  async onModuleInit() {
    const enabled = this.configService.get('IMAP_ENABLED') === 'true';
    if (!enabled) {
      this.logger.log('📧 Email monitoring disabled (IMAP_ENABLED=false)');
      return;
    }
    
    this.logger.log('📧 Starting email monitoring service...');
    await this.connectToImap();
    
    // Проверяем почту каждые 5 минут
    const interval = this.configService.get('IMAP_CHECK_INTERVAL', 300000);
    this.checkInterval = setInterval(() => {
      this.checkNewEmails();
    }, interval);
  }

  async onModuleDestroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    if (this.imap) {
      this.imap.end();
    }
  }

  private async connectToImap() {
    return new Promise((resolve, reject) => {
      this.imap = new Imap({
        user: this.configService.get('IMAP_USER'),
        password: this.configService.get('IMAP_PASSWORD'),
        host: this.configService.get('IMAP_HOST'),
        port: this.configService.get('IMAP_PORT'),
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      this.imap.once('ready', () => {
        this.logger.log('✅ Connected to email server');
        this.checkNewEmails();
        resolve(true);
      });

      this.imap.once('error', (err) => {
        this.logger.error('❌ Email connection error:', err.message);
        reject(err);
      });

      this.imap.connect();
    });
  }

  private checkNewEmails() {
    if (!this.imap || this.imap.state !== 'authenticated') {
      this.logger.warn('IMAP not connected, skipping check');
      return;
    }

    this.imap.openBox('INBOX', false, (err, box) => {
      if (err) {
        this.logger.error('Error opening inbox:', err.message);
        return;
      }

      // Ищем непрочитанные письма за последние 7 дней
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      this.imap.search(['UNSEEN', ['SINCE', weekAgo]], (err, results) => {
        if (err) {
          this.logger.error('Search error:', err.message);
          return;
        }
        
        if (!results || !results.length) {
          this.logger.log('No new emails found');
          return;
        }

        this.logger.log(`Found ${results.length} new email(s)`);
        const fetch = this.imap.fetch(results, { 
          bodies: '',
          markSeen: true 
        });
        
        fetch.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, async (err, parsed) => {
              if (err) {
                this.logger.error('Parse error:', err.message);
                return;
              }
              
              const subject = parsed.subject || '';
              const from = parsed.from?.text || '';
              const text = parsed.text || parsed.html || '';
              
              // Определяем тип письма
              const emailType = this.determineEmailType(subject, from, text);
              
              switch(emailType) {
                case 'SSTO_SIGNAL':
                  await this.processSstoSignal(parsed);
                  break;
                case 'TEST_REQUEST':
                  await this.processTestRequest(parsed);
                  break;
                case 'UNKNOWN':
                  this.logger.log(`Skipping non-relevant email from: ${from}`);
                  break;
              }
            });
          });
        });

        fetch.once('error', (err) => {
          this.logger.error('Fetch error:', err.message);
        });
      });
    });
  }

  // Определяем тип письма
  private determineEmailType(subject: string, from: string, body: string): string {
    // ССТО сигналы (от Inmarsat, SkyFile и т.д.)
    const sstoKeywords = ['SSAS', 'Ship Security', 'Test Message', 'DISTRESS', 'ALERT'];
    const sstoSenders = ['inmarsat', 'skyfile', 'iridium', 'thuraya'];
    
    const isSstoSignal = 
      sstoKeywords.some(kw => subject.toUpperCase().includes(kw) || body.includes(kw)) ||
      sstoSenders.some(sender => from.toLowerCase().includes(sender));
    
    if (isSstoSignal) return 'SSTO_SIGNAL';
    
    // Заявки на тестирование
    const requestKeywords = ['заявка', 'тест', 'тестирование', 'request', 'application'];
    const isTestRequest = requestKeywords.some(kw => 
      subject.toLowerCase().includes(kw) || body.toLowerCase().includes(kw)
    );
    
    if (isTestRequest) return 'TEST_REQUEST';
    
    return 'UNKNOWN';
  }

  // Обработка ССТО сигнала (как было)
  private async processSstoSignal(parsed: any) {
    const subject = parsed.subject || '';
    const from = parsed.from?.text || '';
    const text = parsed.text || parsed.html || '';
    const date = parsed.date || new Date();
    
    this.logger.log(`📨 Processing SSTO signal from: ${from}`);
    
    try {
      // Извлекаем данные сигнала
      const signalData = this.extractSignalData(text);
      
      const signal = await this.signalService.processEmailSignal(
        subject,
        text,
        date,
        parsed.messageId || `email-${Date.now()}`,
        signalData
      );
      
      this.logger.log(`✅ SSTO signal processed: ID ${signal.id}, MMSI: ${signalData.mmsi}`);
    } catch (error) {
      this.logger.error(`Failed to process SSTO signal: ${error.message}`);
    }
  }

  // НОВОЕ: Обработка заявки на тестирование
  private async processTestRequest(parsed: any) {
    const subject = parsed.subject || '';
    const from = parsed.from?.text || '';
    const text = parsed.text || parsed.html || '';
    
    this.logger.log(`📋 Processing test request from: ${from}`);
    
    try {
      // Извлекаем данные заявки из письма
      const requestData = this.extractRequestData(text, from);
      
      // Создаем заявку через RequestService
      const request = await this.requestService.create({
        vessel_name: requestData.vessel_name,
        mmsi: requestData.mmsi,
        imo: requestData.imo,
        ship_owner: requestData.ship_owner,
        contact_email: from.match(/<(.+)>/)?.[1] || from,
        contact_phone: requestData.contact_phone,
        test_date: requestData.test_date,
        test_window_hours: 2,
        inmarsat_number: requestData.inmarsat_number,
      });
      
      this.logger.log(`✅ Test request created: ID ${request.id}, Vessel: ${request.vessel_name}`);
      
      // Отправляем автоматическое подтверждение получения заявки
      // (не путать с подтверждением теста)
      await this.sendRequestReceivedConfirmation(request);
      
    } catch (error) {
      this.logger.error(`Failed to process test request: ${error.message}`);
    }
  }

  // Извлечение данных сигнала (существующий метод)
  private extractSignalData(emailText: string): any {
    const data: any = {};

    // MMSI
    const mmsiMatch = emailText.match(/MMSI[:\s]+(\d{9})/i);
    if (mmsiMatch) data.mmsi = mmsiMatch[1];

    // INMARSAT
    const inmarsatMatch = emailText.match(/Mobile Terminal No[:\s]+(\d+)/i);
    if (inmarsatMatch) data.inmarsat_number = inmarsatMatch[1];

    // Координаты
    const latMatch = emailText.match(/(\d+)°(\d+\.?\d*)['']([NS])/);
    const lonMatch = emailText.match(/(\d+)°(\d+\.?\d*)['']([EW])/);
    
    if (latMatch && lonMatch) {
      const latDeg = parseFloat(latMatch[1]);
      const latMin = parseFloat(latMatch[2]);
      const lat = latDeg + latMin / 60;
      data.latitude = latMatch[3] === 'S' ? -lat : lat;

      const lonDeg = parseFloat(lonMatch[1]);
      const lonMin = parseFloat(lonMatch[2]);
      const lon = lonDeg + lonMin / 60;
      data.longitude = lonMatch[3] === 'W' ? -lon : lon;
    }

    // Тип сигнала
    if (emailText.toLowerCase().includes('test')) {
      data.signal_type = 'TEST';
    } else if (emailText.toLowerCase().includes('distress')) {
      data.signal_type = 'DISTRESS';
    } else {
      data.signal_type = 'ALERT';
    }

    return data;
  }

  // НОВОЕ: Извлечение данных заявки из письма
  private extractRequestData(emailText: string, fromEmail: string): any {
    const data: any = {};
    
    // Пытаемся найти структурированные данные
    // Название судна
    const vesselMatch = emailText.match(/Судно[:\s]+(.+?)[\n\r]/i) || 
                       emailText.match(/Vessel[:\s]+(.+?)[\n\r]/i);
    data.vessel_name = vesselMatch?.[1]?.trim() || 'Не указано';
    
    // MMSI
    const mmsiMatch = emailText.match(/MMSI[:\s]+(\d{9})/i);
    data.mmsi = mmsiMatch?.[1] || '';
    
    // IMO
    const imoMatch = emailText.match(/IMO[:\s]+([\w\d]+)/i);
    data.imo = imoMatch?.[1] || '';
    
    // Судовладелец
    const ownerMatch = emailText.match(/Судовладелец[:\s]+(.+?)[\n\r]/i) || 
                      emailText.match(/Owner[:\s]+(.+?)[\n\r]/i);
    data.ship_owner = ownerMatch?.[1]?.trim() || 'Не указан';
    
    // Телефон
    const phoneMatch = emailText.match(/Телефон[:\s]+([\d\s\-\+\(\)]+)/i) || 
                      emailText.match(/Phone[:\s]+([\d\s\-\+\(\)]+)/i);
    data.contact_phone = phoneMatch?.[1]?.trim() || '';
    
    // Дата теста
    const dateMatch = emailText.match(/Дата теста[:\s]+(.+?)[\n\r]/i) || 
                     emailText.match(/Test date[:\s]+(.+?)[\n\r]/i);
    if (dateMatch) {
      try {
        data.test_date = new Date(dateMatch[1]).toISOString();
      } catch {
        data.test_date = new Date().toISOString();
      }
    } else {
      data.test_date = new Date().toISOString();
    }
    
    // INMARSAT номер
    const inmarsatMatch = emailText.match(/INMARSAT[:\s]+(\d+)/i);
    data.inmarsat_number = inmarsatMatch?.[1] || '';
    
    return data;
  }

  // Отправка подтверждения получения заявки
  private async sendRequestReceivedConfirmation(request: any) {
    // Используем EmailSenderService для отправки
    this.logger.log(`Sending request received confirmation to: ${request.contact_email}`);
    // Здесь вызов EmailSenderService
  }

  // Проверка статуса IMAP
  getImapStatus(): { enabled: boolean; connected: boolean } {
    return {
      enabled: this.configService.get('IMAP_ENABLED') === 'true',
      connected: this.imap?.state === 'authenticated'
    };
  }
}