// src/services/enhanced-confirmation.service.ts v.2

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import TestRequest from '../models/test-request.model';
import Vessel from '../models/vessel.model';
import Signal from '../models/signal.model';
import ConfirmationDocument from '../models/confirmation-document.model';
import { EmailService } from './email.service';
import { formatInTimeZone } from 'date-fns-tz';
import { ru } from 'date-fns/locale';

@Injectable()
export class EnhancedConfirmationService {
  private readonly logger = new Logger(EnhancedConfirmationService.name);
  private autoSendEnabled = false; // Глобальная настройка

  constructor(
    @InjectModel(TestRequest)
    private testRequestModel: typeof TestRequest,
    @InjectModel(ConfirmationDocument)
    private confirmationDocModel: typeof ConfirmationDocument,
    @InjectModel(Signal)
    private signalModel: typeof Signal,
    private emailService: EmailService,
  ) {}

  // Установка режима автоматической отправки
  setAutoSendMode(enabled: boolean): void {
    this.autoSendEnabled = enabled;
    this.logger.log(`Автоматическая отправка ${enabled ? 'включена' : 'выключена'}`);
  }

  // Проверка совпадения сигнала с заявкой
  async checkSignalMatch(signalId: number): Promise<any> {
    try {
      const signal = await this.signalModel.findByPk(signalId);
      if (!signal) {
        return { matched: false, reason: 'Сигнал не найден' };
      }

      // Ищем заявку по MMSI или позывному
      const request = await this.testRequestModel.findOne({
        include: [Vessel],
        where: {
          status: 'approved',
          test_date: {
            // Проверяем, что дата теста в пределах ±2 часа от сигнала
            [Op.between]: [
              new Date(signal.detection_time.getTime() - 2 * 60 * 60 * 1000),
              new Date(signal.detection_time.getTime() + 2 * 60 * 60 * 1000),
            ],
          },
        },
      });

      if (!request) {
        return { matched: false, reason: 'Нет подходящей заявки' };
      }

      // Проверяем совпадение идентификаторов
      const vessel = request.vessel;
      if (vessel.mmsi === signal.mmsi || vessel.call_sign === signal.call_sign) {
        this.logger.log(`Найдено совпадение: Сигнал ${signalId} соответствует заявке ${request.id}`);
        
        // Создаем подтверждение
        const confirmation = await this.prepareConfirmation(request.id);
        
        // Если включена автоотправка
        if (this.autoSendEnabled || confirmation.auto_send_enabled) {
          await this.sendConfirmation(confirmation.id, 'AUTO');
          return {
            matched: true,
            request_id: request.id,
            confirmation_id: confirmation.id,
            auto_sent: true,
            message: 'Подтверждение отправлено автоматически',
          };
        } else {
          return {
            matched: true,
            request_id: request.id,
            confirmation_id: confirmation.id,
            auto_sent: false,
            message: 'Подтверждение готово к отправке',
            action_required: 'Требуется ручное подтверждение отправки',
          };
        }
      }

      return { matched: false, reason: 'Идентификаторы не совпадают' };
    } catch (error) {
      this.logger.error('Ошибка при проверке совпадения:', error);
      throw error;
    }
  }

  // Подготовка подтверждения (создание документа без отправки)
  async prepareConfirmation(requestId: number): Promise<ConfirmationDocument> {
    try {
      const request = await this.testRequestModel.findByPk(requestId, {
        include: [Vessel],
      });

      if (!request) {
        throw new Error(`Заявка #${requestId} не найдена`);
      }

      // Генерируем номер документа
      const year = new Date().getFullYear();
      const count = await this.confirmationDocModel.count({
        where: {
          document_number: {
            [Op.like]: `GMSKC-${year}-%`,
          },
        },
      });
      const documentNumber = `GMSKC-${year}-${String(count + 1).padStart(3, '0')}`;

      // Генерируем HTML содержимое
      const htmlContent = this.generateConfirmationHtml(request, documentNumber);

      // Создаем запись в БД
      const confirmation = await this.confirmationDocModel.create({
        test_request_id: requestId,
        document_number: documentNumber,
        html_content: htmlContent,
        recipient_email: request.vessel.owner_email,
        status: 'ready',
        auto_send_enabled: this.autoSendEnabled,
      });

      this.logger.log(`Подтверждение ${documentNumber} подготовлено для заявки #${requestId}`);
      return confirmation;
    } catch (error) {
      this.logger.error('Ошибка при подготовке подтверждения:', error);
      throw error;
    }
  }

  // Отправка подтверждения (ручная или автоматическая)
  async sendConfirmation(confirmationId: number, sentBy: string = 'MANUAL'): Promise<any> {
    try {
      const confirmation = await this.confirmationDocModel.findByPk(confirmationId, {
        include: [{ model: TestRequest, include: [Vessel] }],
      });

      if (!confirmation) {
        throw new Error(`Подтверждение #${confirmationId} не найдено`);
      }

      if (confirmation.status === 'sent') {
        return {
          success: false,
          message: 'Подтверждение уже было отправлено',
          sent_at: confirmation.sent_at,
        };
      }

      // Генерируем PDF если еще нет
      if (!confirmation.pdf_content) {
        confirmation.pdf_content = await this.generatePDF(confirmation.html_content);
      }

      // Отправляем email (пока без вложений, так как EmailService не поддерживает)
      const emailResult = await this.emailService.sendEmail({
        to: confirmation.recipient_email,
        subject: `Подтверждение теста ГМССБ №${confirmation.document_number}`,
        html: confirmation.html_content,
      });

      // Обновляем статус
      confirmation.status = 'sent';
      confirmation.sent_at = new Date();
      confirmation.sent_by = sentBy;
      await confirmation.save();

      // Обновляем статус заявки
      const request = confirmation.testRequest;
      request.confirmation_sent = true;
      request.confirmation_sent_at = new Date();
      await request.save();

      this.logger.log(`Подтверждение ${confirmation.document_number} отправлено (${sentBy})`);

      return {
        success: true,
        message: `Подтверждение отправлено на ${confirmation.recipient_email}`,
        document_number: confirmation.document_number,
        sent_by: sentBy,
        sent_at: confirmation.sent_at,
      };
    } catch (error) {
      this.logger.error('Ошибка при отправке подтверждения:', error);
      throw error;
    }
  }

  // Генерация PDF из HTML (упрощенная версия)
  async generatePDF(htmlContent: string): Promise<Buffer> {
    // Временное решение - возвращаем пустой буфер
    // TODO: Реализовать полноценную генерацию PDF
    return Buffer.from('PDF content placeholder');
  }

  // Получение списка подтверждений с фильтрами
  async getConfirmations(filters: {
    id?: number;
    status?: string;
    date_from?: Date;
    date_to?: Date;
    auto_send?: boolean;
  }) {
    const where: any = {};
    
    if (filters.id) where.id = filters.id;
    if (filters.status) where.status = filters.status;
    if (filters.auto_send !== undefined) where.auto_send_enabled = filters.auto_send;
    if (filters.date_from || filters.date_to) {
      where.created_at = {};
      if (filters.date_from) where.created_at[Op.gte] = filters.date_from;
      if (filters.date_to) where.created_at[Op.lte] = filters.date_to;
    }

    return await this.confirmationDocModel.findAll({
      where,
      include: [{ model: TestRequest, include: [Vessel] }],
      order: [['created_at', 'DESC']],
    });
  }

  // Скачивание PDF
  async downloadPDF(confirmationId: number): Promise<{ buffer: Buffer; filename: string }> {
    const confirmation = await this.confirmationDocModel.findByPk(confirmationId);
    
    if (!confirmation) {
      throw new Error('Подтверждение не найдено');
    }

    if (!confirmation.pdf_content) {
      confirmation.pdf_content = await this.generatePDF(confirmation.html_content);
      await confirmation.save();
    }

    return {
      buffer: confirmation.pdf_content,
      filename: `${confirmation.document_number}.pdf`,
    };
  }

  private generateConfirmationHtml(request: TestRequest, documentNumber: string): string {
    const vessel = request.vessel;
    const testDateTime = formatInTimeZone(
      request.test_date,
      'Europe/Moscow',
      'dd MMMM yyyy года в HH:mm',
      { locale: ru }
    );

    const latitude = vessel.latitude || 0;
    const longitude = vessel.longitude || 0;
    const latDirection = latitude >= 0 ? 'N' : 'S';
    const lonDirection = longitude >= 0 ? 'E' : 'W';
    const coordinates = `${Math.abs(latitude).toFixed(4)}°${latDirection}, ${Math.abs(longitude).toFixed(4)}°${lonDirection}`;

    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .header { background: #667eea; color: white; padding: 20px; text-align: center; }
        .document-number { position: absolute; top: 10px; right: 10px; font-weight: bold; }
        .content { padding: 20px; }
        .signature { margin-top: 50px; }
        .footer { text-align: center; margin-top: 30px; color: #666; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        .label { font-weight: bold; width: 200px; }
    </style>
</head>
<body>
    <div class="document-number">№ ${documentNumber}</div>
    <div class="header">
        <h1>ГМСКЦ России</h1>
        <h2>Подтверждение проведения теста ГМССБ</h2>
    </div>
    <div class="content">
        <p>Настоящим подтверждаем проведение теста оборудования ГМССБ:</p>
        
        <table>
            <tr><td class="label">Судно:</td><td>${vessel.name}</td></tr>
            <tr><td class="label">IMO:</td><td>${vessel.imo_number}</td></tr>
            <tr><td class="label">Позывной:</td><td>${vessel.call_sign}</td></tr>
            <tr><td class="label">MMSI:</td><td>${vessel.mmsi}</td></tr>
            <tr><td class="label">Координаты:</td><td>${coordinates}</td></tr>
            <tr><td class="label">Дата и время теста:</td><td>${testDateTime} МСК</td></tr>
            <tr><td class="label">Тип теста:</td><td>${request.test_type}</td></tr>
        </table>
        
        <div class="signature">
            <p>Документ сформирован автоматически системой ГМСКЦ</p>
            <p>Дата формирования: ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
    </div>
    <div class="footer">
        <p>© ${new Date().getFullYear()} ГМСКЦ России</p>
    </div>
</body>
</html>
    `;
  }
}