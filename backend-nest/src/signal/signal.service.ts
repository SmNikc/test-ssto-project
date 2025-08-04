<<<<<<< HEAD
=======
CopyEdit
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import { Sequelize } from 'sequelize';
<<<<<<< HEAD

=======
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}
<<<<<<< HEAD

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
    const where: any = {
      received_at: {
        [Sequelize.Op.between]: [startDate, endDate],
      },
    };

    if (signalType !== 'all') {
      where.signal_type = signalType;
    }

    return this.signalModel.findAll({ where });
=======
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
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
