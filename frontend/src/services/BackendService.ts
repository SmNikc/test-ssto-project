// frontend/src/services/BackendService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';

// Поддерживаем все известные варианты имени события на случай различий между бэкендами
const SOCKET_SIGNAL_EVENTS = ['signal', 'new_signal', 'new-signal', 'signal:new'];

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
    return (await res.text()) as unknown as T;
  } finally {
    clearTimeout(t);
  }
}

export const BackendService = {
  // HEALTH: фронт дергает /api/health, прокси мапит на /health бэка
  getHealth(): Promise<{ status: string }> {
    return request<{ status: string }>(`${API_BASE}/health`, { method: 'GET' });
  },

  // --------------------------
  // СИГНАЛЫ
  // --------------------------
  getSignals(params?: Query) {
    return request<any>(`${API_BASE}/signals${buildQuery(params)}`, { method: 'GET' });
  },
  getSignalStatistics(params?: Query) {
    return request<any>(`${API_BASE}/signals/statistics${buildQuery(params)}`, { method: 'GET' });
  },
  createSignal(payload: Record<string, any>) {
    return request<any>(`${API_BASE}/signals`, { method: 'POST', body: JSON.stringify(payload) });
  },
  updateSignal(id: string, payload: Record<string, any>) {
    return request<any>(`${API_BASE}/signals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteSignal(id: string) {
    return request<any>(`${API_BASE}/signals/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
  linkSignalToRequest(signalId: string, requestId: string) {
    return request<any>(
      `${API_BASE}/signals/${encodeURIComponent(signalId)}/link/${encodeURIComponent(requestId)}`,
      { method: 'POST' }
    );
  },
  generateSignalReport(id: string) {
    return request<any>(`${API_BASE}/signals/generate-report/${encodeURIComponent(id)}`, { method: 'POST' });
  },

  // --------------------------
  // ЗАЯВКИ
  // --------------------------
  getRequests(params?: Query) {
    return request<any>(`${API_BASE}/requests${buildQuery(params)}`, { method: 'GET' });
  },
  getRequest(id: string) {
    return request<any>(`${API_BASE}/requests/${encodeURIComponent(id)}`, { method: 'GET' });
  },
  createRequest(payload: Record<string, any>) {
    return request<any>(`${API_BASE}/requests`, { method: 'POST', body: JSON.stringify(payload) });
  },

  // --------------------------
  // ТЕРМИНАЛЫ
  // --------------------------
  getTerminals(params?: Query) {
    return request<any>(`${API_BASE}/terminals${buildQuery(params)}`, { method: 'GET' });
  },
  createTerminal(payload: Record<string, any>) {
    return request<any>(`${API_BASE}/terminals`, { method: 'POST', body: JSON.stringify(payload) });
  },
  updateTerminal(id: string, payload: Record<string, any>) {
    return request<any>(`${API_BASE}/terminals/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  deleteTerminal(id: string) {
    return request<any>(`${API_BASE}/terminals/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  // --------------------------
  // PDF
  // --------------------------
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

  // --------------------------
  // EMAIL / УВЕДОМЛЕНИЯ
  // --------------------------
  // Письмо/уведомление (MailHog проверяется на бэке)
  sendNotificationEmail(payload: { to: string; subject: string; body: string }) {
    return request<any>(`${API_BASE}/notifications/email`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // --------------------------
  // АВТОРИЗАЦИЯ
  // --------------------------
  login(email: string, password: string) {
    return request<any>(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<any>(`${API_BASE}/auth/logout`, { method: 'POST' });
  },

  // --------------------------
  // SOCKET.IO
  // --------------------------
  createSocket(extra?: Parameters<typeof io>[1]): Socket {
    return io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      ...extra,
    });
  },
  initWebSocket(onSignal?: (payload: any) => void, extra?: Parameters<typeof io>[1]): Socket {
    const socket = this.createSocket(extra);
    if (onSignal) {
      SOCKET_SIGNAL_EVENTS.forEach((evt) => {
        socket.on(evt, onSignal);
      });
    }
    return socket;
  },
  disconnectSocket(sock?: Socket) {
    const s = sock as Socket | undefined;
    if (s && s.connected) s.disconnect();
  },

  // --------------------------
  // ДОП. ДЕЙСТВИЯ / ТАСКИ
  // --------------------------
  async generateTestSignal(payload?: Record<string, any>) {
    const defaults = {
      terminal_number: 'TEST-TERMINAL',
      signal_type: 'TEST',
      received_at: new Date().toISOString(),
      is_test: true,
      vessel_name: 'Тестовое судно',
      mmsi: '000000000',
    };
    // Основной путь — через создание сигнала (как в main), затем fallback на /testing/simulate (как в feature-ветке)
    try {
      return await this.createSignal({ ...defaults, ...(payload || {}) });
    } catch (primaryError) {
      console.warn('generateTestSignal via createSignal failed, trying /testing/simulate', primaryError);
      try {
        return await request<any>(`${API_BASE}/testing/simulate`, {
          method: 'POST',
          body: JSON.stringify({ ...defaults, ...(payload || {}) }),
        });
      } catch (fallbackError) {
        console.error('generateTestSignal fallback failed', fallbackError);
        throw fallbackError;
      }
    }
  },

  async processEmailQueue() {
    try {
      return await request<any>(`${API_BASE}/tasks/email/process`, { method: 'POST' });
    } catch (error) {
      console.warn('processEmailQueue endpoint unavailable, using stub.', error);
      return { success: false, message: 'Email queue processing not available in this build.' };
    }
  },

  async syncWithExternal() {
    try {
      return await request<any>(`${API_BASE}/tasks/integration/sync`, { method: 'POST' });
    } catch (error) {
      console.warn('syncWithExternal endpoint unavailable, using stub.', error);
      return { success: false, message: 'External sync not available in this build.' };
    }
  },

  async runSystemCheck() {
    try {
      return await request<any>(`${API_BASE}/tasks/system/check`, { method: 'POST' });
    } catch (error) {
      console.warn('runSystemCheck endpoint unavailable, using stub.', error);
      return { success: false, message: 'System check not available in this build.' };
    }
  },
};

export default BackendService;
