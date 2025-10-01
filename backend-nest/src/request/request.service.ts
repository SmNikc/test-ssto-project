// backend-nest/src/request/request.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import SSASRequest from '../models/request.model';
import { addMonths, differenceInCalendarDays, isAfter, isBefore, subDays } from 'date-fns';

export enum RequestStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Статусные переходы
const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.PENDING, RequestStatus.CANCELLED],
  [RequestStatus.PENDING]: [RequestStatus.APPROVED, RequestStatus.REJECTED, RequestStatus.CANCELLED],
  [RequestStatus.APPROVED]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
  [RequestStatus.REJECTED]: [RequestStatus.DRAFT, RequestStatus.PENDING],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.CANCELLED]: [RequestStatus.DRAFT],
};

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly reqModel: typeof SSASRequest,
  ) {}

  /**
   * Нормализация статуса для БД (если в БД другие значения)
   */
  private normalizeDbStatus(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'draft',
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      COMPLETED: 'completed',
      CANCELLED: 'cancelled',
    };
    return map[status] || status.toLowerCase();
  }

  /**
   * Обратная нормализация статуса из БД
   */
  private normalizeAppStatus(dbStatus: string): RequestStatus {
    const map: Record<string, RequestStatus> = {
      draft: RequestStatus.DRAFT,
      pending: RequestStatus.PENDING,
      approved: RequestStatus.APPROVED,
      rejected: RequestStatus.REJECTED,
      completed: RequestStatus.COMPLETED,
      cancelled: RequestStatus.CANCELLED,
    };
    return map[dbStatus.toLowerCase()] || RequestStatus.DRAFT;
  }

  /**
   * Получить все заявки
   */
  async findAll(): Promise<SSASRequest[]> {
    return this.reqModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Получить заявку по ID
   */
  async findById(id: string | number): Promise<SSASRequest> {
    const request = await this.reqModel.findByPk(id);
    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }
    return request;
  }

  /**
   * Создать новую заявку
   */
  async create(data: Partial<SSASRequest>): Promise<SSASRequest> {
    if (!data.mmsi || !data.vessel_name) {
      throw new BadRequestException('MMSI and vessel_name are required');
    }

    const requestData = {
      ...data,
      status: this.normalizeDbStatus(data.status ?? RequestStatus.DRAFT)
    };

    const created = await this.reqModel.create(requestData as any);
    return this.ensureRequestNumber(created);
  }

  /**
   * Обновить заявку
   */
  async update(id: string, data: Partial<SSASRequest>): Promise<SSASRequest> {
    const request = await this.findById(id);
    
    // Если обновляется статус, проверяем допустимость перехода
    if (data.status) {
      const currentStatus = this.normalizeAppStatus(request.status);
      const newStatus = data.status as RequestStatus;
      
      if (!this.isTransitionAllowed(currentStatus, newStatus)) {
        throw new BadRequestException(
          `Transition from ${currentStatus} to ${newStatus} is not allowed`
        );
      }
      
      data.status = this.normalizeDbStatus(newStatus);
    }
    
    await request.update(data);
    return request;
  }

  /**
   * Удалить заявку
   */
  async delete(id: string): Promise<void> {
    const request = await this.findById(id);
    await request.destroy();
  }

  /**
   * Получить заявки по статусу
   */
  async findByStatus(status: RequestStatus): Promise<SSASRequest[]> {
    const dbStatus = this.normalizeDbStatus(status);
    return this.reqModel.findAll({
      where: { status: dbStatus },
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Проверка допустимости перехода статусов
   */
  private isTransitionAllowed(from: RequestStatus, to: RequestStatus): boolean {
    const allowedTransitions = STATUS_TRANSITIONS[from] || [];
    return allowedTransitions.includes(to);
  }

  /**
   * Получить доступные переходы для текущего статуса
   */
  getAvailableTransitions(request: SSASRequest): RequestStatus[] {
    const currentStatus = request.status as RequestStatus;
    return STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Обеспечить наличие номера заявки
   */
  private async ensureRequestNumber(entity: SSASRequest): Promise<SSASRequest> {
    if (entity.request_number) {
      return entity;
    }

    const createdAt = entity.getDataValue('createdAt') || new Date();
    const year = new Date(createdAt).getFullYear();
    
    const count = await this.reqModel.count({
      where: {
        request_number: {
          [Op.like]: `REQ-${year}-%`,
        } as any,
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    entity.setDataValue('request_number', `REQ-${year}-${sequence}`);
    await entity.save();
    
    return entity;
  }

  /**
   * Расчёт следующей плановой даты теста.
   * Согласно письму Минтранса от 29.05.2024 тест должен проводиться не реже одного раза в 12 месяцев.
   */
  calculateNextTestDate(lastCompletedTest: Date): Date {
    return addMonths(lastCompletedTest, 12);
  }

  /**
   * Возвращает плановые даты напоминаний T-30 и T-0.
   * T-30: за 30 дней до теста
   * T-0: за 15 дней до теста
   */
  getReminderWindow(nextTestDate: Date): { remind30: Date; remind0: Date } {
    const remind30 = subDays(nextTestDate, 30);
    const remind0 = subDays(nextTestDate, 15); // T-0 это за 15 дней, не в день теста
    return { remind30, remind0 };
  }

  /**
   * Проверяет необходимость отправить напоминание исходя из текущей даты.
   * ИСПРАВЛЕНО: Корректная обработка граничных дат T-30 и T-0
   */
  shouldSendReminder(nextTestDate: Date, now = new Date()): { type: 'none' | 'T-30' | 'T-0'; overdue: boolean } {
    const { remind30, remind0 } = this.getReminderWindow(nextTestDate);
    const daysUntilTest = differenceInCalendarDays(nextTestDate, now);
    
    // Если тест уже просрочен
    if (daysUntilTest < 0) {
      return { type: 'T-0', overdue: true };
    }
    
    // Используем сравнение дней вместо дат для избежания проблем с временными зонами
    const daysUntilRemind30 = differenceInCalendarDays(remind30, now);
    const daysUntilRemind0 = differenceInCalendarDays(remind0, now);
    
    // T-0: если до даты T-0 осталось 0 дней или меньше (включая день T-0)
    if (daysUntilRemind0 <= 0) {
      return { type: 'T-0', overdue: false };
    }
    
    // T-30: если до даты T-30 осталось 0 дней или меньше, но еще не наступил T-0
    if (daysUntilRemind30 <= 0 && daysUntilRemind0 > 0) {
      return { type: 'T-30', overdue: false };
    }
    
    // Еще рано для уведомлений
    return { type: 'none', overdue: false };
  }

  /**
   * Альтернативный метод с использованием сравнения дат (для обратной совместимости)
   */
  shouldSendReminderLegacy(nextTestDate: Date, now = new Date()): { type: 'none' | 'T-30' | 'T-0'; overdue: boolean } {
    const { remind30, remind0 } = this.getReminderWindow(nextTestDate);
    
    // Если тест уже просрочен (дата теста прошла)
    if (differenceInCalendarDays(now, nextTestDate) > 0) {
      return { type: 'T-0', overdue: true };
    }
    
    // Получаем даты без времени для корректного сравнения
    const nowDate = now.toDateString();
    const remind30Date = remind30.toDateString();
    const remind0Date = remind0.toDateString();
    
    // T-0: если сегодня дата T-0 или позже (но до даты теста)
    if (nowDate === remind0Date || isAfter(now, remind0)) {
      return { type: 'T-0', overdue: false };
    }
    
    // T-30: если сегодня дата T-30 или позже (но до T-0)
    if (nowDate === remind30Date || (isAfter(now, remind30) && isBefore(now, remind0))) {
      return { type: 'T-30', overdue: false };
    }
    
    // Еще рано для уведомлений
    return { type: 'none', overdue: false };
  }

  /**
   * Поиск заявок, требующих напоминания
   */
  async findRequestsNeedingReminders(): Promise<Array<{
    request: SSASRequest;
    reminderType: 'T-30' | 'T-0';
    overdue: boolean;
  }>> {
    // Получаем все активные заявки
    const activeRequests = await this.reqModel.findAll({
      where: {
        status: {
          [Op.in]: [
            this.normalizeDbStatus(RequestStatus.PENDING),
            this.normalizeDbStatus(RequestStatus.APPROVED),
          ],
        },
        test_date: {
          [Op.ne]: null,
        },
      },
    });

    const results = [];
    const now = new Date();

    for (const request of activeRequests) {
      if (!request.test_date) continue;
      
      const reminder = this.shouldSendReminder(request.test_date, now);
      
      if (reminder.type !== 'none') {
        results.push({
          request,
          reminderType: reminder.type,
          overdue: reminder.overdue,
        });
      }
    }

    return results;
  }

  /**
   * Массовое обновление статусов в транзакции
   */
  async bulkUpdateStatus(
    ids: number[],
    newStatus: RequestStatus,
    transaction?: Transaction
  ): Promise<number> {
    const dbStatus = this.normalizeDbStatus(newStatus);
    
    const [affectedCount] = await this.reqModel.update(
      { status: dbStatus },
      {
        where: { id: { [Op.in]: ids } },
        transaction,
      }
    );
    
    return affectedCount;
  }

  /**
   * Получить статистику по заявкам
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    needingReminders: number;
    overdue: number;
  }> {
    const all = await this.reqModel.findAll();
    const byStatus: Record<string, number> = {};
    
    for (const status of Object.values(RequestStatus)) {
      const dbStatus = this.normalizeDbStatus(status);
      byStatus[status] = all.filter(r => r.status === dbStatus).length;
    }

    const reminders = await this.findRequestsNeedingReminders();
    
    return {
      total: all.length,
      byStatus,
      needingReminders: reminders.length,
      overdue: reminders.filter(r => r.overdue).length,
    };
  }
}
