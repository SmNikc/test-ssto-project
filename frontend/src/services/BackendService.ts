// frontend/src/services/BackendService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

const API_BASE =
  // @ts-ignore
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

type Query = Record<string, string | number | boolean | undefined | null>;

function buildQuery(params?: Query): string {
  if (!params) return '';
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

async function request<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), init?.timeoutMs ?? 30000);

  try {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      signal: controller.signal,
      ...init,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
    }

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return (await res.json()) as T;
    // @ts-expect-error допускаем T=unknown для не-JSON
    return (await res.text()) as T;
  } finally {
    clearTimeout(t);
  }
}

export const BackendService = {
  // HEALTH: фронт дергает /api/health, прокси мапит на /health бэка
  getHealth(): Promise<{ status: string }> {
    return request<{ status: string }>(`${API_BASE}/health`, { method: 'GET' });
  },

  // Заявки
  getRequests(params?: Query) {
    return request<any>(`${API_BASE}/requests${buildQuery(params)}`, { method: 'GET' });
  },
  getRequest(id: string) {
    return request<any>(`${API_BASE}/requests/${encodeURIComponent(id)}`, { method: 'GET' });
  },
  createRequest(payload: Record<string, any>) {
    return request<any>(`${API_BASE}/requests`, { method: 'POST', body: JSON.stringify(payload) });
  },

  // PDF (по заявке)
  async getRequestPdf(id: string): Promise<ArrayBuffer> {
    const res = await fetch(`${API_BASE}/requests/${encodeURIComponent(id)}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.arrayBuffer();
  },

  // Общая генерация PDF (по любому пути)
  async generatePdf(path: string, payload: Record<string, any>): Promise<ArrayBuffer> {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.arrayBuffer();
  },

  // Письмо/уведомление (MailHog проверяется на бэке)
  sendNotificationEmail(payload: { to: string; subject: string; body: string }) {
    return request<any>(`${API_BASE}/notifications/email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Auth
  login(email: string, password: string) {
    return request<any>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<any>(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  // Socket.IO
  createSocket(extra?: Parameters<typeof io>[1]): Socket {
    return io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      ...extra,
    });
  },
  disconnectSocket(sock?: Socket) {
    const s = sock as Socket | undefined;
    if (s && s.connected) s.disconnect();
  },
};
