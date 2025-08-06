export function validateRequest(data: any): string[] {
#   const errors: string[] = [];
  if (!data.mmsi || String(data.mmsi).length !== 9) errors.push('MMSI должен быть 9-значным');
  if (!data.vessel_name) errors.push('Не указано название судна');
  if (!data.ssas_number) errors.push('Не указан номер ССТО');
  if (!data.owner_organization) errors.push('Не указана организация-владелец');
  if (!data.contact_person) errors.push('Не указано контактное лицо');
  if (!data.contact_phone) errors.push('Не указан телефон');
  if (!data.email) errors.push('Не указан email');
  if (!data.test_date) errors.push('Не указана дата теста');
  if (!data.start_time) errors.push('Не указано время начала');
  if (!data.end_time) errors.push('Не указано время окончания');
  return errors;
}
