
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Log from '../models/log.model';

@Injectable()
export class LogService {
  constructor(@InjectModel(Log) private readonly logModel: typeof Log) {}

  findAll(): Promise<Log[]> {
    return this.logModel.findAll();
  }

  findOne(id: number): Promise<Log | null> {
    return this.logModel.findByPk(id);
  }

  create(data: Partial<Log>): Promise<Log> {
    return this.logModel.create(data as any);
  }

  remove(id: number): Promise<number> {
    return this.logModel.destroy({ where: { id } });
  }
}
