// backend-nest/src/signal/signal.service.ts
// ИСПРАВЛЕННАЯ ВЕРСИЯ 3.0 - с учетом реальных моделей
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request';
import { EmailSenderService } from '../services/email-sender.service';
import { ReportService } from '../services/report.service';

// Определяем enum локально, если его нет в модели
enum SignalStatus {
  PENDING = 'pending',
  MATCHED = 'matched',
  UNMATCHED = 'unmatched',
  ERROR = 'error'
}

@Injectable()
export class SignalService {
  private readonly logger = new Logger(SignalService.name);

  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
    private emailSenderService: EmailSenderService,
    private reportService: ReportService,
  ) {}

  // ===================================
  // ОСНОВНЫЕ CRUD МЕТОДЫ
  // ===================================

  // Получить все сигналы
  async findAll(): Promise<Signal[]> {
    try {
      return await this.signalModel.findAll({
        include: [{ model: SSASRequest, as: 'request' }],
        order: [['received_at', 'DESC']],
      });
    } catch (error) {
      this.logger.error(`Error finding all signals: ${error.message}`);
      return [];
    }
  }

  // Получить сигнал по ID
  async findOne(id: number): Promise<Signal | null> {
    try {
      return await this.signalModel.findByPk(id, {
        include: [{ model: SSASRequest, as: 'request' }],
      });
    } catch (error) {
      this.logger.error(`Error finding signal ${id}: ${error.message}`);
      return null;
    }
  }

  // Создать новый сигнал
  async create(data: any): Promise<Signal> {
    this.logger.log(`Creating new signal for MMSI: ${data.mmsi}`);
    
    try {
      const signal = await this.signalModel.create({
        mmsi: data.mmsi || 'UNKNOWN',
        type: data.signal_type || data.type || 'TEST',  // Используем поле type
        latitude: data.latitude,
        longitude: data.longitude,
        received_at: data.received_at || new Date(),
        raw_data: data.raw_message || data.raw_data || '',  // Используем raw_data
        email_id: data.message_id || data.email_id,  // Используем email_id
        status: data.status || SignalStatus.PENDING,
        request_id: data.request_id
      });

      // Пытаемся автоматически сопоставить с заявкой
      if (data.mmsi && data.mmsi !== 'UNKNOWN') {
        await this.matchSignalToRequest(signal);
      }

      return signal;
    } catch (error) {
      this.logger.error(`Error creating signal: ${error.message}`);
      throw error;
    }
  }

  // Обновить сигнал
  async update(id: number, data: Partial<Signal>): Promise<Signal | null> {
    try {
      const signal = await this.findOne(id);
      if (!signal) {
        this.logger.warn(`Signal with ID ${id} not found`);
        return null;
      }
      
      await signal.update(data);
      return signal;
    } catch (error) {
      this.logger.error(`Error updating signal ${id}: ${error.message}`);
      return null;
    }
  }

  // Удалить сигнал
  async remove(id: number): Promise<boolean> {
    try {
      const signal = await this.findOne(id);
      if (!signal) {
        this.logger.warn(`Signal with ID ${id} not found`);
        return false;
      }
      
      await signal.destroy();
      return true;
    } catch (error) {
      this.logger.error(`Error removing signal ${id}: ${error.message}`);
      return false;
    }
  }

  // ===================================
  // МЕТОДЫ СОПОСТАВЛЕНИЯ
  // ===================================

  // Сопоставить сигнал с заявкой
  async matchSignalToRequest(signal: Signal): Promise<void> {
    try {
      this.logger.log(`🔍 Matching signal to request for MMSI: ${signal.mmsi}`);
      
      // Ищем заявку с таким же MMSI в временном окне
      const request = await this.requestModel.findOne({
        where: {
          mmsi: signal.mmsi,
          status: ['approved', 'testing'],
          test_date: {
            [Op.between]: [
              new Date(signal.received_at.getTime() - 24 * 60 * 60 * 1000), // -24 часа
              new Date(signal.received_at.getTime() + 24 * 60 * 60 * 1000), // +24 часа
            ],
          },
        },
      });

      if (request) {
        // ИСПРАВЛЕНО: Правильное связывание сигнала с заявкой
        signal.request_id = request.id.toString();  // Преобразуем number в string
        signal.status = SignalStatus.MATCHED;       // Устанавливаем статус
        await signal.save();

        // Обновляем статус заявки
        request.signal_id = signal.id;
        request.status = 'completed';
        await request.save();

        this.logger.log(`✅ Signal ${signal.id} matched to request ${request.id}`);
        
        // Отправляем подтверждение
        await this.sendConfirmation(request, signal);
      } else {
        this.logger.log(`❌ No matching request found for MMSI: ${signal.mmsi}`);
        signal.status = SignalStatus.UNMATCHED;
        await signal.save();
      }
    } catch (error) {
      this.logger.error(`Error matching signal to request: ${error.message}`);
      signal.status = SignalStatus.ERROR;
      await signal.save();
    }
  }

  // Ручное связывание сигнала с заявкой
  async linkToRequest(signalId: number, requestId: number): Promise<Signal | null> {
    try {
      const signal = await this.findOne(signalId);
      if (!signal) {
        this.logger.error(`Signal with ID ${signalId} not found`);
        return null;
      }

      const request = await this.requestModel.findByPk(requestId);
      if (!request) {
        this.logger.error(`Request with ID ${requestId} not found`);
        return null;
      }

      // Связываем
      signal.request_id = requestId.toString();  // Преобразуем number в string
      signal.status = SignalStatus.MATCHED;
      await signal.save();

      // Обновляем заявку
      request.signal_id = signalId;
      request.status = 'completed';
      await request.save();

      this.logger.log(`✅ Manually linked signal ${signalId} to request ${requestId}`);
      
      // Отправляем подтверждение
      await this.sendConfirmation(request, signal);

      return signal;
    } catch (error) {
      this.logger.error(`Error linking signal to request: ${error.message}`);
      return null;
    }
  }

  // ===================================
  // МЕТОДЫ ОТПРАВКИ ПОДТВЕРЖДЕНИЙ
  // ===================================

  // Отправить подтверждение
  private async sendConfirmation(request: SSASRequest, signal: Signal): Promise<void> {
    try {
      this.logger.log(`📧 Sending confirmation for request ${request.id}`);
      
      // ИСПРАВЛЕНО: Используем правильное имя метода
      // Генерируем PDF - используем generateTestConfirmation вместо generateConfirmationPdf
      const pdfPath = await this.reportService.generateTestConfirmation(request, signal);
      this.logger.log(`📄 PDF generated: ${pdfPath}`);
      
      // Отправляем email с PDF
      await this.emailSenderService.sendConfirmation(
        request.contact_email,
        pdfPath,
        request
      );
      
      this.logger.log(`✅ Confirmation sent to ${request.contact_email}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation: ${error.message}`);
      // Не прерываем процесс, но логируем ошибку
    }
  }

  // ===================================
  // МЕТОДЫ ОБРАБОТКИ EMAIL
  // ===================================

  // Обработать сигнал из email
  async processEmailSignal(
    subject: string,
    body: string,
    receivedAt: Date,
    messageId: string
  ): Promise<Signal> {
    this.logger.log(`Processing email signal: ${subject}`);

    try {
      // Извлекаем данные из письма
      const mmsi = this.extractMMSI(body);
      const coordinates = this.extractCoordinates(body);
      const signalType = this.determineSignalType(subject, body);

      // Создаем сигнал с правильными полями
      const signal = await this.signalModel.create({
        mmsi: mmsi || 'UNKNOWN',
        type: signalType,  // Используем type вместо signal_type
        latitude: coordinates?.lat,
        longitude: coordinates?.lon,
        received_at: receivedAt,
        raw_data: body,  // Используем raw_data вместо raw_message
        email_id: messageId,  // Используем email_id вместо message_id
        status: SignalStatus.PENDING,
      });

      // Пытаемся сопоставить с заявкой
      if (mmsi && mmsi !== 'UNKNOWN') {
        await this.matchSignalToRequest(signal);
      }

      return signal;
    } catch (error) {
      this.logger.error(`Error processing email signal: ${error.message}`);
      throw error;
    }
  }

  // Извлечь MMSI из текста
  private extractMMSI(text: string): string | null {
    if (!text) return null;
    const match = text.match(/MMSI[:\s]+(\d{9})/i);
    return match ? match[1] : null;
  }

  // Извлечь координаты из текста
  private extractCoordinates(text: string): { lat: number; lon: number } | null {
    if (!text) return null;
    
    const latMatch = text.match(/(\d+)°(\d+\.?\d*)['']([NS])/);
    const lonMatch = text.match(/(\d+)°(\d+\.?\d*)['']([EW])/);
    
    if (latMatch && lonMatch) {
      const latDeg = parseFloat(latMatch[1]);
      const latMin = parseFloat(latMatch[2]);
      const lat = latDeg + latMin / 60;
      const latitude = latMatch[3] === 'S' ? -lat : lat;

      const lonDeg = parseFloat(lonMatch[1]);
      const lonMin = parseFloat(lonMatch[2]);
      const lon = lonDeg + lonMin / 60;
      const longitude = lonMatch[3] === 'W' ? -lon : lon;

      return { lat: latitude, lon: longitude };
    }
    
    return null;
  }

  // Определить тип сигнала
  private determineSignalType(subject: string, body: string): string {
    const text = (subject + ' ' + body).toLowerCase();
    
    if (text.includes('test')) return 'TEST';
    if (text.includes('distress')) return 'DISTRESS';
    if (text.includes('alert')) return 'ALERT';
    
    return 'UNKNOWN';
  }

  // ===================================
  // МЕТОДЫ ПОИСКА И ФИЛЬТРАЦИИ
  // ===================================

  // Получить сигналы по MMSI
  async findByMMSI(mmsi: string): Promise<Signal[]> {
    try {
      return await this.signalModel.findAll({
        where: { mmsi },
        include: [{ model: SSASRequest, as: 'request' }],
        order: [['received_at', 'DESC']],
      });
    } catch (error) {
      this.logger.error(`Error finding signals by MMSI ${mmsi}: ${error.message}`);
      return [];
    }
  }

  // Получить непривязанные сигналы
  async findUnmatched(): Promise<Signal[]> {
    try {
      return await this.signalModel.findAll({
        where: {
          status: SignalStatus.UNMATCHED,
          request_id: null,
        },
        order: [['received_at', 'DESC']],
      });
    } catch (error) {
      this.logger.error(`Error finding unmatched signals: ${error.message}`);
      return [];
    }
  }

  // ===================================
  // МЕТОДЫ СТАТИСТИКИ
  // ===================================

  // Получить статистику сигналов
  async getStatistics(): Promise<any> {
    try {
      const total = await this.signalModel.count();
      const matched = await this.signalModel.count({
        where: { status: SignalStatus.MATCHED },
      });
      const unmatched = await this.signalModel.count({
        where: { status: SignalStatus.UNMATCHED },
      });
      const pending = await this.signalModel.count({
        where: { status: SignalStatus.PENDING },
      });
      const errors = await this.signalModel.count({
        where: { status: SignalStatus.ERROR },
      });

      return {
        total,
        matched,
        unmatched,
        pending,
        errors,
        matchRate: total > 0 ? ((matched / total) * 100).toFixed(2) + '%' : '0%',
      };
    } catch (error) {
      this.logger.error(`Error getting statistics: ${error.message}`);
      return {
        total: 0,
        matched: 0,
        unmatched: 0,
        pending: 0,
        errors: 0,
        matchRate: '0%',
      };
    }
  }

  // ===================================
  // СЛУЖЕБНЫЕ МЕТОДЫ
  // ===================================

  // Очистить старые сигналы
  async cleanupOldSignals(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await this.signalModel.destroy({
        where: {
          received_at: {
            [Op.lt]: cutoffDate,
          },
          status: [SignalStatus.MATCHED, SignalStatus.UNMATCHED],
        },
      });

      this.logger.log(`🧹 Cleaned up ${result} old signals`);
      return result;
    } catch (error) {
      this.logger.error(`Error cleaning up old signals: ${error.message}`);
      return 0;
    }
  }
}