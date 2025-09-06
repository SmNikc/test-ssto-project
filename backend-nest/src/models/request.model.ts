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
    return this.reqModel.findAll({ order: [['created_at', 'DESC']] });
  }

  /**
   * Надёжный поиск только по первичному ключу id (число).
   * Виртуальное поле request_id в модели используется лишь для совместимости в ответах,
   * в БД его нет — по нему не ищем.
   */
  async findOne(id: string) {
    const asNumber = Number(id);
    if (!Number.isFinite(asNumber)) {
      throw new NotFoundException(`Request #${id} not found`);
    }
    const row = await this.reqModel.findByPk(asNumber as any);
    if (!row) throw new NotFoundException(`Request #${id} not found`);
    return row;
  }

  async create(data: Partial<SSASRequest>) {
    if (!data.mmsi || !data.vessel_name) {
      throw new BadRequestException('MMSI and vessel_name are required');
    }
    const payload = {
      ...data,
      status: (data.status as RequestStatus) || RequestStatus.DRAFT
    };
    return this.reqModel.create(payload as any);
  }

  /**
   * Обновление по реальному PK id.
   * Если пришёл строковый id — приводим к числу и используем PK.
   */
  async update(id: string, data: Partial<SSASRequest>) {
    const row = await this.findOne(id); // гарантируем существование
    await this.reqModel.update(data, { where: { id: row.id } });
    return this.findOne(String(row.id));
  }

  async updateStatus(id: string, status: string) {
    const row = await this.findOne(id);
    row.status = status;
    await row.save();
    return row;
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await row.destroy();
    return { deleted: true };
  }

  async findPending() {
    return this.reqModel.findAll({
      where: { status: [RequestStatus.SUBMITTED, RequestStatus.IN_REVIEW] } as any,
      order: [['created_at', 'DESC']]
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
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }
    request.status = newStatus;
    await request.save({ transaction });
    return request;
  }

  async getAvailableTransitions(id: string): Promise<RequestStatus[]> {
    const request = await this.findOne(id);
    const currentStatus = request.status as RequestStatus;
    return STATUS_TRANSITIONS[currentStatus] || [];
  }
}
