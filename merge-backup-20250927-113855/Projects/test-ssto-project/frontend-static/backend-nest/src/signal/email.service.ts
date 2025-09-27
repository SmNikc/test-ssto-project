// backend-nest/src/signal/email.service.ts
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignalService } from './signal.service';
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
              
              // Фильтруем письма от ССТО
              const subject = parsed.subject || '';
              const from = parsed.from?.text || '';
              const text = parsed.text || parsed.html || '';
              const date = parsed.date || new Date();
              
              if (this.isSStoSignal(subject, from)) {
                this.logger.log(`📨 Processing signal: ${subject}`);
                
                try {
                  // ИСПРАВЛЕНО: передаем объект с правильными полями
                  const signal = await this.signalService.processEmailSignal({
                    from: from,
                    text: text,
                    date: date,
                    messageId: parsed.messageId || `email-${Date.now()}`,
                    subject: subject,
                    type: 'EMAIL_SIGNAL'
                  });
                  
                  this.logger.log(`✅ Signal processed: ID ${signal.id}, Status: ${signal.status}`);
                } catch (error) {
                  this.logger.error(`Failed to process signal: ${error.message}`);
                }
              } else {
                this.logger.log(`Skipping non-SSTO email: ${subject}`);
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

  private isSStoSignal(subject: string, from: string): boolean {
    const keywords = ['SSAS', 'TEST', 'AIS', 'EPIRB', 'SART', 'ALERT', 'SIGNAL'];
    const senderKeywords = ['ssto', 'mrcc', 'rescue', 'maritime', 'inmarsat', 'skyfile'];
    
    const subjectMatch = keywords.some(keyword => 
      subject.toUpperCase().includes(keyword)
    );
    
    const senderMatch = senderKeywords.some(keyword => 
      from.toLowerCase().includes(keyword)
    );
    
    return subjectMatch || senderMatch;
  }

  // Метод для ручной проверки почты
  async checkEmailsManually(): Promise<{ processed: number; errors: number }> {
    this.logger.log('Manual email check initiated');
    await this.checkNewEmails();
    return { processed: 0, errors: 0 }; // Заглушка для подсчета
  }
  
  // Извлечение данных сигнала из текста письма
  private extractSignalData(emailText: string): any {
    const data: any = {};

    // Извлекаем MMSI
    const mmsiMatch = emailText.match(/MMSI[:\s]+(\d{9})/i);
    if (mmsiMatch) {
      data.mmsi = mmsiMatch[1];
    }

    // Извлекаем INMARSAT номер
    const inmarsatMatch = emailText.match(/Mobile Terminal No[:\s]+(\d+)/i);
    if (inmarsatMatch) {
      data.inmarsat_number = inmarsatMatch[1];
    }

    // Извлекаем координаты
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

    // Извлекаем тип сигнала
    if (emailText.toLowerCase().includes('test')) {
      data.signal_type = 'TEST';
    } else if (emailText.toLowerCase().includes('distress')) {
      data.signal_type = 'DISTRESS';
    } else {
      data.signal_type = 'ALERT';
    }

    return data;
  }
}