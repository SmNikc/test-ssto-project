#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для добавления ВСЕХ недостающих функций дашборда
Путь для сохранения: C:\Projects\test-ssto-project\fix_all_dashboard_functions.py
"""

import re
import os
from datetime import datetime

def fix_all_dashboard_functions():
    """Добавляет все недостающие функции для работы дашборда"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    # Читаем файл
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Создаем резервную копию
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Резервная копия: {backup_path}")
    
    # Находим место для вставки функций - после определения app или перед закрывающим </script>
    insert_position = None
    
    # Пробуем найти конец определения app
    app_pattern = r'const app = \{[^}]*\};\s*'
    app_match = re.search(app_pattern, content)
    
    if app_match:
        insert_position = app_match.end()
        print("✅ Найдено определение app, добавляем функции после него")
    else:
        # Ищем первый закрывающий </script>
        script_pattern = r'<script[^>]*>(?:(?!</script>).)*'
        script_matches = list(re.finditer(script_pattern + r'</script>', content, re.DOTALL))
        if script_matches:
            # Берем последний основной блок скриптов
            last_script = script_matches[-1]
            insert_position = last_script.end() - len('</script>')
            print("✅ Найден блок скриптов, добавляем функции в конец")
    
    if not insert_position:
        print("❌ Не удалось найти место для вставки функций")
        return
    
    # Все необходимые функции дашборда
    dashboard_functions = """

// ============= ФУНКЦИИ ДАШБОРДА И ОБНОВЛЕНИЯ ДАННЫХ =============

// Основная функция обновления дашборда
function loadDashboard() {
    console.log('📊 Обновление дашборда...');
    
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const signals = JSON.parse(localStorage.getItem('signals') || '[]');
    const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || localStorage.getItem('terminals') || localStorage.getItem('vessels') || '[]');
    
    // Обновляем счетчики на главной странице
    const totalRequestsEl = document.getElementById('total-requests');
    const pendingRequestsEl = document.getElementById('pending-requests');
    const confirmedRequestsEl = document.getElementById('confirmed-requests');
    const totalSignalsEl = document.getElementById('total-signals');
    
    if (totalRequestsEl) {
        totalRequestsEl.textContent = requests.length;
    }
    if (pendingRequestsEl) {
        pendingRequestsEl.textContent = requests.filter(r => r.status === 'pending').length;
    }
    if (confirmedRequestsEl) {
        confirmedRequestsEl.textContent = requests.filter(r => r.status === 'confirmed').length;
    }
    if (totalSignalsEl) {
        totalSignalsEl.textContent = signals.length;
    }
    
    console.log(`📈 Статистика: Заявки=${requests.length}, Ожидают=${requests.filter(r => r.status === 'pending').length}, Подтверждено=${requests.filter(r => r.status === 'confirmed').length}, Сигналы=${signals.length}`);
}

// Алиас для совместимости с разными версиями
function updateDashboardData() {
    console.log('🔄 updateDashboardData вызвана, перенаправляем на loadDashboard');
    loadDashboard();
}

// Еще один алиас для совместимости
function updateStats() {
    console.log('📊 updateStats вызвана, перенаправляем на loadDashboard');
    loadDashboard();
}

// Функция загрузки заявок в таблицу
function loadRequests() {
    console.log('📋 Загрузка заявок...');
    
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const tbody = document.getElementById('requests-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Нет заявок</td></tr>';
        } else {
            requests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.id || 'N/A'}</td>
                    <td>${request.stationNumber || ''}</td>
                    <td>${request.vesselName || ''}</td>
                    <td>${request.mmsi || ''}</td>
                    <td>${request.testDate || ''}</td>
                    <td><span class="status-badge">${request.status || 'pending'}</span></td>
                    <td><button class="btn btn-sm" onclick="viewRequest('${request.id}')">Просмотр</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Обновляем дашборд после загрузки заявок
    loadDashboard();
}

// Функция загрузки сигналов в таблицу
function loadSignals() {
    console.log('📡 Загрузка сигналов...');
    
    const signals = JSON.parse(localStorage.getItem('signals') || '[]');
    const tbody = document.getElementById('signals-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (signals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Нет сигналов</td></tr>';
        } else {
            signals.forEach(signal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${signal.id || 'N/A'}</td>
                    <td>${signal.stationNumber || ''}</td>
                    <td>${signal.vesselName || ''}</td>
                    <td>${signal.mmsi || ''}</td>
                    <td>${signal.receivedAt || signal.positionTime || ''}</td>
                    <td>${signal.signalType || signal.type || ''}</td>
                    <td><span class="status-badge">${signal.status || 'new'}</span></td>
                    <td><button class="btn btn-sm" onclick="viewSignal('${signal.id}')">Просмотр</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Обновляем дашборд после загрузки сигналов
    loadDashboard();
}

// Функция загрузки терминалов в таблицу
function loadTerminals() {
    console.log('🚢 Загрузка терминалов...');
    
    const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || localStorage.getItem('terminals') || localStorage.getItem('vessels') || '[]');
    const tbody = document.getElementById('terminals-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (terminals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Нет терминалов</td></tr>';
        } else {
            terminals.forEach(terminal => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${terminal.terminal_number || terminal.stationNumber || ''}</td>
                    <td>${terminal.vessel_name || terminal.vesselName || terminal.name || ''}</td>
                    <td>${terminal.mmsi || ''}</td>
                    <td>${terminal.terminal_type || terminal.terminalType || terminal.type || 'INMARSAT'}</td>
                    <td>${terminal.owner || ''}</td>
                    <td><span class="status-badge">${terminal.status || 'active'}</span></td>
                    <td><button class="btn btn-sm" onclick="viewTerminal('${terminal.id}')">Просмотр</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Обновляем дашборд после загрузки терминалов
    loadDashboard();
}

// Вспомогательные функции просмотра
function viewRequest(id) {
    console.log('Просмотр заявки:', id);
    // Здесь может быть модальное окно или переход на детальную страницу
}

function viewSignal(id) {
    console.log('Просмотр сигнала:', id);
    // Здесь может быть модальное окно или переход на детальную страницу
}

function viewTerminal(id) {
    console.log('Просмотр терминала:', id);
    // Здесь может быть модальное окно или переход на детальную страницу
}

// ============= КОНЕЦ ФУНКЦИЙ ДАШБОРДА =============

"""
    
    # Проверяем, какие функции уже есть
    existing_functions = []
    missing_functions = []
    
    functions_to_check = [
        'loadDashboard',
        'updateDashboardData',
        'updateStats',
        'loadRequests',
        'loadSignals',
        'loadTerminals'
    ]
    
    for func_name in functions_to_check:
        if f'function {func_name}' in content:
            existing_functions.append(func_name)
        else:
            missing_functions.append(func_name)
    
    print(f"\n📋 Анализ функций:")
    print(f"  ✅ Существующие: {existing_functions}")
    print(f"  ❌ Отсутствующие: {missing_functions}")
    
    if missing_functions:
        # Вставляем все функции
        content = content[:insert_position] + dashboard_functions + content[insert_position:]
        print(f"\n✅ Добавлены все недостающие функции дашборда")
    else:
        print(f"\n✅ Все функции уже существуют")
    
    # Сохраняем файл
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Файл сохранен: {file_path}")
    print("\n🎯 Что сделано:")
    print("  ✓ Добавлена функция loadDashboard()")
    print("  ✓ Добавлена функция updateDashboardData()")
    print("  ✓ Добавлена функция updateStats()")
    print("  ✓ Добавлена функция loadRequests()")
    print("  ✓ Добавлена функция loadSignals()")
    print("  ✓ Добавлена функция loadTerminals()")
    print("\n⚠️ Теперь обновите страницу (Ctrl+F5) и попробуйте загрузить Excel файл")

if __name__ == "__main__":
    fix_all_dashboard_functions()
    print("\n✨ Готово!")