// backend-nest/src/app.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AppService implements OnModuleInit {
  private requests = [];
  private signals = [];
  private terminals = [];
  private reports = [];
  private requestIdCounter = 1;
  private signalIdCounter = 1;
  private terminalIdCounter = 1;
  private reportIdCounter = 1;

  // Инициализация при старте модуля
  onModuleInit() {
    this.initTestData();
    console.log('✅ Test data initialized: terminals, requests, signals');
  }

  getHello(): string {
    return 'ССТО Backend API v1.0';
  }

  // Заявки
  getRequests() {
    return this.requests;
  }

  createRequest(data: any) {
    const request = {
      id: this.requestIdCounter++,
      ...data,
      status: data.status || 'pending',
      created_at: new Date().toISOString()
    };
    this.requests.push(request);
    return request;
  }

  updateRequest(id: string, data: any) {
    const index = this.requests.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
      this.requests[index] = { ...this.requests[index], ...data };
      return this.requests[index];
    }
    return null;
  }

  deleteRequest(id: string) {
    const index = this.requests.findIndex(r => r.id === parseInt(id));
    if (index !== -1) {
      const deleted = this.requests[index];
      this.requests.splice(index, 1);
      return deleted;
    }
    return null;
  }

  // Сигналы
  getSignals() {
    return this.signals;
  }

  getSignalStatistics() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: this.signals.length,
      today: this.signals.filter(s => new Date(s.received_at) >= startOfDay).length,
      thisMonth: this.signals.filter(s => new Date(s.received_at) >= startOfMonth).length,
      byType: {
        TEST: this.signals.filter(s => s.signal_type === 'TEST').length,
        DISTRESS: this.signals.filter(s => s.signal_type === 'DISTRESS').length,
        REAL_ALERT: this.signals.filter(s => s.signal_type === 'REAL_ALERT').length,
        SSAS_TEST: this.signals.filter(s => s.signal_type === 'SSAS_TEST').length
      },
      byStatus: {
        active: this.signals.filter(s => s.status === 'active').length,
        completed: this.signals.filter(s => s.status === 'completed').length,
        pending: this.signals.filter(s => s.status === 'pending').length
      },
      recentSignals: this.signals.slice(-5).reverse()
    };
  }

  createSignal(data: any) {
    const signal = {
      id: this.signalIdCounter++,
      ...data,
      status: data.status || 'active',
      received_at: new Date().toISOString()
    };
    this.signals.push(signal);
    return signal;
  }

  updateSignal(id: string, data: any) {
    const index = this.signals.findIndex(s => s.id === parseInt(id));
    if (index !== -1) {
      this.signals[index] = { ...this.signals[index], ...data };
      return this.signals[index];
    }
    return null;
  }

  deleteSignal(id: string) {
    const index = this.signals.findIndex(s => s.id === parseInt(id));
    if (index !== -1) {
      const deleted = this.signals[index];
      this.signals.splice(index, 1);
      return deleted;
    }
    return null;
  }

  // Терминалы
  getTerminals() {
    return this.terminals;
  }

  createTerminal(data: any) {
    const terminal = {
      id: this.terminalIdCounter++,
      terminal_number: data.terminal_number,
      vessel_name: data.vessel_name,
      mmsi: data.mmsi,
      imo: data.imo,
      owner_organization: data.owner_organization,
      last_test: data.last_test || null,
      status: data.status || 'active',
      created_at: new Date().toISOString()
    };
    this.terminals.push(terminal);
    return terminal;
  }

  updateTerminal(id: string, data: any) {
    const index = this.terminals.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      this.terminals[index] = { ...this.terminals[index], ...data };
      return this.terminals[index];
    }
    return null;
  }

  deleteTerminal(id: string) {
    const index = this.terminals.findIndex(t => t.id === parseInt(id));
    if (index !== -1) {
      const deleted = this.terminals[index];
      this.terminals.splice(index, 1);
      return deleted;
    }
    return null;
  }

  // Отчеты
  getReports() {
    return this.reports;
  }

  generateReport(requestId: string) {
    const request = this.requests.find(r => r.id === parseInt(requestId));
    if (!request) {
      return { error: 'Request not found' };
    }

    const report = {
      id: this.reportIdCounter++,
      request_id: request.id,
      vessel_name: request.vessel_name,
      mmsi: request.mmsi,
      test_date: request.planned_test_date,
      status: 'completed',
      generated_at: new Date().toISOString()
    };
    
    this.reports.push(report);
    return report;
  }

  // Симуляция теста
  simulateTest(data: any) {
    // Создаем тестовый сигнал
    const testSignal = {
      id: this.signalIdCounter++,
      terminal_number: data.terminal_number || 'TEST-001',
      signal_type: data.testType || 'SSAS_TEST',
      vessel_name: data.vesselName,
      mmsi: data.mmsi,
      imo: data.imo,
      test_date: data.testDate,
      coordinates: {
        lat: 55.7558 + (Math.random() - 0.5) * 0.1,
        lng: 37.6173 + (Math.random() - 0.5) * 0.1
      },
      status: 'active',
      is_test: true,
      received_at: new Date().toISOString()
    };

    this.signals.push(testSignal);
    
    return {
      success: true,
      testId: testSignal.id,
      message: 'Test signal generated successfully',
      signal: testSignal
    };
  }

  // Инициализация тестовых данных
  private initTestData() {
    // Тестовые терминалы
    this.terminals = [
      {
        id: 1,
        terminal_number: 'SSTO-001',
        vessel_name: 'Капитан Иванов',
        mmsi: '273123456',
        imo: '9123456',
        owner_organization: 'Тестовая организация',
        last_test: '2024-09-20',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        terminal_number: 'SSTO-002',
        vessel_name: 'Адмирал Макаров',
        mmsi: '273234567',
        imo: '9234567',
        owner_organization: 'Тестовая организация',
        last_test: '2024-09-15',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        terminal_number: 'SSTO-003',
        vessel_name: 'Северная Звезда',
        mmsi: '273345678',
        imo: '9345678',
        owner_organization: 'test.com123',
        last_test: null,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
    this.terminalIdCounter = 4;

    // Тестовые заявки
    this.requests = [
      {
        id: 1,
        terminal_number: 'SSTO-001',
        vessel_name: 'Капитан Иванов',
        mmsi: '273123456',
        imo: '9123456',
        planned_test_date: '2024-09-25',
        status: 'approved',
        owner_organization: 'Тестовая организация',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        terminal_number: 'SSTO-003',
        vessel_name: 'Северная Звезда',
        mmsi: '273345678',
        imo: '9345678',
        planned_test_date: '2024-09-30',
        status: 'pending',
        owner_organization: 'test.com123',
        created_at: new Date().toISOString()
      }
    ];
    this.requestIdCounter = 3;

    // Тестовые сигналы
    this.signals = [
      {
        id: 1,
        terminal_number: 'SSTO-001',
        signal_type: 'TEST',
        vessel_name: 'Капитан Иванов',
        mmsi: '273123456',
        coordinates: { lat: 55.7558, lng: 37.6173 },
        status: 'completed',
        is_test: true,
        received_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    this.signalIdCounter = 2;
  }
}