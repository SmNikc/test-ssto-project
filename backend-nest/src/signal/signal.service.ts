
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';

type SignalPatch = {
  signal_type?: string;
  status?: string;
  mmsi?: string;
  request_id?: number;
  [key: string]: unknown;
};

@Injectable()
export class SignalService {
  constructor(@InjectModel(Signal) private readonly signalModel: typeof Signal) {}

  findAll() {
    return this.signalModel.findAll();
  }

  findOne(signalId: string) {
    return this.signalModel.findOne({ where: { signal_id: signalId } as any });
  }

  create(data: SignalPatch) {
    return this.signalModel.create(data as any);
  }

  update(signalId: string, patch: SignalPatch) {
    return this.signalModel.update(patch as any, {
      where: { signal_id: signalId } as any,
    });
  }

  updateStatus(signalId: string, status: string) {
    return this.signalModel.update(
      { status } as any,
      { where: { signal_id: signalId } as any },
    );
  }

  linkToRequest(signalId: string, requestId: number) {
    return this.signalModel.update(
      { request_id: requestId } as any,
      { where: { signal_id: signalId } as any },
    );
  }

  remove(signalId: string) {
    return this.signalModel.destroy({
      where: { signal_id: signalId } as any,
    });
  }
}
