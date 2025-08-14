import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
    private readonly scenarioModel: typeof TestingScenario,
  ) {}

  create(dto: Partial<TestingScenario>) {
    return this.scenarioModel.create(dto as any);
  }

  findAll() {
    return this.scenarioModel.findAll();
  }

  findOne(id: string) {
    return this.scenarioModel.findByPk(id);
  }

  update(id: string, patch: Partial<TestingScenario>) {
    return this.scenarioModel.update(patch as any, { where: { scenario_id: id } });
  }

  remove(id: string) {
    return this.scenarioModel.destroy({ where: { scenario_id: id } });
  }
}

8) TestingController — корректные вызовы без +id
