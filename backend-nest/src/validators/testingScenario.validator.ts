
export interface ScenarioPayload {
  scenario_id: string;
  description?: string;
  expected_result?: string;
  [key: string]: unknown;
}

export function validateScenario(
  payload: Partial<ScenarioPayload>,
): string[] {
  const errors: string[] = [];
  if (!payload.scenario_id || String(payload.scenario_id).trim().length === 0) {
    errors.push('scenario_id обязателен.');
  }
  if (payload.description && String(payload.description).length > 1000) {
    errors.push('description слишком длинное (макс. 1000).');
  }
  if (
    payload.expected_result &&
    String(payload.expected_result).length > 1000
  ) {
    errors.push('expected_result слишком длинное (макс. 1000).');
  }
  return errors;
}
