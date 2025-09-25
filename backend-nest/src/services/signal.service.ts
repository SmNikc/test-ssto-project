// backend-nest/src/services/signal.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import { ReportService } from './report.service';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
    private reportService: ReportService,
  ) {}

  async getAll(filters?: {
    status?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.signal_type = filters.type;
    }

    if (filters?.startDate || filters?.endDate) {
      where.received_at = {};
      if (filters.startDate) {
        where.received_at[Op.gte] = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.received_at[Op.lte] = new Date(filters.endDate);
      }
    }

    return await this.signalModel.findAll({
      where,
      order: [['received_at', 'DESC']],
    });
  }

  async getStatistics(startDate?: string, endDate?: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Для общей статистики используем переданные даты или берем за текущий месяц
    const start = startDate ? new Date(startDate) : startOfMonth;
    const end = endDate ? new Date(endDate) : now;

    // Получаем все сигналы за период
    const signals = await this.signalModel.findAll({
      where: {
        received_at: {
          [Op.between]: [start, end]
        }
      }
    });

    // Получаем сигналы за сегодня
    const todaySignals = await this.signalModel.findAll({
      where: {
        received_at: {
          [Op.gte]: startOfDay
        }
      }
    });

    // Получаем сигналы за текущий месяц
    const monthSignals = await this.signalModel.findAll({
      where: {
        received_at: {
          [Op.gte]: startOfMonth
        }
      }
    });

    // Получаем последние 5 сигналов
    const recentSignals = await this.signalModel.findAll({
      order: [['received_at', 'DESC']],
      limit: 5,
    });

    return {
      total: signals.length,
      today: todaySignals.length,
      thisMonth: monthSignals.length,
      byType: {
        TEST: signals.filter(s => s.signal_type === 'TEST').length,
        DISTRESS: signals.filter(s => s.signal_type === 'DISTRESS').length,
        REAL_ALERT: signals.filter(s => s.signal_type === 'REAL_ALERT').length,
        SSAS_TEST: signals.filter(s => s.signal_type === 'SSAS_TEST').length,
      },
      byStatus: {
        active: signals.filter(s => s.status === 'active').length,
        completed: signals.filter(s => s.status === 'completed').length,
        pending: signals.filter(s => s.status === 'pending').length,
      },
      recentSignals: recentSignals.map(s => ({
        id: s.id,
        terminal_number: s.terminal_number,
        signal_type: s.signal_type,
        vessel_name: s.vessel_name,
        mmsi: s.mmsi,
        status: s.status,
        received_at: s.received_at,
      })),
    };
  }

  async findById(id: number) {
    return await this.signalModel.findByPk(id);
  }

  async create(signalData: any) {
    const signal = await this.signalModel.create({
      ...signalData,
      received_at: new Date(),
      status: signalData.status || 'active',
    });

    // Если это тестовый сигнал, попробуем связать с заявкой
    if (signalData.is_test && signalData.mmsi) {
      const request = await this.requestModel.findOne({
        where: {
          mmsi: signalData.mmsi,
          status: 'approved',
        },
      });

      if (request) {
        await signal.update({ request_id: request.id });
      }
    }

    return signal;
  }

  async update(id: number, updateData: any) {
    const signal = await this.signalModel.findByPk(id);
    if (!signal) {
      return null;
    }

    await signal.update(updateData);
    return signal;
  }

  async delete(id: number) {
    const signal = await this.signalModel.findByPk(id);
    if (!signal) {
      return null;
    }

    await signal.destroy();
    return true;
  }

  async linkToRequest(signalId: number, requestId: number) {
    const signal = await this.signalModel.findByPk(signalId);
    const request = await this.requestModel.findByPk(requestId);

    if (!signal || !request) {
      throw new Error('Signal or request not found');
    }

    await signal.update({ request_id: requestId });
    return signal;
  }

  async generateReport(signalId: number) {
    const signal = await this.signalModel.findByPk(signalId, {
      include: [SSASRequest],
    });

    if (!signal) {
      throw new Error('Signal not found');
    }

    return await this.reportService.generateForSignal(signal);
  }

  // Метод для обработки входящих сигналов от внешних систем
  async processIncomingSignal(rawData: any) {
    // Нормализация данных
    const normalizedData = this.normalizeSignalData(rawData);
    
    // Создание сигнала
    const signal = await this.create(normalizedData);
    
    // Отправка уведомлений
    // TODO: интеграция с EmailService
    
    return signal;
  }

  private normalizeSignalData(rawData: any) {
    return {
      terminal_number: rawData.terminal_number || rawData.terminalNumber,
      signal_type: rawData.signal_type || rawData.type || 'UNKNOWN',
      vessel_name: rawData.vessel_name || rawData.vesselName,
      mmsi: rawData.mmsi || rawData.MMSI,
      imo: rawData.imo || rawData.IMO,
      coordinates: rawData.coordinates || {
        lat: rawData.latitude || rawData.lat,
        lng: rawData.longitude || rawData.lng || rawData.lon,
      },
      is_test: rawData.is_test || rawData.isTest || false,
      metadata: rawData.metadata || {},
    };
  }
}