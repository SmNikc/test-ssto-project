import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize';
import SSASRequest from '../models/request';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}

  async createRequest(data: any): Promise<SSASRequest> {
    return this.requestModel.create(data);
  }

  async findRequestById(requestId: string): Promise<SSASRequest | null> {
    return this.requestModel.findOne({ where: { request_id: requestId } });
  }

  async updateRequestStatus(requestId: string, status: string): Promise<void> {
    await this.requestModel.update(
      { status },
      { where: { request_id: requestId } },
    );
  }

  async getRequestsByPeriod(startDate: Date, endDate: Date): Promise<SSASRequest[]> {
    return this.requestModel.findAll({
      where: {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
  }
}