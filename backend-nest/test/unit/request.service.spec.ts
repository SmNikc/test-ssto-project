import { BadRequestException } from '@nestjs/common';
import SSASRequest from '../../src/models/request.model';
import { RequestService, RequestStatus } from '../../src/request/request.service';

describe('RequestService', () => {
  const createMockModel = () => {
    const dataStore: any[] = [];
    return {
      findAll: jest.fn().mockResolvedValue(dataStore),
      findByPk: jest.fn(async (id: string) => dataStore.find((item) => String(item.id) === String(id)) ?? null),
      create: jest.fn(async (payload: any) => {
        const id = dataStore.length + 1;
        const row = { id, save: jest.fn().mockResolvedValue(undefined), destroy: jest.fn().mockResolvedValue(undefined), ...payload };
        dataStore.push(row);
        return row;
      }),
      update: jest.fn(async (payload: any, options: any) => {
        const target = dataStore.find((item) => String(item.id) === String(options?.where?.id));
        if (target) Object.assign(target, payload);
        return [target ? 1 : 0];
      }),
      destroy: jest.fn(),
    } as unknown as typeof SSASRequest;
  };

  it('throws BadRequest when required MMSI is missing', async () => {
    const service = new RequestService(createMockModel());

    await expect(
      service.create({ vessel_name: 'Test Vessel' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalises status to persistence enum mapping on create', async () => {
    const repo = createMockModel();
    const service = new RequestService(repo);

    const created = await service.create({
      mmsi: '273123456',
      vessel_name: 'Tester',
      status: RequestStatus.APPROVED,
    } as any);

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    expect(created.status).toBe('approved');
  });

  it('prevents illegal status transitions (Приказ №115, п. 2.5)', async () => {
    const repo = createMockModel();
    const service = new RequestService(repo);
    const created = await service.create({ mmsi: '273123456', vessel_name: 'Tester' } as any);
    const badTransition = service.transitionStatus(String(created.id), RequestStatus.COMPLETED);
    await expect(badTransition).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updateStatus persists normalized values', async () => {
    const repo = createMockModel();
    const service = new RequestService(repo);
    const created = await service.create({ mmsi: '273123456', vessel_name: 'Tester' } as any);
    await service.updateStatus(String(created.id), RequestStatus.APPROVED);
    const stored = await service.findOne(String(created.id));
    expect(stored.status).toBe('approved');
  });
});
