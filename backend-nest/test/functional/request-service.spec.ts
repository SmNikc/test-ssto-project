import { BadRequestException } from '@nestjs/common';
import { RequestService, RequestStatus } from '../../src/request/request.service';

class InMemoryRequestModel {
  private sequence = 1;
  private readonly store = new Map<number, any>();

  async create(data: any) {
    const id = this.sequence++;
    const record: any = {
      id,
      ...data,
      status: data.status ?? 'pending',
      save: async () => record,
      destroy: async () => {
        this.store.delete(id);
      },
      toJSON: () => ({ ...record }),
      getDataValue: (key: string) => (record as any)[key],
    };
    this.store.set(id, record);
    return record;
  }

  async findByPk(id: string | number) {
    return this.store.get(Number(id)) ?? null;
  }

  async update(patch: any, options: { where: { id: string } }) {
    const id = Number(options.where.id);
    const existing = this.store.get(id);
    if (!existing) return [0];
    Object.assign(existing, patch);
    return [1];
  }

  async findAll() {
    return Array.from(this.store.values());
  }
}

const BASE_REQUEST = {
  vessel_name: 'M/V TESTER',
  mmsi: '273123456',
  ship_owner: 'ООО «ТестФлот»',
  contact_person: 'Иван Петров',
  contact_phone: '+7 (495) 000-00-00',
  contact_email: 'owner@example.com',
};

describe('RequestService – бизнес и негативные сценарии', () => {
  const createService = () => new RequestService(new InMemoryRequestModel() as any);

  it('отклоняет создание заявки без MMSI (Приказ Минтранса №115, п. 24)', async () => {
    const service = createService();
    await expect(
      service.create({ ...BASE_REQUEST, mmsi: undefined as unknown as string }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('нормализует статус заявки в pending при создании', async () => {
    const service = createService();
    const created = await service.create({
      ...BASE_REQUEST,
      status: RequestStatus.APPROVED,
    });

    expect(created.status).toBe('approved');
  });

  it('блокирует переход pending → COMPLETED без утверждения (Приказ №115, п. 31)', async () => {
    const service = createService();
    const created = await service.create(BASE_REQUEST);

    await expect(
      service.transitionStatus(String(created.id), RequestStatus.COMPLETED),
    ).rejects.toThrow('Cannot transition');
  });
});
