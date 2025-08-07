import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { Op } from 'sequelize';
@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
    private scenarioModel: typeof TestingScenario,
  ) {}
  async createScenario(data: any): Promise<any> {
    return this.scenarioModel.create(data);
  }
  async getScenariosByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return this.scenarioModel.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
  }
}
