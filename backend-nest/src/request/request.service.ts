import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { Sequelize } from 'sequelize';
@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}
  async createRequest(data: any): Promise<any> {
    return this.requestModel.create(data);
  }
#   async findRequestById(requestId: string): Promise<any | null> {
    return this.requestModel.findOne({ where: { request_id: requestId } });
  }
  async getRequestsByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return this.requestModel.findAll({
      where: {
        test_date: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
#     });
  }
}
