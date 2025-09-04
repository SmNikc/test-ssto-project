import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';
import Vessel from '../models/vessel.model';
import { Op } from 'sequelize';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
    @InjectModel(SSASRequest)
    private requestModel: typeof SSASRequest,
    @InjectModel(Vessel)
    private vesselModel: typeof Vessel,
  ) {}

  async findOne(id: number): Promise<Signal | null> {
    return await this.signalModel.findByPk(id);
  }

  async findAll(): Promise<Signal[]> {
    return await this.signalModel.findAll({
      order: [['received_at', 'DESC']]
    });
  }

  async create(data: Partial<Signal>): Promise<Signal> {
    const signal = await this.signalModel.create(data as any);
    await this.matchSignalWithRequests(signal);
    return signal;
  }

  async update(id: number, data: Partial<Signal>): Promise<Signal | null> {
    await this.signalModel.update(data as any, { where: { id } });
    return this.findOne(id);
  }

  async remove(id: number): Promise<boolean> {
    const deleted = await this.signalModel.destroy({ where: { id } });
    return deleted > 0;
  }

  async findRequest(id: string): Promise<SSASRequest | null> {
    return await this.requestModel.findByPk(id);
  }

  async findAllRequests(): Promise<SSASRequest[]> {
    return await this.requestModel.findAll({
      order: [['planned_test_date', 'DESC']]
    });
  }

  async createRequest(data: Partial<SSASRequest>): Promise<SSASRequest> {
    if (data.mmsi && !data.vessel_id) {
      let vessel = await this.vesselModel.findOne({ where: { mmsi: data.mmsi } });
      if (!vessel) {
        vessel = await this.vesselModel.create({
          mmsi: data.mmsi,
          name: data.vessel_name || 'Unknown',
          imo_number: (data as any).imo_number
        } as any);
      }
      data.vessel_id = vessel.id;
    }
    return await this.requestModel.create(data as any);
  }

  async matchSignalWithRequests(signal: Signal): Promise<void> {
    const timeWindowStart = new Date(signal.received_at.getTime() - 2 * 60 * 60 * 1000);
    const timeWindowEnd = new Date(signal.received_at.getTime() + 2 * 60 * 60 * 1000);
    
    const matchingRequest = await this.requestModel.findOne({
      where: {
        mmsi: signal.mmsi,
        planned_test_date: {
          [Op.between]: [timeWindowStart, timeWindowEnd]
        },
        status: 'pending'
      }
    });
    
    if (matchingRequest) {
      signal.request_id = matchingRequest.id;
      signal.status = 'MATCHED';
      await signal.save();
      
      matchingRequest.status = 'matched';
      matchingRequest.signal_id = signal.id;
      await matchingRequest.save();
      
      console.log(`Signal ${signal.id} matched with request ${matchingRequest.id}`);
    }
  }

  async findUnmatchedSignals(): Promise<Signal[]> {
    return await this.signalModel.findAll({
      where: {
        status: 'UNMATCHED',
        request_id: null
      }
    });
  }

  async findSignalsByDateRange(startDate: Date, endDate: Date): Promise<Signal[]> {
    return await this.signalModel.findAll({
      where: {
        received_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['received_at', 'DESC']]
    });
  }

  async processEmailSignal(signalData: any): Promise<Signal> {
    // Обработка сигнала из email
    const signal = await this.create({
      terminal_number: signalData.terminal_number || signalData.terminalNumber,
      mmsi: signalData.mmsi,
      signal_type: signalData.signal_type || 'EMAIL',
      received_at: signalData.received_at || new Date(),
      status: 'UNMATCHED',
      metadata: signalData
    });
    
    // Пытаемся сопоставить с заявками
    await this.matchSignalWithRequests(signal);
    
    return signal;
  }
}
