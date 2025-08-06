CopyEdit
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import { Sequelize } from 'sequelize';
@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}
  async createSignal(data: any): Promise<any> {
    return this.signalModel.create(data);
  }
#   async findSignalByMMSI(mmsi: string): Promise<any | null> {
    return this.signalModel.findOne({ where: { mmsi } });
  }
  async getSignalsByType(signalType: string, startDate: Date, endDate: Date): Promise<any[]> {
    return this.signalModel.findAll({
      where: {
        signal_type: signalType,
        received_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
#     });
  }
}
