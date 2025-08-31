// backend-nest/src/signal/signal.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request';
import { RequestStatus } from '../request/request.service';

// Enums для типов и статусов сигналов
export enum SignalType {
  AIS_TEST = 'AIS_TEST',
  EPIRB_TEST = 'EPIRB_TEST',
  SART_TEST = 'SART_TEST',
  SSAS_TEST = 'SSAS_TEST',
  UNKNOWN = 'UNKNOWN'
}

export enum SignalStatus {
  RECEIVED = 'RECEIVED',
  PARSED = 'PARSED',
  MATCHED = 'MATCHED',
  NO_MATCH = 'NO_MATCH',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR'
}

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private readonly signalModel: typeof Signal,
    @InjectModel(SSASRequest)
    private readonly requestModel: typeof SSASRequest,
  ) {}

  // Существующие методы
  findAll(): Promise<Signal[]> {
    return this.signalModel.findAll();
  }

  async findOne(id: number): Promise<Signal> {
    const row = await this.signalModel.findByPk(id);
    if (!row) throw new NotFoundException(`Signal #${id} not found`);
    return row;
  }

  create(data: Partial<Signal>): Promise<Signal> {
    return this.signalModel.create(data as any);
  }

  async update(id: number, patch: Partial<Signal>): Promise<Signal> {
    await this.signalModel.update(patch as any, { where: { id } });
    return this.findOne(id);
  }

  async updateStatus(id: number, status: string): Promise<Signal> {
    await this.signalModel.update({ status } as any, { where: { id } });
    return this.findOne(id);
  }

  async linkToRequest(id: number, requestId: number): Promise<Signal> {
    await this.signalModel.update({ request_id: requestId } as any, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number): Promise<{ deleted: boolean }> {
    await this.signalModel.destroy({ where: { id } });
    return { deleted: true };
  }

  // НОВЫЕ МЕТОДЫ для обработки email сигналов
  async processEmailSignal(
    subject: string,
    body: string,
    receivedDate: Date,
    emailId: string
  ): Promise<Signal> {
    // 🔍 ДОБАВЛЕНО ЛОГИРОВАНИЕ (после строки 78)
    console.log('Received params:', { subject, body, receivedDate, emailId });
    
    try {
      const fullText = `${subject}\n${body}`;
      
      // Извлекаем MMSI
      const mmsiMatch = fullText.match(/MMSI[:\s]+(\d{9})/i);
      if (!mmsiMatch) {
        throw new Error('MMSI not found in signal');
      }

      // Определяем тип сигнала
      let type = SignalType.UNKNOWN;
      if (/AIS.*TEST/i.test(fullText)) type = SignalType.AIS_TEST;
      else if (/EPIRB.*TEST/i.test(fullText)) type = SignalType.EPIRB_TEST;
      else if (/SART.*TEST/i.test(fullText)) type = SignalType.SART_TEST;
      else if (/SSAS/i.test(fullText)) type = SignalType.SSAS_TEST;

      // Извлекаем название судна
      const vesselMatch = fullText.match(/(?:Vessel|Ship)[:\s]+([^\n\r,]+)/i);
      const vessel_name = vesselMatch ? vesselMatch[1].trim() : null;

      // Извлекаем координаты (если есть) ← ИСПРАВЛЕНО (строка 103)
      const coordsMatch = fullText.match(/Lat[:\s]+([\d.-]+)[\s,°]+Lon[:\s]+([\d.-]+)/i);
      let latitude = null;
      let longitude = null;
      if (coordsMatch) {
        latitude = parseFloat(coordsMatch[1]);
        longitude = parseFloat(coordsMatch[2]);
      }

      // Создаем сигнал ← ИСПРАВЛЕНО (строки 109-119)
      const signal = await this.signalModel.create({
        beacon_hex_id: mmsiMatch[1] || 'UNKNOWN',
        detection_time: receivedDate,
        email_subject: subject,
        email_body: body,
        email_from: 'test@example.com', // временно hardcoded
        email_received_at: receivedDate,
        email_message_id: emailId,
        mmsi: mmsiMatch[1],
        received_at: receivedDate, // ← ДОБАВЛЕНО недостающее поле
        status: SignalStatus.RECEIVED,
        latitude: latitude?.toString(),
        longitude: longitude?.toString(),
        metadata: { signal_type: type.toString(), vessel_name },
      } as any);

      // Пытаемся сопоставить с заявкой
      await this.matchSignalToRequest(signal);

      return signal;
    } catch (error) {
      // Сохраняем ошибочный сигнал для анализа ← ИСПРАВЛЕНО (строки 127-130)
      const errorSignal = await this.signalModel.create({
        beacon_hex_id: 'ERROR',
        detection_time: new Date(),
        email_subject: subject || 'Error',
        email_body: body || error.message,
        email_from: 'error@system',
        email_received_at: receivedDate || new Date(),
        email_message_id: emailId,
        mmsi: 'UNKNOWN',
        received_at: receivedDate || new Date(), // ← ИСПРАВЛЕНО
        status: SignalStatus.ERROR,
        error_message: error.message,
        metadata: { subject, body, error: error.message },
      } as any);
      
      return errorSignal;
    }
  }

  // Сопоставление сигнала с заявкой
  private async matchSignalToRequest(signal: Signal): Promise<void> {
    try {
      // Ищем активную заявку по MMSI и дате ← ИСПРАВЛЕНО
      const request = await this.requestModel.findOne({
		where: {
		  mmsi: signal.mmsi,
		  status: {
			[Op.in]: [RequestStatus.APPROVED, RequestStatus.IN_TESTING]
		  },
		  test_date: {
			[Op.eq]: new Date(signal.received_at).toISOString().split('T')[0]
		  }
		}
      });

      if (request) {
        // Привязываем сигнал к заявке
		signal.request_id = request.request_id;        signal.status = SignalStatus.MATCHED;
        await signal.save();
        
        // Обновляем статус заявки если нужно
        if (request.status === RequestStatus.APPROVED) {
          request.status = RequestStatus.IN_TESTING;
          request.status_updated_at = new Date();
          await request.save();
        }
        
			console.log(`✅ Signal ${signal.id} matched to request ${request.request_id}`);
      } else {
        // Не нашли подходящую заявку
        signal.status = SignalStatus.NO_MATCH;
        await signal.save();
        
        console.warn(`⚠️ No matching request for signal ${signal.id}`);
      }
    } catch (error) {
      console.error('Error matching signal to request:', error);
      signal.status = SignalStatus.ERROR;
      signal.error_message = error.message;
      await signal.save();
    }
  }

  // Получить сигналы для заявки
	async getSignalsByRequestId(requestId: number | string): Promise<Signal[]> {
	  return this.signalModel.findAll({
		where: { request_id: requestId },
		order: [['received_at', 'ASC']],
	  });
	}

  // Статистика по сигналам
async getSignalStatistics(startDate?: Date, endDate?: Date): Promise<any> {
  const where: any = {};
  
  if (startDate && endDate) {
    // Если даты одинаковые, добавляем время до конца дня
    let adjustedEndDate = new Date(endDate);
    if (startDate.toDateString() === endDate.toDateString()) {
      adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
    }
    
    where.received_at = {
      [Op.between]: [startDate, adjustedEndDate]
    };
  }

  const signals = await this.signalModel.findAll({
    where,
    attributes: ['status', 'metadata', 'received_at', 'mmsi']
  });

  // Обрабатываем статистику вручную
  const stats = {
    total: signals.length,
    byStatus: {},
    byType: {},
    dateRange: {
      start: startDate?.toISOString(),
      end: endDate?.toISOString(),
      actualEnd: where.received_at ? where.received_at[Op.between][1].toISOString() : null
    }
  };

  signals.forEach(signal => {
    // Подсчет по статусам
    stats.byStatus[signal.status] = (stats.byStatus[signal.status] || 0) + 1;
    
    // Подсчет по типам из metadata
    const type = signal.metadata?.signal_type || 'UNKNOWN';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  });

  return stats;
}
}