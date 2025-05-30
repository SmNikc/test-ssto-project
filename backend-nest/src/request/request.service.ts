import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SSASRequest } from '../models/request';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}

  async createRequest(data: any): Promise<SSASRequest> {
    return this.requestModel.create(data);
  }

  async findRequestByMMSI(mmsi: string): Promise<SSASRequest | null> {
    return this.requestModel.findOne({ where: { mmsi } });
  }
}
