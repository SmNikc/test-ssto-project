import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateRequestDto } from '../../src/dto/request.dto';

describe('CreateRequestDto validation', () => {
  const valid = {
    mmsi: '273123456',
    vessel_name: 'M/V TESTER',
    owner_organization: 'Test Shipping LLC',
    contact_person: 'Иванов Иван',
    email: 'owner@example.com',
    phone: '+7 (999) 123-45-67',
    test_date: '2025-09-25',
    start_time: '10:00',
    end_time: '14:00',
  };

  it('accepts valid payload', async () => {
    const dto = plainToInstance(CreateRequestDto, valid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects MMSI that is not 9 digits', async () => {
    const dto = plainToInstance(CreateRequestDto, { ...valid, mmsi: '123' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'mmsi')).toBe(true);
  });

  it('requires valid email', async () => {
    const dto = plainToInstance(CreateRequestDto, { ...valid, email: 'invalid' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('validates time window format HH:MM', async () => {
    const dto = plainToInstance(CreateRequestDto, { ...valid, start_time: '99:00' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'start_time')).toBe(true);
  });
});
