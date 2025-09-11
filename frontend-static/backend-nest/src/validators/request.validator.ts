import { BadRequestException } from '@nestjs/common';

export type RequestPayload = {
  mmsi: string;
  vessel_name: string;
  ssas_number: string;
  test_datetime: string; // ISO
  port?: string;
  contact_name?: string;
  contact_phone?: string;
  email?: string;
  notes?: string;
};

function isIsoDate(s?: string) {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function isMmsi(s?: string) {
  return !!s && /^\d{9}$/.test(s);
}

function isEmail(s?: string) {
  if (!s) return false;
  // достаточно простой валидатор почты
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export function validateRequest(payload: Partial<RequestPayload>) {
  const errors: string[] = [];

  if (!isMmsi(payload.mmsi)) errors.push('MMSI должен быть 9-значным.');
  if (!payload.vessel_name) errors.push('Не указано название судна.');
  if (!payload.ssas_number) errors.push('Не указан номер ССТО.');
  if (!isIsoDate(payload.test_datetime)) errors.push('Некорректная дата/время теста.');
  if (payload.email && !isEmail(payload.email)) errors.push('Некорректный e-mail.');

  return errors;
}

export function assertValidRequest(payload: Partial<RequestPayload>) {
  const errors = validateRequest(payload);
  if (errors.length) {
    throw new BadRequestException({ message: 'Ошибка валидации заявки', errors });
  }
}
