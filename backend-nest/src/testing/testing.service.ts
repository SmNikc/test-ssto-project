
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import {
  ScenarioPayload,
  validateScenario,
} from '../validators/testingScenario.validator';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
    private readonly model: typeof TestingScenario,
  ) {}

  findAll() {
    return this.model.findAll();
  }

  findOne(scenarioId: string) {
    return this.model.findOne({ where: { scenario_id: scenarioId } as any });
  }

  async create(dto: ScenarioPayload) {
    const errors = validateScenario(dto);
    if (errors.length) {
      const err = new Error('Validation failed');
      (err as any).details = errors;
      throw err;
    }
    return this.model.create(dto as any);
  }

  async update(scenarioId: string, dto: Partial<ScenarioPayload>) {
    const [count] = await this.model.update(dto as any, {
      where: { scenario_id: scenarioId } as any,
    });
    return { updated: count > 0 };
  }

  async remove(scenarioId: string) {
    const count = await this.model.destroy({
      where: { scenario_id: scenarioId } as any,
    });
    return { deleted: count > 0 };
  }
}
