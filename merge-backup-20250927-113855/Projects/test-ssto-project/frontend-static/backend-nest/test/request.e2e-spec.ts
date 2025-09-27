import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
describe('Requests (e2e)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  it('Создание заявки: валидные данные', async () => {
    const result = await request(app.getHttpServer())
      .post('/requests')
      .send({
        mmsi: '123456789',
        vessel_name: 'Test Vessel',
        ssas_number: 'SSAS001',
        owner_organization: 'OwnerOrg',
        contact_person: 'Ivan',
        contact_phone: '+79991234567',
        email: 'user@email.com',
        test_date: '2025-08-09',
        start_time: '12:00',
        end_time: '13:00'
      });
    expect(result.status).toBe(201);
  });
  it('Создание заявки: невалидные данные', async () => {
    const result = await request(app.getHttpServer())
      .post('/requests')
      .send({
        mmsi: 'badmmsi'
      });
    expect(result.status).toBe(400);
    expect(result.body.errors).toBeDefined();
  });
  afterAll(async () => {
    await app.close();
  });
});
