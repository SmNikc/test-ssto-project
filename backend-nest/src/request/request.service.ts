import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { Op } from 'sequelize';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
  ) {}

  create(data: any) {
    return this.requestModel.create(data);
  }

  findAll() {
    return this.requestModel.findAll();
  }

  findOne(id: string) {
    return this.requestModel.findOne({ where: { request_id: id } });
  }

  update(id: string, data: any) {
    return this.requestModel.update(data, { where: { request_id: id } });
  }

  remove(id: string) {
    return this.requestModel.destroy({ where: { request_id: id } });
  }

  getRequestsByPeriod(startDate: Date, endDate: Date) {
    return this.requestModel.findAll({
      where: {
        test_date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
  }
}
