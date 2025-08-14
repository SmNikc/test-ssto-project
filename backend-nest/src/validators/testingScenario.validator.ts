export type ScenarioPayload = {
  name: string;
  description?: string;
  steps?: Array<{ code: string; params?: Record<string, unknown> }>;
  active?: boolean;
};
type Options = { partial?: boolean };
export function validateScenarioPayload(
  payload: ScenarioPayload,
  options: Options = {},
): { valid: boolean; errors?: string[] } {
  const errors: string[] = [];
  const partial = !!options.partial;
  if (!partial) {
    if (!payload || typeof payload !== 'object') errors.push('payload must be object');
    if (!payload.name || typeof payload.name !== 'string') errors.push('name is required');
  } else {
    if (payload && 'name' in payload && typeof payload.name !== 'string') {
      errors.push('name must be string');
    }
  }
  if (payload?.steps && !Array.isArray(payload.steps)) {
    errors.push('steps must be array');
  }
  return { valid: errors.length === 0, errors };
}
