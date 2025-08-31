import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import SSASRequest from '../models/request';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(SSASRequest)
    private readonly reqModel: typeof SSASRequest,
  ) {}

  findAll() {
    return this.reqModel.findAll();
  }

  async findOne(id: number) {
    const row = await this.reqModel.findByPk(id);
    if (!row) throw new NotFoundException(`Request #${id} not found`);
    return row;
  }

  create(data: Partial<SSASRequest>) {
    return this.reqModel.create(data as any);
  }
}
