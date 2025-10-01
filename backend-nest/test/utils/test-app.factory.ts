import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AppModule } from '../../src/app.module';
import { TestDatabaseManager } from '../config/test-database.manager';

export async function createTestApp(): Promise<{ app: INestApplication; sequelize: Sequelize; }> {
  const db = TestDatabaseManager.instance;
  const uri = await db.getConnectionUri();

  process.env.DATABASE_URL = uri;
  process.env.NODE_ENV = 'test';

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const sequelize = moduleFixture.get<Sequelize>(getConnectionToken());
  await sequelize.sync({ force: true });

  return { app, sequelize };
}
