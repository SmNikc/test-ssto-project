import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly requestModel: typeof SSASRequest,
  ) {}

  create(dto: Partial<SSASRequest>) {
    return this.requestModel.create(dto as any);
  }

  findAll() {
    return this.requestModel.findAll();
  }

  findOne(id: number) {
    return this.requestModel.findByPk(id);
  }

  update(id: number, patch: Partial<SSASRequest>) {
    return this.requestModel.update(patch as any, { where: { id } });
  }

  remove(id: number) {
    return this.requestModel.destroy({ where: { id } });
  }
}

4) RequestController (на всякий случай — выровнен под сервис)
