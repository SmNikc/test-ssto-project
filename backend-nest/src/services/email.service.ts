import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private configService: ConfigService,
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}

  async checkEmails(): Promise<Signal[]> {
    this.logger.log('Checking emails (stub implementation)');
    // Упрощенная реализация для MVP
    return [];
  }

  async sendTestEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`Test email would be sent to: ${to}`);
    this.logger.log(`Subject: ${subject}`);
    this.logger.log(`Body preview: ${body.substring(0, 100)}...`);
  }

  async testConnection(): Promise<boolean> {
    this.logger.log('Email connection test (stub)');
    return true;
  }

  private extractBeaconId(text: string): string {
    const hexPattern = /\b[A-F0-9]{15}\b/i;
    const match = text.match(hexPattern);
    return match ? match[0].toUpperCase() : 'UNKNOWN';
  }

  private detectFrequency(text: string): string {
    const text_lower = text.toLowerCase();
    
    if (text_lower.includes('406') && text_lower.includes('121')) {
      return 'both';
    } else if (text_lower.includes('406')) {
      return '406';
    } else if (text_lower.includes('121')) {
      return '121.5';
    }
    
    return '406';
  }
}