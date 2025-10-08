import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRequestDto } from '../../src/dto/request.dto';

describe('CreateRequestDto validation', () => {
  const buildDto = (overrides: Partial<CreateRequestDto> = {}) =>
    plainToInstance(CreateRequestDto, {
      mmsi: '273123456',
      vessel_name: 'M/V TESTER',
      owner_organization: 'ФГБУ «Морспасслужба»',
      contact_person: 'Иванов И.И.',
      email: 'owner@example.com',
      phone: '+7 (495) 123-45-67',
      test_date: '2025-10-01',
      start_time: '10:00',
      end_time: '11:00',
      ...overrides,
    });

  it('rejects MMSI that does not contain exactly 9 digits (Приказ №115, приложение 5)', async () => {
    const dto = buildDto({ mmsi: '12345' });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('mmsi');
  });

  it('rejects invalid IMO-like MMSI with letters', async () => {
    const dto = buildDto({ mmsi: '27312A456' as any });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('mmsi');
  });

  it('rejects invalid email format (ПП РФ №746, п. 19)', async () => {
    const dto = buildDto({ email: 'invalid-email' });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('email');
  });

  it('rejects time outside HH:MM window', async () => {
    const dto = buildDto({ start_time: '25:00' });
    const errors = await validate(dto);
    expect(errors.map((e) => e.property)).toContain('start_time');
  });

  it('passes validation for fully compliant payload', async () => {
    const dto = buildDto();
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
