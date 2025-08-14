import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private readonly signalModel: typeof Signal,
  ) {}

  create(dto: Partial<Signal>) {
    return this.signalModel.create(dto as any);
  }

  findAll() {
    return this.signalModel.findAll();
  }

  // ВНИМАНИЕ: PK — строковый signal_id
  findOne(id: string) {
    return this.signalModel.findOne({ where: { signal_id: id } });
  }

  update(id: string, patch: Partial<Signal>) {
    return this.signalModel.update(patch as any, { where: { signal_id: id } });
  }

  updateStatus(id: string, status: string) {
    return this.signalModel.update({ status } as any, { where: { signal_id: id } });
  }

  linkToRequest(id: string, requestId: number) {
    return this.signalModel.update({ request_id: requestId } as any, { where: { signal_id: id } });
  }

  remove(id: string) {
    return this.signalModel.destroy({ where: { signal_id: id } });
  }
}

6) SignalController — исправлен тип id и путь к guard
