import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { ScenarioPayload, validateScenario } from '../validators/testingScenario.validator';

@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
    private readonly model: typeof TestingScenario,
  ) {}

  findAll() {
    return this.model.findAll();
  }

  async findOne(scenario_id: string) {
    const row = await this.model.findByPk(scenario_id);
    if (!row) throw new NotFoundException(`Scenario "${scenario_id}" not found`);
    return row;
  }

  async create(dto: ScenarioPayload) {
    const errors = validateScenario(dto);
    if (errors.length) throw new BadRequestException({ errors });
    return this.model.create(dto as any);
  }

  async update(scenario_id: string, patch: Partial<ScenarioPayload>) {
    const errors = validateScenario({ ...patch, scenario_id });
    if (errors.length) throw new BadRequestException({ errors });
    await this.model.update(patch as any, { where: { scenario_id } });
    return this.findOne(scenario_id);
  }

  async remove(scenario_id: string) {
    await this.model.destroy({ where: { scenario_id } });
    return { deleted: true };
  }
}
