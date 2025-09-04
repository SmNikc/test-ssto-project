import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EmailService } from './email.service';
import SSASRequest from '../models/request.model';
import SSASTerminal from '../models/ssas-terminal.model';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class RequestProcessingService {
  constructor(
    @InjectModel(SSASRequest) private requestModel: typeof SSASRequest,
    @InjectModel(SSASTerminal) private terminalModel: typeof SSASTerminal,
    private emailService: EmailService
  ) {}

  /**
   * Автоматическая проверка email каждые 5 минут
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async processIncomingEmails() {
    console.log('Проверка входящих email...');
    
    try {
      const emailData = await this.emailService.checkIncomingEmails();
      
      // Обработка заявок
      if (emailData.requests && emailData.requests.length > 0) {
        console.log(`Найдено заявок: ${emailData.requests.length}`);
        
        for (const requestEmail of emailData.requests) {
          await this.processEmailRequest(requestEmail);
        }
      }
      
      // Обработка сигналов
      if (emailData.signals && emailData.signals.length > 0) {
        console.log(`Найдено сигналов: ${emailData.signals.length}`);
        
        for (const signal of emailData.signals) {
          await this.matchSignalToRequest(signal);
        }
      }
      
      // Логирование нераспознанных
      if (emailData.unrecognized && emailData.unrecognized.length > 0) {
        console.log(`Нераспознанных писем: ${emailData.unrecognized.length}`);
        for (const unrec of emailData.unrecognized) {
          console.log(`  - ${unrec.subject} от ${unrec.from}`);
        }
      }
      
    } catch (error) {
      console.error('Ошибка при обработке email:', error);
    }
  }

  /**
   * Обработка заявки из email
   */
  private async processEmailRequest(emailRequest: any) {
    const data = emailRequest.parsedData;
    
    try {
      // Проверяем, есть ли уже заявка с таким терминалом
      let existingRequest = null;
      if (data.terminal) {
        existingRequest = await this.requestModel.findOne({
          where: {
            terminalId: data.terminal,
            status: ['pending', 'in_progress']
          }
        });
      }
      
      if (existingRequest) {
        console.log(`Заявка для терминала ${data.terminal} уже существует`);
        return existingRequest;
      }
      
      // Создаем новую заявку
      const newRequest = await this.requestModel.create({
        // Основные поля
        terminalId: data.terminal || null,
        vesselName: data.vessel || 'Не указано',
        mmsi: data.mmsi || null,
        imo: data.imo || null,
        
        // Контактные данные
        requesterEmail: data.requesterEmail,
        requesterName: data.requesterName || 'Не указано',
        requesterPhone: data.phone || null,
        requesterCompany: data.company || null,
        
        // Данные теста
        testDate: data.testDate || new Date(),
        testType: data.testType || 'combined',
        
        // Метаданные
        status: 'pending',
        source: 'email',  // ВАЖНО: помечаем источник
        emailSubject: emailRequest.emailSubject,
        emailFrom: emailRequest.emailFrom,
        emailReceivedAt: emailRequest.emailDate,
        rawEmailContent: emailRequest.rawMessage,
        
        // Флаг неформализованной заявки
        isInformalRequest: true,
        
        // Отметка о неполных данных
        hasIncompleteData: this.checkIncompleteData(data)
      });
      
      console.log(`Создана заявка #${newRequest.id} из email`);
      
      // Отправляем подтверждение
      await this.sendRequestConfirmation(newRequest, data);
      
      // Если есть терминал, проверяем/создаем его в справочнике
      if (data.terminal) {
        await this.ensureTerminalExists(data);
      }
      
      return newRequest;
      
    } catch (error) {
      console.error('Ошибка создания заявки:', error);
      throw error;
    }
  }

  /**
   * Проверка на неполные данные
   */
  private checkIncompleteData(data: any): boolean {
    const requiredFields = ['terminal', 'mmsi', 'vessel', 'testDate'];
    const missingFields = requiredFields.filter(field => !data[field]);
    return missingFields.length > 0;
  }

  /**
   * Создание/обновление терминала в справочнике
   */
  private async ensureTerminalExists(data: any) {
    if (!data.terminal) return;
    
    let terminal = await this.terminalModel.findByPk(data.terminal);
    
    if (!terminal) {
      // Создаем новый терминал
      terminal = await this.terminalModel.create({
        terminalId: data.terminal,
        terminalType: data.terminalType || 'INMARSAT',
        mmsi: data.mmsi || 'UNKNOWN',
        vesselName: data.vessel || 'UNKNOWN',
        imo: data.imo || null,
        status: 'active'
      });
      console.log(`Создан новый терминал ${data.terminal}`);
    } else if (data.mmsi && terminal.mmsi !== data.mmsi) {
      // Проверяем возможное перемещение стойки
      console.log(`Обнаружено несоответствие MMSI для терминала ${data.terminal}`);
      
      await terminal.update({
        previousMmsi: terminal.mmsi,
        previousVessel: terminal.vesselName,
        mmsi: data.mmsi,
        vesselName: data.vessel || terminal.vesselName,
        lastTransferDate: new Date()
      });
    }
  }

  /**
   * Сопоставление сигнала с заявкой
   */
  private async matchSignalToRequest(signal: any) {
    // Ищем заявку по номеру терминала (приоритет)
    let request = null;
    
    if (signal.terminalId) {
      request = await this.requestModel.findOne({
        where: {
          terminalId: signal.terminalId,
          status: ['pending', 'in_progress'],
          testDate: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // за последние сутки
          }
        },
        order: [['createdAt', 'DESC']]
      });
    }
    
    // Если не нашли по терминалу, ищем по MMSI
    if (!request && signal.mmsi) {
      request = await this.requestModel.findOne({
        where: {
          mmsi: signal.mmsi,
          status: ['pending', 'in_progress'],
          testDate: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        order: [['createdAt', 'DESC']]
      });
      
      if (request) {
        console.log(`Сигнал сопоставлен с заявкой по MMSI (терминал не совпал)`);
      }
    }
    
    if (request) {
      // Обновляем статус заявки
      await request.update({
        status: 'in_progress',
        lastSignalAt: new Date()
      });
      
      console.log(`Сигнал сопоставлен с заявкой #${request.id}`);
    } else {
      console.log(`Сигнал не сопоставлен ни с одной заявкой`);
    }
    
    return request;
  }

  /**
   * Отправка подтверждения получения заявки
   */
  private async sendRequestConfirmation(request: any, parsedData: any) {
    const missingFields = [];
    if (!parsedData.terminal) missingFields.push('номер стойки ССТО');
    if (!parsedData.mmsi) missingFields.push('MMSI судна');
    if (!parsedData.vessel) missingFields.push('название судна');
    if (!parsedData.testDate) missingFields.push('дата тестирования');
    
    const html = `
      <h2>Заявка на тестирование ССТО получена</h2>
      <p>Уважаемый ${parsedData.requesterName || 'заявитель'},</p>
      <p>Ваша заявка получена и зарегистрирована в системе.</p>
      
      <div style="background: #f0f8ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3>Номер заявки: #${request.id}</h3>
        <p><strong>Источник:</strong> Email (неформализованная заявка)</p>
      </div>
      
      <h3>Извлеченные данные:</h3>
      <ul>
        <li>Номер стойки: ${parsedData.terminal || 'НЕ УКАЗАН'}</li>
        <li>Судно: ${parsedData.vessel || 'НЕ УКАЗАНО'}</li>
        <li>MMSI: ${parsedData.mmsi || 'НЕ УКАЗАН'}</li>
        <li>IMO: ${parsedData.imo || 'не указан'}</li>
        <li>Дата теста: ${parsedData.testDate ? new Date(parsedData.testDate).toLocaleDateString('ru-RU') : 'НЕ УКАЗАНА'}</li>
        <li>Телефон: ${parsedData.phone || 'не указан'}</li>
        <li>Организация: ${parsedData.company || 'не указана'}</li>
      </ul>
      
      ${missingFields.length > 0 ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>⚠️ Требуется уточнить:</h3>
          <ul>
            ${missingFields.map(f => `<li>${f}</li>`).join('')}
          </ul>
          <p>Ответьте на это письмо с недостающей информацией или войдите в систему TEST SSTO для редактирования заявки.</p>
        </div>
      ` : ''}
      
      <p>Для отслеживания статуса заявки используйте номер <strong>#${request.id}</strong></p>
      
      <hr>
      <p><small>Это автоматическое уведомление системы TEST SSTO<br>
      ГМСКЦ Владивосток</small></p>
    `;
    
    await this.emailService.sendEmail({
      to: parsedData.requesterEmail,
      subject: `Заявка #${request.id} на тестирование ССТО получена`,
      html
    });
  }
}