export type ScenarioPayload = {
  scenario_id: string;
  description?: string;
  expected_result?: string;
  status?: 'draft' | 'running' | 'completed' | 'failed';
};

export function validateScenario(payload: Partial<ScenarioPayload>): string[] {
  const errors: string[] = [];
  if (!payload.scenario_id || String(payload.scenario_id).trim().length === 0) {
    errors.push('scenario_id обязателен.');
  }
  if (payload.status && !['draft', 'running', 'completed', 'failed'].includes(payload.status)) {
    errors.push('status может быть только draft|running|completed|failed.');
  }
  return errors;
}
