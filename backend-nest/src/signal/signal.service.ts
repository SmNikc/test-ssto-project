import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Signal } from '../models/signal.model';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}

  async createSignal(data: any): Promise<Signal> {
    return this.signalModel.create(data);
  }

  async findSignalByMMSI(mmsi: string): Promise<Signal | null> {
    return this.signalModel.findOne({ where: { mmsi } });
  }

  async updateSignalStatus(signalId: string, status: string, comments?: string): Promise<void> {
    await this.signalModel.update(
      { status, comments },
      { where: { signal_id: signalId } },
    );
  }

  async getSignalsByType(signalType: string, startDate: Date, endDate: Date): Promise<Signal[]> {
    return this.signalModel.findAll({
      where: {
        signal_type: signalType,
        received_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
  }
}
