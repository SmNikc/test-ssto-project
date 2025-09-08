// backend-nest/src/services/email-parser.service.ts
// Парсер входящих email-заявок под ваш чек-лист из 7 пунктов.
// Никаких внешних NLP-зависимостей, только аккуратные RegExp и безопасные дефолты.

import { Injectable, Logger } from '@nestjs/common';
import { RequestService } from '../request/request.service';

export interface EmailContent {
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

interface ExtractedFields {
  vessel_name?: string;
  terminal_number?: string; // Inmarsat/Iridium/SSAS ID
  imo_number?: string;
  ship_owner?: string;
  owner_address?: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  mmsi?: string;
  test_date?: Date;
  start_time?: string;
  end_time?: string;
}

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  constructor(private readonly requestService: RequestService) {}

  /**
   * Главная точка: разобрать письмо и создать заявку.
   */
  async parseEmailToRequest(email: EmailContent) {
    this.logger.log(`Парсинг email от ${email.from}`);

    const extracted = this.extractFieldsFromBody(email.body);

    const vessel_name =
      extracted.vessel_name?.trim() ||
      this.findAfterColon(email.body, ['Название судна', 'Судно', 'Vessel name']) ||
      'Неизвестное судно';

    const terminal_number =
      extracted.terminal_number?.trim() ||
      this.findAfterColon(email.body, ['Mobile Terminal No', 'Mobile Terminal Number', 'Inmarsat', 'Iridium', 'SSAS']) ||
      '';

    const imo_number =
      extracted.imo_number?.trim() ||
      this.findAfterColon(email.body, ['IMO', 'IMO номер']);

    const ship_owner =
      extracted.ship_owner?.trim() ||
      this.findAfterColon(email.body, ['Полное название судовладельца', 'Судовладелец', 'Owner']) ||
      'N/A SHIP OWNER';

    const owner_address =
      extracted.owner_address?.trim() ||
      this.findAfterColon(email.body, ['Адрес судовладельца', 'Owner address']) ||
      '';

    const contact_person =
      extracted.contact_person?.trim() ||
      this.findAfterColon(email.body, ['Ответственный за охрану', 'ФИО']) ||
      'Не указано';

    const contact_email =
      extracted.contact_email?.trim() ||
      this.findEmail(email.body) ||
      email.from;

    const contact_phone =
      extracted.contact_phone?.trim() ||
      this.findPhone(email.body) ||
      '+7 (000) 000-00-00';

    // MMSI — если есть в письме. Если нет, не блокируем создание.
    const mmsi =
      extracted.mmsi?.trim() ||
      this.findMmsi(email.body) ||
      undefined;

    // Дата/время
    const test_date = extracted.test_date ?? email.receivedAt ?? new Date();
    const start_time = extracted.start_time || this.findTime(email.body) || '10:00';
    const end_time = extracted.end_time || this.addHours(start_time, 4);

    // Собираем payload заявки; статус берём «pending» — сервис нормализует в БД.
    const payload = {
      vessel_name,
      mmsi: mmsi ?? '000000000', // не валим создание, если MMSI нет в письме
      imo_number,
      ssas_number: terminal_number || undefined,
      owner_organization: ship_owner, // дублируем для совместимости
      ship_owner,
      contact_person,
      contact_phone,
      contact_email,
      test_date,
      start_time,
      end_time,
      notes: this.composeNotes(email, { owner_address, terminal_number }),
      status: 'pending',
      source_uid: undefined as string | undefined, // сюда можно передавать UID письма, если он есть
    };

    try {
      const request = await this.requestService.create(payload as any);
      this.logger.log(`✅ Заявка создана: id=${request.id}, number=${(request as any).request_number ?? '-'}`);
      return {
        success: true,
        request,
        message: `Заявка от ${vessel_name} успешно создана из email`,
      };
    } catch (error: any) {
      this.logger.error(`Ошибка создания заявки: ${error?.message ?? error}`);
      return {
        success: false,
        error: String(error?.message ?? error),
      };
    }
  }

  /**
   * Пакетная обработка нескольких писем.
   */
  async processEmails(emails: EmailContent[]) {
    const results = [];
    for (const email of emails) {
      results.push(await this.parseEmailToRequest(email));
    }
    return {
      processed: emails.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }

  // ==========================
  // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
  // ==========================

  private extractFieldsFromBody(body: string): ExtractedFields {
    const lines = body.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

    const read = (labels: string[]): string | undefined => this.findAfterColon(body, labels);

    const vessel_name =
      read(['Название судна', 'Судно', 'Vessel name']) ??
      this.pickAfterKeyword(lines, /судн[оауе]/i);

    const terminal_number =
      read(['Mobile Terminal No', 'Mobile Terminal Number', 'SSAS', 'Inmarsat', 'Iridium']) ??
      this.pickAfterKeyword(lines, /(inmarsat|iridium|ssas)/i);

    const imo_number =
      read(['IMO', 'IMO номер']) ??
      this.pickAfterKeyword(lines, /imo/i);

    const ship_owner =
      read(['Полное название судовладельца', 'Судовладелец', 'Owner']) ??
      this.pickAfterKeyword(lines, /(судовладел|owner)/i);

    const owner_address =
      read(['Адрес судовладельца', 'Owner address']) ??
      this.pickAfterKeyword(lines, /(адрес|address)/i);

    const contact_person =
      read(['Ответственный за охрану', 'ФИО']) ??
      this.pickAfterKeyword(lines, /(ответственн|фио)/i);

    const contact_email =
      this.findEmail(body) ??
      read(['Электронный адрес']) ??
      undefined;

    const contact_phone =
      this.findPhone(body) ??
      undefined;

    const mmsi = this.findMmsi(body) ?? undefined;

    const test_date = this.findDate(body) ?? undefined;
    const start_time = this.findTime(body) ?? undefined;
    const end_time = start_time ? this.addHours(start_time, 4) : undefined;

    return {
      vessel_name,
      terminal_number,
      imo_number,
      ship_owner,
      owner_address,
      contact_person,
      contact_phone,
      contact_email,
      mmsi,
      test_date,
      start_time,
      end_time,
    };
  }

  private findAfterColon(text: string, labels: string[]): string | undefined {
    for (const label of labels) {
      const re = new RegExp(`${this.escapeRegex(label)}\\s*[:=]\\s*(.+)`, 'i');
      const m = re.exec(text);
      if (m && m[1]) return m[1].trim();
    }
    return undefined;
  }

  private pickAfterKeyword(lines: string[], re: RegExp): string | undefined {
    for (const line of lines) {
      if (re.test(line)) {
        const m = /[:=]\s*(.+)$/.exec(line);
        if (m && m[1]) return m[1].trim();
      }
    }
    return undefined;
  }

  private findEmail(text: string): string | undefined {
    const m = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.exec(text);
    return m?.[0];
  }

  private findPhone(text: string): string | undefined {
    const m = /\+?\d[\d\s\-()]{9,}/.exec(text);
    return m?.[0]?.trim();
  }

  private findMmsi(text: string): string | undefined {
    const m = /\bMMSI\s*[:=]?\s*(\d{9})\b/i.exec(text);
    return m?.[1];
  }

  private findDate(text: string): Date | undefined {
    // Простейшие форматы: YYYY-MM-DD, DD.MM.YYYY, DD/MM/YYYY
    const iso = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(text);
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    const dot = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/.exec(text);
    if (dot) return new Date(Number(dot[3]), Number(dot[2]) - 1, Number(dot[1]));
    const slash = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(text);
    if (slash) return new Date(Number(slash[3]), Number(slash[2]) - 1, Number(slash[1]));
    return undefined;
    }

  private findTime(text: string): string | undefined {
    const m = /\b(\d{1,2}):(\d{2})\b/.exec(text);
    if (!m) return undefined;
    const hh = String(Math.min(23, Number(m[1]))).padStart(2, '0');
    const mm = String(Math.min(59, Number(m[2]))).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  private addHours(timeHHMM: string, hours: number): string {
    const [h, m] = timeHHMM.split(':').map(Number);
    const d = new Date();
    d.setHours((h + (hours || 0)) % 24, m || 0, 0, 0);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  private composeNotes(email: EmailContent, extras: { owner_address?: string; terminal_number?: string }) {
    const lines: string[] = [];
    lines.push(`Заявка получена по email от ${email.from}`);
    lines.push(`Тема: ${email.subject}`);
    if (extras.terminal_number) lines.push(`Терминал (Inmarsat/Iridium/SSAS): ${extras.terminal_number}`);
    if (extras.owner_address) lines.push(`Адрес судовладельца: ${extras.owner_address}`);
    return lines.join('\n');
  }

  private escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
