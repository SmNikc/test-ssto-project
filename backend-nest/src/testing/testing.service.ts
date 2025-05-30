import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { Sequelize } from 'sequelize';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
    private testingModel: typeof TestingScenario,
  ) {}

  async createScenario(data: any): Promise<TestingScenario> {
    return this.testingModel.create(data);
  }

  async updateScenario(scenarioId: string, data: any): Promise<void> {
    await this.testingModel.update(data, { where: { scenario_id: scenarioId } });
  }

  async getScenariosByPeriod(startDate: Date, endDate: Date): Promise<TestingScenario[]> {
    return this.testingModel.findAll({
      where: {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
    });
  }
}
