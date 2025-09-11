import { Injectable } from '@nestjs/common';
@Injectable()
export class NotificationService {
  async sendEmail(to: string, subject: string, body: string) {
    return true;
  }
  async sendSMS(phone: string, text: string) {
    return true;
  }
  async sendTelegram(chatId: string, text: string) {
    return true;
  }
}
