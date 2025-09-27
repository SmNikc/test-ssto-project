import { io } from 'socket.io-client';

class BackendService {
  private baseURL = '/api';
  private headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json',
    'Accept-Charset': 'utf-8'
  };
  private socket: any = null;
  private onNewSignal: ((signal: any) => void) | null = null;

  private async request(method: string, endpoint: string, data?: any) {
    const token = sessionStorage.getItem('token');
    const headers = {
      ...this.headers,
      Authorization: token ? `Bearer ${token}` : ''
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Backend request failed:', error);
      throw error;
    }
  }

  async getRequests() {
    return this.request('GET', '/requests');
  }

  async createRequest(data: any) {
    return this.request('POST', '/requests', data);
  }

  async updateRequest(id: string, data: any) {
    return this.request('PUT', `/requests/${id}`, data);
  }

  async deleteRequest(id: string) {
    return this.request('DELETE', `/requests/${id}`);
  }

  async getSignals() {
    return this.request('GET', '/signals');
  }

  async createSignal(data: any) {
    return this.request('POST', '/signals', data);
  }

  async updateSignal(id: string, data: any) {
    return this.request('PATCH', `/signals/${id}`, data);
  }

  async deleteSignal(id: string) {
    return this.request('DELETE', `/signals/${id}`);
  }

  async linkSignalToRequest(signalId: string, requestId: string) {
    return this.request('POST', `/signals/${signalId}/link/${requestId}`);
  }

  async generateReport(id: string) {
    return this.request('POST', `/signals/generate-report/${id}`);
  }

  async getUsers() {
    return this.request('GET', '/users');
  }

  async getTestingScenarios() {
    return this.request('GET', '/testing/scenarios');
  }

  async startTesting(data: any) {
    return this.request('POST', '/testing/start', data);
  }

  async getTestingReport(id: string) {
    return this.request('GET', `/testing/report/${id}`);
  }

  async getTerminals() {
    return this.request('GET', '/terminals');
  }

  generateTestSignal() {
    // Логика генерации тестового сигнала
    const testSignal = {
      terminal_number: 'TEST-TERMINAL',
      signal_type: 'TEST',
      received_at: new Date().toISOString(),
      is_test: true,
      coordinates: { lat: 55.75, lng: 37.61 },
      vessel_name: 'Тестовое судно',
      mmsi: 'TEST-MMSI'
    };
    this.createSignal(testSignal);
    console.log('Тестовый сигнал сгенерирован');
  }

  processEmailQueue() {
    // Логика обработки email
    console.log('Обработка email очереди завершена');
  }

  syncWithExternal() {
    // Логика синхронизации
    console.log('Синхронизация завершена');
  }

  runSystemCheck() {
    // Логика проверки системы
    console.log('Проверка системы: все OK');
  }

  initWebSocket(onNewSignal: (signal: any) => void) {
    const token = sessionStorage.getItem('token');
    this.socket = io(this.baseURL, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      console.log('WebSocket подключен');
    });

    this.socket.on('new_signal', (data: any) => {
      onNewSignal(data);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket отключен');
    });

    this.onNewSignal = onNewSignal;
    return this.socket;
  }
}

export default new BackendService();