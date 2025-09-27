import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Signal from '../models/signal.model';

@Injectable()
export class SignalService {
  constructor(
    @InjectModel(Signal)
    private signalModel: typeof Signal,
  ) {}

  async findAll() {
    return this.signalModel.findAll();
  }

  async findOne(id: number) {
    return this.signalModel.findByPk(id);
  }

  async create(data: any) {
    return this.signalModel.create(data);
  }

  async update(id: number, data: any) {
    const signal = await this.findOne(id);
    if (!signal) throw new Error('Signal not found');
    return signal.update(data);
  }

  async remove(id: number) {
    const signal = await this.findOne(id);
    if (!signal) throw new Error('Signal not found');
    await signal.destroy();
  }

  async findRequestById(id: number) {
    return {
      id: id,
      name: 'Test Request',
      vessel_name: 'Test Vessel',
      mmsi: '123456789',
      imo: 'IMO1234567',
      status: 'pending',
      test_date: new Date(),
      ship_owner: 'Test Owner',
      contact_email: 'test@example.com',
      contact_phone: '+7(900)123-45-67',
      test_window_hours: 2,
      inmarsat_number: '12345',
      notes: 'Test notes',
      created_at: new Date(),
      updated_at: new Date()
    };
  }

  async findAllRequests(query: any) {
    return [
      {
        id: 1,
        vessel_name: 'Test Vessel 1',
        mmsi: '123456789',
        imo: 'IMO1234567',
        status: 'pending',
        test_date: new Date(),
        ship_owner: 'Owner 1'
      },
      {
        id: 2,
        vessel_name: 'Test Vessel 2',
        mmsi: '987654321',
        imo: 'IMO7654321',
        status: 'completed',
        test_date: new Date(),
        ship_owner: 'Owner 2'
      }
    ];
  }
}
