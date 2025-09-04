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
    return this.reqModel.findAll();
  }

  async findOne(id: string) {
    const row = await this.reqModel.findByPk(id);
    if (!row) throw new NotFoundException(`Request #${id} not found`);
    return row;
  }

  async create(data: Partial<SSASRequest>) {
    if (!data.mmsi || !data.vessel_name) {
      throw new BadRequestException('MMSI and vessel_name are required');
    }
    
    const requestData = {
      ...data,
      status: data.status || RequestStatus.DRAFT
    };
    
    return this.reqModel.create(requestData as any);
  }

  async update(id: string, data: Partial<SSASRequest>) {
    // Используем request_id для обновления
    await this.reqModel.update(data, { where: { request_id: id } });
    return this.findOne(id);
  }

  async updateStatus(id: string, status: string) {
    const request = await this.findOne(id);
    request.status = status;
    await request.save();
    return request;
  }

  async remove(id: string) {
    const request = await this.findOne(id);
    await request.destroy();
    return { deleted: true };
  }

  async findPending() {
    return this.reqModel.findAll({
      where: {
        status: ['SUBMITTED', 'IN_REVIEW']
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
    
    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`
      );
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