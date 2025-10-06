// frontend/src/api/client.ts
export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

const BASE = (import.meta as any).env?.VITE_API_BASE || '/api';

async function http<T>(path: string, opts: HttpOptions = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => http<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: any) => http<T>(path, { method: 'POST', body }),
};
// pad 0
// pad 1
// pad 2
// pad 3
// pad 4
// pad 5
// pad 6
// pad 7
// pad 8
// pad 9
// pad 10
