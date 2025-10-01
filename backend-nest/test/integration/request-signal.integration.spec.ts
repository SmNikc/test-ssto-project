import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { Sequelize } from 'sequelize-typescript';
import { SequelizeModule, getConnectionToken } from '@nestjs/sequelize';
import * as request from 'supertest';
import { RequestModule } from '../../src/request/request.module';
import { SignalModule } from '../../src/signal/signal.module';
import SSASRequest from '../../src/models/request.model';
import Signal from '../../src/models/signal.model';
import Vessel from '../../src/models/vessel.model';
import { EmailSenderService } from '../../src/services/email-sender.service';
import { ReportService } from '../../src/services/report.service';

const noopEmailSender = {
  sendEmail: jest.fn(),
  sendConfirmation: jest.fn(),
  testConnection: jest.fn().mockResolvedValue({ success: true }),
  onModuleInit: jest.fn(),
};

describe('Request & Signal integration (sqlite)', () => {
  let app: INestApplication;
  let sequelize: Sequelize;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SequelizeModule.forRoot({
          dialect: 'sqlite',
          storage: ':memory:',
          autoLoadModels: true,
          synchronize: true,
          logging: false,
          models: [SSASRequest, Signal, Vessel],
        }),
        RequestModule,
        SignalModule,
      ],
    })
      .overrideProvider(EmailSenderService)
      .useValue(noopEmailSender)
      .overrideProvider(ReportService)
      .useClass(ReportService)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    sequelize = app.get<Sequelize>(getConnectionToken());
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates request, approves it and links incoming TEST signal to generate regulatory PDF', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/requests')
      .send({
        vessel_name: 'M/V TESTER',
        mmsi: '273123456',
        owner_organization: 'ФГБУ «Морспасслужба»',
        contact_person: 'Иванов И.И.',
        contact_phone: '+7 (495) 123-45-67',
        contact_email: 'owner@example.com',
        planned_test_date: '2025-10-01T08:00:00Z',
      })
      .expect(201);

    expect(createResponse.body.success).toBe(true);
    const requestId = String(createResponse.body.data.id || createResponse.body.data.request_id);

    await request(app.getHttpServer())
      .put(`/requests/${requestId}/status`)
      .send({ status: 'APPROVED' })
      .expect(200);

    const signalResponse = await request(app.getHttpServer())
      .post('/signals')
      .send({
        signal_type: 'TEST',
        terminal_number: 'TST-9001',
        mmsi: '273123456',
        is_test: true,
      })
      .expect(201);

    expect(signalResponse.body.mmsi).toBe('273123456');

    const signalId = signalResponse.body.id || signalResponse.body.data?.id;
    const reportResponse = await request(app.getHttpServer())
      .post(`/signals/generate-report/${signalId}`)
      .expect(201);

    expect(typeof reportResponse.body).toBe('string');
    expect(reportResponse.body).toContain('uploads/reports/');
  });
});
