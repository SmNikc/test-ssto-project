#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Применение решения GROK с интеграцией backend и исправлением кодировки
Путь: C:\Projects\test-ssto-project\apply_grok_backend.py
"""

import shutil
from pathlib import Path
from datetime import datetime
import re

def fix_encoding_and_apply():
    """Исправляет кодировку и применяет решение GROK с backend интеграцией"""
    
    # Пути к файлам
    project_dir = Path(r'C:\Projects\test-ssto-project\frontend-static')
    current_file = project_dir / 'index_fixed.html'
    
    print("=" * 70)
    print("ПРИМЕНЕНИЕ РЕШЕНИЯ GROK С BACKEND ИНТЕГРАЦИЕЙ")
    print("=" * 70)
    
    # 1. Создаем резервную копию
    if current_file.exists():
        backup_name = f"index_fixed.html.backup_before_backend_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        backup_file = project_dir / backup_name
        shutil.copy2(current_file, backup_file)
        print(f"✅ Создана резервная копия: {backup_name}")
    
    # 2. Создаем исправленный HTML с backend интеграцией
    print("\n📝 Создание файла с backend интеграцией...")
    
    html_content = '''<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Модуль Тест ССТО</title>
    <link rel="stylesheet" href="https://unpkg.com/openlayers@7.3.0/dist/ol.css">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { display: flex; justify-content: space-between; align-items: center; position: relative; }
        .logo { font-size: 24px; }
        .logo span { font-weight: bold; }
        .actions { display: flex; gap: 10px; align-items: center; }
        
        /* Индикатор статуса API */
        #api-status { 
            font-size: 20px; 
            margin-right: 10px;
            cursor: help;
            transition: color 0.3s;
        }
        
        .btn { padding: 8px 16px; border: none; cursor: pointer; border-radius: 4px; }
        .btn-primary { background: #007bff; color: white; }
        .btn-secondary { background: #6c757d; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn-sm { padding: 4px 8px; font-size: 0.875em; }
        
        nav { margin: 20px 0; }
        .tab { padding: 10px 20px; margin-right: 5px; background: #f0f0f0; cursor: pointer; border-radius: 4px 4px 0 0; }
        .tab.active { background: white; border: 1px solid #ddd; border-bottom: none; }
        .content { display: none; padding: 20px; border: 1px solid #ddd; border-radius: 0 4px 4px 4px; }
        .content.active { display: block; }
        
        .stats { display: flex; gap: 20px; }
        .stat { flex: 1; padding: 20px; background: #f8f9fa; border-radius: 4px; }
        .stat h3 { margin: 0 0 10px; }
        .stat p { font-size: 24px; margin: 0; }
        .stat small { display: block; color: #6c757d; }
        
        .status { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .quick-actions { display: flex; gap: 10px; margin-top: 20px; }
        
        form { display: grid; gap: 15px; }
        input, select { padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
        th { background: #f0f0f0; }
        
        #map { height: 400px; }
        
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; }
        .status-active { background: #d4edda; color: #155724; }
        .status-inactive { background: #f8d7da; color: #721c24; }
        .status-tested { background: #c7f3c7; color: #0d5f0d; }
        .status-pending { background: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                🚢 <span>МОДУЛЬ ТЕСТ ССТО</span>
                <div style="font-size: 14px; color: #6c757d;">Система управления тестированием ССТО</div>
            </div>
            <div class="actions">
                <span id="api-status" title="Статус подключения">●</span>
                <button class="btn btn-primary" onclick="uploadExcel()">📊 Загрузить Excel</button>
                <button class="btn btn-secondary" onclick="configureEmail()">✉️ Настройки Email</button>
                <button class="btn btn-secondary" onclick="syncWithBackend()">🔄 Синхронизация</button>
            </div>
        </header>
        
        <nav>
            <button class="tab active" data-tab="dashboard">📊 Главная</button>
            <button class="tab" data-tab="new-request">➕ Новая заявка</button>
            <button class="tab" data-tab="requests">📋 Заявки</button>
            <button class="tab" data-tab="signals">📡 Сигналы</button>
            <button class="tab" data-tab="terminals">🖥️ Терминалы</button>
            <button class="tab" data-tab="map">🗺️ Карта</button>
            <button class="tab" data-tab="reports">📈 Отчёты</button>
        </nav>
        
        <div id="dashboard" class="content active">
            <div class="stats">
                <div class="stat">
                    <h3>АКТИВНЫЕ ЗАЯВКИ</h3>
                    <p id="active-requests">0</p>
                    <small>↑ +2 за сегодня</small>
                </div>
                <div class="stat">
                    <h3>ОЖИДАЮТ ПОДТВЕРЖДЕНИЯ</h3>
                    <p id="pending-confirm">0</p>
                    <small>Требуют внимания</small>
                </div>
                <div class="stat">
                    <h3>ПОДТВЕРЖДЕНО</h3>
                    <p id="confirmed">0</p>
                    <small>↑ +5 за неделю</small>
                </div>
                <div class="stat">
                    <h3>ВСЕГО СИГНАЛОВ</h3>
                    <p id="total-signals">0</p>
                    <small>За текущий месяц</small>
                </div>
            </div>
            
            <div class="status">
                <h3>Статус автоподтверждения</h3>
                <p>Режим: <span id="auto-confirm-status">ОТКЛЮЧЕН</span></p>
                <button class="btn btn-primary" onclick="toggleAutoConfirm()">Изменить режим</button>
            </div>
            
            <div class="quick-actions">
                <button class="btn btn-primary" onclick="processEmailQueue()">📧 Обработать email очередь</button>
                <button class="btn btn-primary" onclick="syncSearchSea()">🔄 Синхронизация с Поиск-Море</button>
                <button class="btn btn-primary" onclick="generateTestData()">🎲 Генерировать тестовые данные</button>
                <button class="btn btn-primary" onclick="systemCheck()">🏥 Проверка системы</button>
            </div>
        </div>
        
        <div id="new-request" class="content">
            <h2>Создание новой заявки на тестирование ССТО</h2>
            <form id="new-request-form">
                <div>
                    <label>⚠️ НОМЕР СТОЙКИ ССТО (ГЛАВНЫЙ ИДЕНТИФИКАТОР) *</label>
                    <small>КРИТИЧЕСКИ ВАЖНО: Уникальный номер терминала</small>
                    <input type="text" id="terminal-number" required>
                </div>
                <div>
                    <label>Тип спутниковой связи *</label>
                    <select id="sat-type" required>
                        <option>ИНМАРСАТ</option>
                        <option>ИРИДИУМ</option>
                    </select>
                </div>
                <div>
                    <label>Название судна *</label>
                    <input type="text" id="vessel-name" required>
                </div>
                <div>
                    <label>MMSI *</label>
                    <input type="text" id="mmsi" required>
                </div>
                <div>
                    <label>IMO</label>
                    <input type="text" id="imo">
                </div>
                <div>
                    <label>Судовладелец *</label>
                    <input type="text" id="owner" required>
                </div>
                <div>
                    <label>Email *</label>
                    <input type="email" id="email" required>
                </div>
                <div>
                    <label>Дата теста *</label>
                    <input type="date" id="test-date" required>
                </div>
                <div>
                    <label>Время теста</label>
                    <input type="time" id="test-time">
                </div>
                <button type="submit" class="btn btn-primary">Создать заявку</button>
            </form>
        </div>
        
        <div id="requests" class="content">
            <h2>Список заявок на тестирование</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Номер стойки</th>
                        <th>Судно</th>
                        <th>MMSI</th>
                        <th>IMO</th>
                        <th>Дата теста</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="requests-tbody">
                    <tr><td colspan="8" style="text-align: center;">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
        
        <div id="signals" class="content">
            <h2>Полученные сигналы ССТО</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Номер стойки</th>
                        <th>Судно</th>
                        <th>MMSI</th>
                        <th>IMO</th>
                        <th>Тип</th>
                        <th>Время получения</th>
                        <th>Тест/Тревога</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="signals-tbody">
                    <tr><td colspan="9" style="text-align: center;">Загрузка...</td></tr>
                </tbody>
            </table>
        </div>
        
        <div id="terminals" class="content">
            <h2>База данных терминалов ССТО</h2>
            <div style="margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="addTerminal()">➕ Добавить терминал</button>
                <button class="btn btn-secondary" onclick="exportTerminalsCSV()">📥 Экспорт в CSV</button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Номер стойки</th>
                        <th>Судно</th>
                        <th>MMSI</th>
                        <th>Тип связи</th>
                        <th>Владелец</th>
                        <th>Последний тест</th>
                        <th>Следующий тест</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody id="terminals-tbody">
                    <tr><td colspan="9" style="text-align: center;">Нет данных</td></tr>
                </tbody>
            </table>
        </div>
        
        <div id="map" class="content">
            <h2>Карта сигналов ССТО</h2>
            <div id="map-container" style="height: 400px; border: 1px solid #ddd;"></div>
            <div style="margin-top: 10px;">
                <button class="btn btn-primary" onclick="showAllSignals()">🎯 Показать все</button>
                <button class="btn btn-secondary" onclick="measureDistance()">📏 Измерить</button>
                <button class="btn btn-secondary" onclick="takeScreenshot()">📷 Скриншот</button>
                <button class="btn btn-secondary" onclick="clearMap()">🗑️ Очистить</button>
            </div>
        </div>
        
        <div id="reports" class="content">
            <h2>Генерация отчётов</h2>
            <div style="margin-bottom: 20px;">
                <label>Тип отчёта</label>
                <select id="report-type">
                    <option>Суточный</option>
                    <option>Недельный</option>
                    <option>Месячный</option>
                    <option>Произвольный период</option>
                </select>
            </div>
            <div id="report-period" style="display: none;">
                <label>Начало периода</label>
                <input type="date" id="report-start">
                <label>Конец периода</label>
                <input type="date" id="report-end">
            </div>
            <button class="btn btn-primary" onclick="generateReport()">📊 Генерировать отчёт</button>
            <button class="btn btn-secondary" onclick="exportPDF()">📄 Экспорт в PDF</button>
        </div>
    </div>
    
    <script src="https://unpkg.com/openlayers@7.3.0/dist/ol.js"></script>
    <script src="https://unpkg.com/xlsx@latest/dist/xlsx.full.min.js"></script>
    <script>
        // ===================== Backend API класс =====================
        class BackendAPI {
            constructor() {
                this.baseURL = 'http://localhost:3001';
                this.headers = {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                };
                this.isOnline = false;
            }
            
            async request(method, endpoint, data = null) {
                try {
                    const url = this.baseURL + endpoint;
                    console.log(`API ${method} ${url}`, data);
                    
                    const response = await fetch(url, {
                        method,
                        headers: this.headers,
                        body: data ? JSON.stringify(data) : null
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }
                    
                    const result = await response.json();
                    this.setOnlineStatus(true);
                    return result;
                } catch (error) {
                    console.error('API Error:', error);
                    this.setOnlineStatus(false);
                    // Fallback на LocalStorage
                    return this.fallbackToLocalStorage(method, endpoint, data);
                }
            }
            
            setOnlineStatus(isOnline) {
                this.isOnline = isOnline;
                const indicator = document.getElementById('api-status');
                if (indicator) {
                    if (isOnline) {
                        indicator.style.color = 'green';
                        indicator.title = 'Backend подключен';
                    } else {
                        indicator.style.color = 'orange';
                        indicator.title = 'Работа в офлайн режиме';
                    }
                }
            }
            
            fallbackToLocalStorage(method, endpoint, data) {
                console.log('Fallback to LocalStorage:', method, endpoint);
                
                // Определяем ключ для localStorage
                const parts = endpoint.split('/').filter(p => p);
                const entity = parts[0]; // 'requests', 'signals', 'terminals'
                const id = parts[1];
                
                const storageKey = `ssto_${entity}`;
                let store = JSON.parse(localStorage.getItem(storageKey) || '[]');
                
                if (method === 'GET') {
                    if (id) {
                        // Получение одного элемента
                        return store.find(item => item.id == id) || null;
                    }
                    // Получение всех элементов
                    return store;
                    
                } else if (method === 'POST') {
                    // Создание нового элемента
                    const newItem = {
                        ...data,
                        id: `${entity.toUpperCase()}-${Date.now()}`,
                        created_at: new Date().toISOString()
                    };
                    store.push(newItem);
                    localStorage.setItem(storageKey, JSON.stringify(store));
                    return newItem;
                    
                } else if (method === 'PUT' || method === 'PATCH') {
                    // Обновление элемента
                    const index = store.findIndex(item => item.id == id);
                    if (index !== -1) {
                        store[index] = { ...store[index], ...data };
                        localStorage.setItem(storageKey, JSON.stringify(store));
                        return store[index];
                    }
                    return null;
                    
                } else if (method === 'DELETE') {
                    // Удаление элемента
                    store = store.filter(item => item.id != id);
                    localStorage.setItem(storageKey, JSON.stringify(store));
                    return { success: true };
                }
                
                return null;
            }
        }

        // Создаем глобальный экземпляр API
        const api = new BackendAPI();

        // ===================== Переключение вкладок =====================
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.tab[data-tab]');
            if (!btn) return;
            e.preventDefault();
            
            const targetId = btn.dataset.tab;
            
            // Скрыть все вкладки
            document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
            // Показать выбранную
            const target = document.getElementById(targetId);
            if (target) target.classList.add('active');
            
            // Обновить активную кнопку
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            
            // Инициализация карты при переходе
            if (targetId === 'map' && !window.mapInitialized) {
                setTimeout(initMap, 100);
                window.mapInitialized = true;
            }
        });

        // ===================== Загрузка данных =====================
        async function loadDashboard() {
            try {
                const requests = await api.request('GET', '/requests');
                const signals = await api.request('GET', '/signals');
                
                document.getElementById('active-requests').textContent = requests.length;
                document.getElementById('pending-confirm').textContent = 
                    requests.filter(r => r.status === 'pending').length;
                document.getElementById('confirmed').textContent = 
                    requests.filter(r => r.status === 'confirmed').length;
                document.getElementById('total-signals').textContent = signals.length;
                
                const autoConfirm = localStorage.getItem('autoConfirm') === 'true';
                document.getElementById('auto-confirm-status').textContent = 
                    autoConfirm ? 'ВКЛЮЧЕН' : 'ОТКЛЮЧЕН';
            } catch (error) {
                console.error('Dashboard load error:', error);
            }
        }

        async function loadRequests() {
            try {
                const data = await api.request('GET', '/requests');
                const tbody = document.getElementById('requests-tbody');
                
                if (!tbody) return;
                
                tbody.innerHTML = '';
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Нет заявок</td></tr>';
                    return;
                }
                
                data.forEach(req => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${req.id}</td>
                        <td>${req.terminal_number || ''}</td>
                        <td>${req.vessel_name || ''}</td>
                        <td>${req.mmsi || ''}</td>
                        <td>${req.imo_number || ''}</td>
                        <td>${req.planned_test_date || ''}</td>
                        <td><span class="status-badge status-${req.status || 'pending'}">${(req.status || 'pending').toUpperCase()}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="confirmRequest('${req.id}')">Подтвердить</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } catch (error) {
                console.error('Requests load error:', error);
            }
        }

        async function loadSignals() {
            try {
                const data = await api.request('GET', '/signals');
                const tbody = document.getElementById('signals-tbody');
                
                if (!tbody) return;
                
                tbody.innerHTML = '';
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Нет сигналов</td></tr>';
                    return;
                }
                
                data.forEach(sig => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${sig.signal_number || sig.id}</td>
                        <td>${sig.terminal_number || ''}</td>
                        <td>${sig.vessel_name || ''}</td>
                        <td>${sig.mmsi || ''}</td>
                        <td>${sig.imo_number || ''}</td>
                        <td>${sig.signal_type || ''}</td>
                        <td>${sig.received_at || ''}</td>
                        <td>${sig.is_test ? 'Тест' : 'Тревога'}</td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="matchSignal('${sig.id}')">Сопоставить</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            } catch (error) {
                console.error('Signals load error:', error);
            }
        }

        async function loadTerminals() {
            // Пока используем LocalStorage для терминалов
            const terminals = JSON.parse(localStorage.getItem('ssto_terminals') || '[]');
            const tbody = document.getElementById('terminals-tbody');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (terminals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Нет терминалов</td></tr>';
                return;
            }
            
            terminals.forEach(terminal => {
                let status = 'Активен';
                if (terminal.status === 'inactive') status = 'Неактивен';
                if (terminal.status === 'tested') status = 'Протестирован';
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${terminal.terminal_number || ''}</td>
                    <td>${terminal.vessel_name || ''}</td>
                    <td>${terminal.mmsi || ''}</td>
                    <td>${terminal.type || 'ИНМАРСАТ'}</td>
                    <td>${terminal.owner || ''}</td>
                    <td>${terminal.lastTest || ''}</td>
                    <td>${terminal.nextTest || ''}</td>
                    <td><span class="status-badge status-${terminal.status}">${status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewTerminal('${terminal.id}')">Просмотр</button>
                        <button class="btn btn-success btn-sm" onclick="testTerminal('${terminal.terminal_number}')">Тест</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }

        // ===================== Обработчики форм =====================
        document.getElementById('new-request-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const requestData = {
                terminal_number: document.getElementById('terminal-number').value,
                vessel_name: document.getElementById('vessel-name').value,
                mmsi: document.getElementById('mmsi').value,
                imo_number: document.getElementById('imo').value,
                owner_name: document.getElementById('owner').value,
                owner_email: document.getElementById('email').value,
                planned_test_date: document.getElementById('test-date').value,
                status: 'pending'
            };
            
            try {
                await api.request('POST', '/requests', requestData);
                alert('Заявка создана успешно!');
                e.target.reset();
                loadRequests();
                loadDashboard();
            } catch (error) {
                alert('Ошибка при создании заявки');
                console.error(error);
            }
        });

        // ===================== Функции действий =====================
        async function confirmRequest(id) {
            try {
                await api.request('PATCH', `/requests/${id}`, { status: 'confirmed' });
                loadRequests();
                loadDashboard();
            } catch (error) {
                console.error('Confirm error:', error);
            }
        }

        async function testTerminal(terminalNumber) {
            const signal = {
                terminal_number: terminalNumber,
                signal_type: 'TEST',
                received_at: new Date().toISOString(),
                is_test: true
            };
            
            try {
                await api.request('POST', '/signals', signal);
                alert('Тестовый сигнал отправлен!');
                loadSignals();
                loadDashboard();
            } catch (error) {
                console.error('Test signal error:', error);
            }
        }

        function generateTestData() {
            const testData = {
                requests: [
                    {
                        id: 'REQ-' + Date.now(),
                        terminal_number: 'TERM001',
                        vessel_name: 'Тестовое судно',
                        mmsi: '123456789',
                        imo_number: '9876543',
                        owner_name: 'Тестовый владелец',
                        owner_email: 'test@example.com',
                        planned_test_date: new Date().toISOString().split('T')[0],
                        status: 'pending'
                    }
                ],
                signals: [
                    {
                        id: 'SIG-' + Date.now(),
                        signal_number: 'SIG001',
                        terminal_number: 'TERM001',
                        vessel_name: 'Тестовое судно',
                        mmsi: '123456789',
                        signal_type: 'TEST',
                        received_at: new Date().toISOString(),
                        is_test: true
                    }
                ]
            };
            
            // Сохраняем в localStorage
            localStorage.setItem('ssto_requests', JSON.stringify(testData.requests));
            localStorage.setItem('ssto_signals', JSON.stringify(testData.signals));
            
            alert('Тестовые данные сгенерированы!');
            loadDashboard();
            loadRequests();
            loadSignals();
        }

        async function syncWithBackend() {
            alert('Синхронизация с backend...');
            await checkBackendStatus();
            await loadDashboard();
            await loadRequests();
            await loadSignals();
        }

        // ===================== Проверка статуса backend =====================
        async function checkBackendStatus() {
            try {
                const response = await fetch('http://localhost:3001/health');
                const data = await response.json();
                
                if (data.status === 'ok') {
                    api.setOnlineStatus(true);
                    console.log('Backend connected:', data);
                } else {
                    api.setOnlineStatus(false);
                }
            } catch (error) {
                api.setOnlineStatus(false);
                console.log('Backend offline, using LocalStorage');
            }
        }

        // ===================== Заглушки =====================
        function toggleAutoConfirm() {
            const current = localStorage.getItem('autoConfirm') === 'true';
            localStorage.setItem('autoConfirm', !current);
            loadDashboard();
        }

        function uploadExcel() { alert('Загрузка Excel в разработке'); }
        function configureEmail() { alert('Настройки email в разработке'); }
        function processEmailQueue() { alert('Обработка email очереди в разработке'); }
        function syncSearchSea() { alert('Синхронизация с Поиск-Море в разработке'); }
        function systemCheck() { alert('Проверка системы в разработке'); }
        function addTerminal() { alert('Добавление терминала в разработке'); }
        function exportTerminalsCSV() { alert('Экспорт в CSV в разработке'); }
        function viewTerminal(id) { alert(`Просмотр терминала ${id} в разработке`); }
        function matchSignal(id) { alert(`Сопоставление сигнала ${id} в разработке`); }
        function showAllSignals() { alert('Показать все сигналы на карте в разработке'); }
        function measureDistance() { alert('Измерение расстояния в разработке'); }
        function takeScreenshot() { alert('Скриншот карты в разработке'); }
        function clearMap() { alert('Очистка карты в разработке'); }
        function generateReport() { alert('Генерация отчёта в разработке'); }
        function exportPDF() { alert('Экспорт в PDF в разработке'); }

        // ===================== Карта OpenLayers =====================
        let olMap;
        function initMap() {
            if (!olMap && document.getElementById('map-container')) {
                olMap = new ol.Map({
                    target: 'map-container',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM()
                        })
                    ],
                    view: new ol.View({
                        center: ol.proj.fromLonLat([37.6173, 55.7558]),
                        zoom: 4
                    })
                });
            }
        }

        // ===================== Инициализация при загрузке =====================
        document.addEventListener('DOMContentLoaded', async () => {
            // Проверяем статус backend
            await checkBackendStatus();
            
            // Загружаем данные
            await loadDashboard();
            await loadRequests();
            await loadSignals();
            await loadTerminals();
            
            // Проверяем статус каждые 30 секунд
            setInterval(checkBackendStatus, 30000);
            
            // Обработчик для типа отчёта
            document.getElementById('report-type').addEventListener('change', (e) => {
                document.getElementById('report-period').style.display = 
                    e.target.value === 'Произвольный период' ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>'''
    
    # Создаем новый файл с backend интеграцией
    backend_file = project_dir / 'index_backend.html'
    backend_file.write_text(html_content, encoding='utf-8')
    print(f"✅ Создан файл: index_backend.html")
    
    # 3. Инструкции
    print("\n" + "=" * 70)
    print("ГОТОВО! Созданы файлы:")
    print(f"1. index_fixed.html - базовая версия")
    print(f"2. index_backend.html - с интеграцией backend")
    
    print("\n" + "=" * 70)
    print("КАК ТЕСТИРОВАТЬ:")
    print("\n1. Запустите backend:")
    print("   cd C:\\Projects\\test-ssto-project\\backend-nest")
    print("   npm run start:dev")
    print("\n2. Откройте в браузере:")
    print("   C:\\Projects\\test-ssto-project\\frontend-static\\index_backend.html")
    print("\n3. Проверьте индикатор статуса API:")
    print("   🟢 Зеленый = Backend работает")
    print("   🟠 Оранжевый = Офлайн режим (LocalStorage)")
    print("\n4. Тестируйте функции:")
    print("   - Создание заявки")
    print("   - Генерация тестовых данных")
    print("   - Синхронизация")
    
    return True

if __name__ == "__main__":
    fix_encoding_and_apply()