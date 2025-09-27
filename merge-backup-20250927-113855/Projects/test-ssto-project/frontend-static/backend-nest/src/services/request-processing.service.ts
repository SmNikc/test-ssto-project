import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';

import { EmailService } from './email.service';
import SSASRequest from '../models/request.model';
import SSASTerminal from '../models/ssas-terminal.model';

type ParsedEmailRequest = {
  terminal?: string;           // номер стойки ССТО (Inmarsat/Iridium)
  terminal_number?: string;    // синоним
  ssas?: string;               // синоним
  vessel?: string;
  mmsi?: string;
  imo?: string;
  requesterEmail?: string;
  requesterName?: string;
  phone?: string;
  company?: string;
  testDate?: string | Date;    // дата теста из письма (если была)
  testType?: string;           // 'combined' | 'routine' | ...
};

type ParsedSignal = {
  terminal_number?: string;    // номер стойки из сигнала
  terminal?: string;           // синоним
  ssas_number?: string;        // синоним
  mmsi?: string;
  received_at?: string | Date;
};

@Injectable()
export class RequestProcessingService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly requestModel: typeof SSASRequest,

    @InjectModel(SSASTerminal)
    private readonly terminalModel: typeof SSASTerminal,

    private readonly emailService: EmailService,
  ) {}

  /**
   * Периодический опрос входящих писем (каждые 5 минут)
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processIncomingEmails() {
    try {
      const emailData = await this.emailService.checkIncomingEmails();

      // Обработка неформализованных заявок
      if (emailData?.requests?.length) {
        for (const req of emailData.requests) {
          await this.processEmailRequest(req);
        }
      }

      // Обработка сигналов
      if (emailData?.signals?.length) {
        for (const sig of emailData.signals) {
          await this.matchSignalToRequest(sig);
        }
      }

      // Нераспознанные для логов
      if (emailData?.unrecognized?.length) {
        for (const u of emailData.unrecognized) {
          // намеренно только логируем, чтобы не мешать основному потоку
          // console.log(`[unrecognized] ${u.subject} from ${u.from}`);
        }
      }
    } catch (error) {
      console.error('[processIncomingEmails] error:', error);
    }
  }

  /**
   * Обработка одной email-заявки (неформализованной)
   * ожидается структура: { parsedData, emailSubject, emailFrom, emailDate, rawMessage }
   */
  private async processEmailRequest(emailRequest: any) {
    const data: ParsedEmailRequest = emailRequest?.parsedData ?? {};

    // Номер стойки (основной идентификатор) → кладём в requests.ssas_number
    const ssas_number =
      data.terminal ??
      data.terminal_number ??
      data.ssas ??
      null;

    // Проверка дубликата по номеру стойки и «свежести» заявки (за сутки)
    if (ssas_number) {
      const duplicate = await this.requestModel.findOne({
        where: {
          ssas_number,
          status: { [Op.in]: ['pending', 'in_testing'] },
          test_date: { [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        order: [['created_at', 'DESC']],
      });
      if (duplicate) {
        // уже есть активная/ожидающая заявка по этой стойке — не плодим дубликаты
        return duplicate;
      }
    }

    // Безопасные значения по умолчанию для NOT NULL полей
    const contact_email = data.requesterEmail || 'unknown@example.com';
    const contact_person = data.requesterName || 'Не указан';
    const contact_phone = data.phone || '+7 (000) 000-00-00';

    // Дата теста (если не извлекли из письма) — сегодня
    const test_date = data.testDate ? new Date(data.testDate) : new Date();

    // Время теста — если нет в письме, 10:00–14:00 (как у вас в примерах)
    const start_time = '10:00';
    const end_time = '14:00';

    // Тип теста (совместим с вашей моделью)
    const test_type = (data.testType || 'routine').toString();

    // Хозяйская организация (если пришла)
    const owner_organization = data.company || null;

    // Примечание — фиксируем контекст письма (не даёт ошибок даже при большой длине)
    const notesChunks: string[] = [];
    if (emailRequest?.emailSubject) notesChunks.push(`Subject: ${emailRequest.emailSubject}`);
    if (emailRequest?.emailFrom) notesChunks.push(`From: ${emailRequest.emailFrom}`);
    if (emailRequest?.emailDate) notesChunks.push(`Received: ${new Date(emailRequest.emailDate).toISOString()}`);
    if (emailRequest?.rawMessage) {
      const raw = String(emailRequest.rawMessage);
      // не раздуваем запись: сохраняем начало письма
      notesChunks.push(`Raw(512): ${raw.slice(0, 512)}`);
    }
    const notes = notesChunks.join('\n');

    // Создание заявки — строго в поля, существующие в вашей модели
    const created = await this.requestModel.create({
      ssas_number,
      vessel_name: data.vessel || 'Неизвестно',
      mmsi: data.mmsi || null,
      imo_number: data.imo || null,

      owner_organization,
      contact_person,
      contact_phone,
      contact_email,

      test_date,
      start_time,
      end_time,

      test_type,
      status: 'pending',
      notes,
    } as any);

    // Дополнительно поддержим справочник терминалов (если такой моделью управляете вы)
    if (ssas_number) {
      await this.ensureTerminalExists({
        terminal_number: ssas_number,
        mmsi: data.mmsi,
        vessel_name: data.vessel,
        imo_number: data.imo,
      });
    }

    // Письмо-подтверждение заявителю (если email валиден)
    await this.sendRequestConfirmation(created, {
      terminal: ssas_number,
      vessel: data.vessel,
      mmsi: data.mmsi,
      imo: data.imo,
      phone: contact_phone,
      company: owner_organization ?? '—',
      requesterEmail: contact_email,
      requesterName: contact_person,
      testDate: test_date,
    });

    return created;
  }

  /**
   * Создание/актуализация записи терминала (мягкая типизация, чтобы не падать по несовпадению атрибутов)
   */
  private async ensureTerminalExists(payload: {
    terminal_number?: string;
    mmsi?: string;
    vessel_name?: string;
    imo_number?: string;
  }) {
    if (!payload.terminal_number) return;

    // пытаемся найти по terminal_number
    const existing = await this.terminalModel.findOne({
      where: { terminal_number: payload.terminal_number } as any,
    });

    if (!existing) {
      await this.terminalModel.create(
        {
          terminal_number: payload.terminal_number,
          mmsi: payload.mmsi ?? null,
          vessel_name: payload.vessel_name ?? null,
          imo_number: payload.imo_number ?? null,
          status: 'active',
        } as any,
      );
      return;
    }

    // Обновим, если появились/изменились данные
    const patch: any = {};
    if (payload.mmsi && existing['mmsi'] !== payload.mmsi) patch.mmsi = payload.mmsi;
    if (payload.vessel_name && existing['vessel_name'] !== payload.vessel_name) patch.vessel_name = payload.vessel_name;
    if (payload.imo_number && existing['imo_number'] !== payload.imo_number) patch.imo_number = payload.imo_number;
    if (Object.keys(patch).length) {
      await (existing as any).update(patch);
    }
  }

  /**
   * Сопоставление входящего сигнала с активной заявкой
   */
  private async matchSignalToRequest(signal: ParsedSignal) {
    const terminal =
      signal.terminal_number ??
      signal.terminal ??
      signal.ssas_number ??
      null;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    let request: SSASRequest | null = null;

    if (terminal) {
      request = await this.requestModel.findOne({
        where: {
          ssas_number: terminal,
          status: { [Op.in]: ['pending', 'in_testing'] },
          test_date: { [Op.gte]: since },
        },
        order: [['created_at', 'DESC']],
      });
    }

    if (!request && signal.mmsi) {
      request = await this.requestModel.findOne({
        where: {
          mmsi: signal.mmsi,
          status: { [Op.in]: ['pending', 'in_testing'] },
          test_date: { [Op.gte]: since },
        },
        order: [['created_at', 'DESC']],
      });
    }

    if (request) {
      // фиксируем факт сигнала
      await request.update({
        status: 'in_testing', // соответствует вашей карте статусов
        signal_received_time: new Date(signal.received_at ?? Date.now()).toISOString(),
      } as any);
    }

    return request;
  }

  /**
   * Отправка подтверждения по email заявителю
   */
  private async sendRequestConfirmation(
    request: SSASRequest,
    parsed: {
      terminal?: string | null;
      vessel?: string | null;
      mmsi?: string | null;
      imo?: string | null;
      phone?: string | null;
      company?: string | null;
      requesterEmail?: string;
      requesterName?: string;
      testDate?: string | Date | null;
    },
  ) {
    const missing: string[] = [];
    if (!parsed.terminal) missing.push('номер стойки ССТО');
    if (!parsed.mmsi) missing.push('MMSI');
    if (!parsed.vessel) missing.push('название судна');
    if (!parsed.testDate) missing.push('дата теста');

    const displayNumber =
      // если у вас есть вычисляемая/реальная колонка request_number — покажем её
      (request as any).request_number ??
      (typeof (request as any).getDataValue === 'function' ? (request as any).getDataValue('request_number') : undefined) ??
      request.id;

    const html = `
      <h2>Заявка на тестирование ССТО получена</h2>
      <p>Уважаемый(ая) ${parsed.requesterName || 'заявитель'},</p>
      <p>Ваша заявка <strong>#${displayNumber}</strong> зарегистрирована в системе.</p>

      <div style="background:#f0f8ff;padding:12px;border-radius:6px;margin:12px 0;">
        <p><strong>Номер стойки:</strong> ${parsed.terminal || '—'}</p>
        <p><strong>Судно:</strong> ${parsed.vessel || '—'}</p>
        <p><strong>MMSI:</strong> ${parsed.mmsi || '—'}</p>
        <p><strong>IMO:</strong> ${parsed.imo || '—'}</p>
        <p><strong>Дата теста:</strong> ${
          parsed.testDate ? new Date(parsed.testDate).toLocaleDateString('ru-RU') : '—'
        }</p>
        <p><strong>Телефон:</strong> ${parsed.phone || '—'}</p>
        <p><strong>Организация:</strong> ${parsed.company || '—'}</p>
      </div>

      ${
        missing.length
          ? `<div style="background:#fff3cd;padding:12px;border-radius:6px;margin:12px 0;">
               <p><strong>Требуется уточнить:</strong></p>
               <ul>${missing.map((m) => `<li>${m}</li>`).join('')}</ul>
               <p>Ответьте на это письмо недостающей информацией или отредактируйте заявку в модуле TEST SSTO.</p>
             </div>`
          : ''
      }

      <p>С уважением,<br/>ГМСКЦ (модуль TEST SSTO)</p>
    `;

    const to = parsed.requesterEmail || (request as any).contact_email || null;
    if (to) {
      await this.emailService.sendEmail({
        to,
        subject: `Заявка #${displayNumber} на тестирование ССТО получена`,
        html,
      });
    }
  }
}
