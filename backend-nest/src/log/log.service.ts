import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Log from '../models/log.model';
import { Op } from 'sequelize';
@Injectable()
export class LogService {
  constructor(
    @InjectModel(Log)
    private logModel: typeof Log,
  ) {}
  async createLog(event: string, details?: string): Promise<any> {
    return this.logModel.create({
      log_id: `LOG-${Date.now()}`,
      event,
      details,
    });
  }
  async getLogsByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return this.logModel.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
  }
  async deleteOldLogs(days: number): Promise<void> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    await this.logModel.destroy({
      where: {
        created_at: {
          [Op.lt]: thresholdDate,
        },
      },
    });
  }
}
