import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class NotificationService {
  private transporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio;
  private telegramBot: TelegramBot;

  constructor() {
    // Настройка email (SMTP)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Настройка Twilio (SMS)
    this.twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

    // Настройка Telegram
    this.telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
    });
  }

  async sendSMS(to: string, body: string): Promise<void> {
    await this.twilioClient.messages.create({
      body,
      from: process.env.TWILIO_PHONE,
      to,
    });
  }

  async sendTelegram(chatId: string, message: string): Promise<void> {
    await this.telegramBot.sendMessage(chatId, message);
  }

  async sendNotification(channels: string[], recipients: string[], message: string): Promise<void> {
    for (const channel of channels) {
      for (const recipient of recipients) {
        try {
          if (channel === 'email') {
            await this.sendEmail(recipient, 'Уведомление от Тест ССТО', message);
          } else if (channel === 'sms') {
            await this.sendSMS(recipient, message);
          } else if (channel === 'telegram') {
            await this.sendTelegram(recipient, message);
          }
        } catch (error) {
          console.error(`Ошибка отправки уведомления через ${channel}:`, error);
        }
      }
    }
  }
}
