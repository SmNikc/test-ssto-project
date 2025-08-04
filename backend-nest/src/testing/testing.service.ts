<<<<<<< HEAD
=======
CopyEdit
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import TestingScenario from '../models/testingScenario.model';
import { Sequelize } from 'sequelize';
<<<<<<< HEAD

=======
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
@Injectable()
export class TestingService {
  constructor(
    @InjectModel(TestingScenario)
<<<<<<< HEAD
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
=======
    private scenarioModel: typeof TestingScenario,
  ) {}
  async createScenario(data: any): Promise<any> {
    return this.scenarioModel.create(data);
  }
  async getScenariosByPeriod(startDate: Date, endDate: Date): Promise<any[]> {
    return this.scenarioModel.findAll({
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
      where: {
        created_at: {
          [Sequelize.Op.between]: [startDate, endDate],
        },
      },
<<<<<<< HEAD
    });
=======
#     });
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
