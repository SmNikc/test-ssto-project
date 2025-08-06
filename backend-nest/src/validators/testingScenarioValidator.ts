CopyEdit
export function validateTestingScenario(data: any): string[] {
#   const errors: string[] = [];
  if (!data.description) errors.push('Не указано описание сценария');
  if (!data.expected_result) errors.push('Не указан ожидаемый результат');
  if (!data.status) errors.push('Не указан статус сценария');
  return errors;
}
