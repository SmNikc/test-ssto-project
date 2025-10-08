// backend-nest/src/request/request.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import SSASRequest from '../models/request.model';

export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  IN_TESTING = 'IN_TESTING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
  [RequestStatus.SUBMITTED]: [RequestStatus.IN_REVIEW, RequestStatus.CANCELLED],
  [RequestStatus.IN_REVIEW]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.APPROVED]: [RequestStatus.IN_TESTING, RequestStatus.CANCELLED],
  [RequestStatus.IN_TESTING]: [RequestStatus.COMPLETED, RequestStatus.CANCELLED],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.REJECTED]: [RequestStatus.DRAFT],
  [RequestStatus.CANCELLED]: []
};

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly reqModel: typeof SSASRequest,
  ) {}

  async findAll() {
    try {
      // If the database is unreachable or the query fails we don't want the
      // whole `/requests` endpoint to crash with a 500 error.  Instead we log
      // the problem and return an empty list so that the frontend can handle
      // the situation gracefully.
      return await this.reqModel.findAll();
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      return [];
    }
  }

  async findOne(id: string) {
    const row = await this.reqModel.findByPk(id);
    if (!row) throw new NotFoundException(`Request #${id} not found`);
    return row;
  }

  // ===== ДОБАВЛЕНО: нормализация статуса под ENUM в БД (без изменения бизнес-смыслов) =====
  /**
   * Приводит значение статуса к допустимым меткам БД (строчные):
   * pending / approved / rejected / completed / failed / matched / unmatched / in_review / in_testing / cancelled
   * Если пришёл enum в верхнем регистре — маппим на ближайшую допустимую метку.
   * Если пришла произвольная строка — берём 'pending' по умолчанию.
   */
  private normalizeDbStatus(input: any): string {
    const allowed = new Set([
      'pending', 'approved', 'rejected', 'completed', 'failed',
      'matched', 'unmatched', 'in_review', 'in_testing', 'cancelled',
    ]);

    // Если прилетело одно из наших enum-значений — переводим в метки БД
    switch (input) {
      case RequestStatus.DRAFT:        return 'pending';
      case RequestStatus.SUBMITTED:    return 'pending';
      case RequestStatus.IN_REVIEW:    return 'in_review';
      case RequestStatus.APPROVED:     return 'approved';
      case RequestStatus.IN_TESTING:   return 'in_testing';
      case RequestStatus.COMPLETED:    return 'completed';
      case RequestStatus.REJECTED:     return 'rejected';
      case RequestStatus.CANCELLED:    return 'cancelled';
      default: break;
    }

    const raw = (input ?? '').toString().trim();
    if (!raw) return 'pending';
    const lower = raw.toLowerCase();
    return allowed.has(lower) ? lower : 'pending';
  }
  // =========================================================================================

  async create(data: Partial<SSASRequest>) {
    if (!data.mmsi || !data.vessel_name) {
      throw new BadRequestException('MMSI and vessel_name are required');
    }

    const shipOwner =
      (typeof data.ship_owner === 'string' && data.ship_owner.trim()) ||
      (typeof data.owner_organization === 'string' && data.owner_organization.trim()) ||
      'N/A SHIP OWNER';

    const requestData = {
      ...data,
      ship_owner: shipOwner,
      ...data,
      // было: status: data.status || RequestStatus.DRAFT
      // стало: нормализация под БД, без изменения вашей семантики
      status: this.normalizeDbStatus(data.status ?? RequestStatus.DRAFT)
    };
    
    return this.reqModel.create(requestData as any);
  }

  async update(id: string, data: Partial<SSASRequest>) {
    // База данных не содержит отдельного поля `request_id`, поэтому
    // обновление выполняется по первичному ключу `id`.
    const patch: any = { ...data };
    if (data.status !== undefined) {
      patch.status = this.normalizeDbStatus(data.status);
    }
    await this.reqModel.update(patch, { where: { id } });
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string) {
    const request = await this.findOne(id);
    request.status = this.normalizeDbStatus(status);
    await request.save();
    return request;
  }

  async remove(id: string) {
    const request = await this.findOne(id);
    await request.destroy();
    return { deleted: true };
  }

  async findPending() {
    // чтобы работало независимо от регистра в БД — используем оба варианта
    return this.reqModel.findAll({
      where: {
        status: ['SUBMITTED', 'IN_REVIEW', 'submitted', 'in_review', 'pending'] as any
      }
    });
  }

  async transitionStatus(
    id: string,
    newStatus: RequestStatus,
    transaction?: Transaction
  ): Promise<SSASRequest> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RequestStatus;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];
    
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
    }
    
    // сохраняем в БД нормализованную метку
    request.status = this.normalizeDbStatus(newStatus);
    await request.save({ transaction });
    
    return request;
  }

  async getAvailableTransitions(id: string): Promise<RequestStatus[]> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RequestStatus;
    return STATUS_TRANSITIONS[currentStatus] || [];
  }
}
