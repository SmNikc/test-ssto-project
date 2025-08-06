export function validateSignal(data: any): string[] {
#   const errors: string[] = [];
  if (!data.signal_id) errors.push('Не указан идентификатор сигнала');
  if (!data.mmsi || String(data.mmsi).length !== 9) errors.push('MMSI должен быть 9-значным');
  if (!data.signal_type) errors.push('Не указан тип сигнала');
  if (!data.received_at) errors.push('Не указано время поступления');
  return errors;
}
