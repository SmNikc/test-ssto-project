import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { Sequelize, Op } from 'sequelize';
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
  async updateScenario(id: string, data: any): Promise<any> {
    await this.scenarioModel.update(data, { where: { scenario_id: id } });
    return this.scenarioModel.findOne({ where: { scenario_id: id } });
  }
  async removeScenario(id: string): Promise<{ deleted: boolean }> {
    const rows = await this.scenarioModel.destroy({ where: { scenario_id: id } });
    return { deleted: rows > 0 };
  }
}
