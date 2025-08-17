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

  create(data: any) {
    return this.scenarioModel.create(data);
  }

  findAll() {
    return this.scenarioModel.findAll();
  }

  findOne(id: string) {
    return this.scenarioModel.findOne({ where: { scenario_id: id } });
  }

  update(id: string, data: any) {
    return this.scenarioModel.update(data, { where: { scenario_id: id } });
  }

  remove(id: string) {
    return this.scenarioModel.destroy({ where: { scenario_id: id } });
  }

  getScenariosByPeriod(startDate: Date, endDate: Date) {
    return this.scenarioModel.findAll({
      where: {
        created_at: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
  }
}
