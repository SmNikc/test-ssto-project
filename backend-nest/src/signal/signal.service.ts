import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Signal } from '../models/signal.model';
import { Op } from 'sequelize';

@Injectable()
export class SignalService {
  constructor(@InjectModel(Signal) private readonly signalModel: typeof Signal) {}

  create(dto: any) {
    return this.signalModel.create(dto);
  }

  findAll(params?: { startDate?: Date; endDate?: Date }) {
    const where: any = {};
    if (params?.startDate && params?.endDate) {
      where.createdAt = { [Op.between]: [params.startDate, params.endDate] };
    }
    return this.signalModel.findAll({ where });
  }

  findOne(id: number) {
    return this.signalModel.findByPk(id);
  }

  update(id: number, dto: any) {
    return this.signalModel.update(dto, { where: { id } });
  }

  remove(id: number) {
    return this.signalModel.destroy({ where: { id } });
  }

  updateStatus(id: number, status: string) {
    return this.signalModel.update({ status }, { where: { id } });
  }

  linkToRequest(id: number, requestId: string) {
    return this.signalModel.update({ request_id: requestId }, { where: { id } });
  }
}
