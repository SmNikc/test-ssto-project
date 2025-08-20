
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly requestModel: typeof SSASRequest,
  ) {}

  findAll() {
    return this.requestModel.findAll();
  }

  findOne(id: number) {
    return this.requestModel.findByPk(id);
  }

  create(data: Partial<SSASRequest>) {
    return this.requestModel.create(data as any);
  }

  remove(id: number) {
    return this.requestModel.destroy({ where: { id } });
  }
}
