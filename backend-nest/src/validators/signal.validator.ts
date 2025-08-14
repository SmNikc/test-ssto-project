import { BadRequestException } from '@nestjs/common';

export type SignalPayload = {
  signal_id: string;     // строка
  mmsi: string;          // 9 цифр
  signal_type: 'test' | 'alert' | 'unscheduled';
  received_at: string;   // ISO
  source?: 'manual' | 'external';
  status?: 'NEW' | 'ACK' | 'RESOLVED';
  request_id?: number | null;
};

function isIsoDate(s?: string) {
  if (!s) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function isMmsi(s?: string) {
  return !!s && /^\d{9}$/.test(s);
}

export function validateSignal(payload: Partial<SignalPayload>) {
  const errors: string[] = [];
  if (!payload.signal_id) errors.push('Не указан идентификатор сигнала (signal_id).');
  if (!isMmsi(payload.mmsi)) errors.push('MMSI должен быть 9-значным.');
  if (!payload.signal_type) errors.push('Не указан тип сигнала.');
  if (!isIsoDate(payload.received_at)) errors.push('Не указано или некорректно время поступления.');
  return errors;
}

export function assertValidSignal(payload: Partial<SignalPayload>) {
  const errors = validateSignal(payload);
  if (errors.length) {
    throw new BadRequestException({ message: 'Ошибка валидации сигнала', errors });
  }
}
