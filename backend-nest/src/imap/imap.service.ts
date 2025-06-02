import { Injectable } from '@nestjs/common';
import * as Imap from 'imap';
import { NotificationService } from '../notification/notification.service';
import { SignalService } from '../signal/signal.service';

@Injectable()
export class ImapService {
  private imap: Imap;

  constructor(
    private signalService: SignalService,
    private notificationService: NotificationService,
  ) {
    this.imap = new Imap({
      user: process.env.IMAP_USER,
      password: process.env.IMAP_PASS,
      host: 'imap.morflot.ru',
      port: 143,
      tls: false,
    });

    this.imap.once('ready', () => this.startListening());
    this.imap.once('error', (err) => console.error('IMAP error:', err));
    this.imap.connect();
  }

  private startListening() {
    this.imap.openBox('INBOX', false, (err) => {
      if (err) throw err;

      this.imap.on('mail', () => this.processNewMail());
    });
  }

  private async processNewMail() {
    this.imap.search(['UNSEEN'], (err, results) => {
      if (err) throw err;

      if (!results || results.length === 0) return;

      const fetch = this.imap.fetch(results, { bodies: ['TEXT'], markSeen: true });
      fetch.on('message', (msg) => {
        msg.on('body', (stream) => {
          let buffer = '';
          stream.on('data', (chunk) => (buffer += chunk.toString('utf8')));
          stream.on('end', async () => {
            const signalData = this.parseEmail(buffer);
            if (signalData) {
              await this.signalService.createSignal(signalData);
              await this.notificationService.sendNotification(
                ['email', 'sms', 'telegram'],
                [process.env.ADMIN_EMAIL, process.env.ADMIN_PHONE, process.env.ADMIN_TELEGRAM],
                `Новый сигнал: MMSI ${signalData.mmsi}, Тип: ${signalData.signal_type}`,
              );
            }
          });
        });
      });
    });
  }

  private parseEmail(emailBody: string): any {
    const mmsiMatch = emailBody.match(/MMSI: (\d{9})/);
    const typeMatch = emailBody.match(/(TEST|ALERT|UNSCHEDULED)/i);
    const coordsMatch = emailBody.match(/Coordinates: ([-]?\d{1,3}\.\d+),([-]?\d{1,3}\.\d+)/);

    if (!mmsiMatch || !typeMatch) return null;

    const signalType = typeMatch[1].toLowerCase() as 'test' | 'alert' | 'unscheduled';
    return {
      signal_id: `SIG-${Date.now()}`,
      mmsi: mmsiMatch[1],
      signal_type: signalType,
      received_at: new Date(),
      coordinates: coordsMatch ? `${coordsMatch[1]},${coordsMatch[2]}` : null,
    };
  }
}
