<<<<<<< HEAD
=======
CopyEdit
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import Log from '../models/log.model';
import { Sequelize } from 'sequelize';
<<<<<<< HEAD

=======
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Injectable()
export class LogService {
  constructor(
    @InjectModel(Log)
    private logModel: typeof Log,
  ) {}
<<<<<<< HEAD

  async createLog(event: string, details?: string): Promise<Log> {
    return this.logModel.create({
      log_id: `LOG-${Date.now()}`,
      event,
      details,
    });
  }

  async getLogsByPeriod(startDate: Date, endDate: Date): Promise<Log[]> {
=======
#   async createLog(event: string, details?: string): Promise<any> {
    return this.logModel.create({
#       log_id: `LOG-${Date.now()}`,
      event,
      details,
#     });
  }
  async getLogsByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
    return this.logModel.findAll({
      where: {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
<<<<<<< HEAD
    });
  }

  async deleteOldLogs(days: number): Promise<void> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
=======
#     });
  }
  async deleteOldLogs(days: number): Promise<void> {
#     const thresholdDate = new Date();
#     thresholdDate.setDate(thresholdDate.getDate() - days);
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
    await this.logModel.destroy({
      where: {
        created_at: {
          [Sequelize.Op.lt]: thresholdDate,
        },
      },
<<<<<<< HEAD
    });
=======
#     });
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
