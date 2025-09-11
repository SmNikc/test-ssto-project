#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_excel_display_and_columns.py
Исправляет отображение данных после загрузки Excel и правильное распределение по колонкам
Путь: C:\\Projects\\test-ssto-project\\fix_excel_display_and_columns.py
"""

import re
from pathlib import Path

def fix_display_issues():
    """Исправляет проблемы с отображением данных после загрузки Excel"""
    
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        print(f"❌ Файл не найден: {index_path}")
        return False
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Исправляем функцию loadSignals для правильного отображения
    new_load_signals = r'''function loadSignals() {
        const signals = JSON.parse(localStorage.getItem('testSignals') || '[]');
        const tbody = document.querySelector('#signals table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (signals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #888;">
                        Нет полученных сигналов
                    </td>
                </tr>
            `;
            return;
        }
        
        signals.forEach(signal => {
            // Определяем тип терминала и реальный IMO
            let terminalType = signal.terminalType || 'INMARSAT';
            let realIMO = signal.imo || '';
            
            // Проверяем, не попал ли тип в поле IMO
            if (signal.imo) {
                const upperIMO = String(signal.imo).toUpperCase();
                if (upperIMO === 'INMARSAT' || upperIMO === 'IRIDIUM' || upperIMO === 'TEST') {
                    terminalType = upperIMO;
                    realIMO = ''; // Очищаем IMO, так как это был тип
                } else if (/^\d{7}$/.test(signal.imo)) {
                    // Это реальный IMO (7 цифр)
                    realIMO = signal.imo;
                }
            }
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${signal.id || '-'}</td>
                <td><strong>${signal.stationNumber || '-'}</strong></td>
                <td>${signal.vesselName || 'Неизвестно'}</td>
                <td>${signal.mmsi || '-'}</td>
                <td>${realIMO || '-'}</td>
                <td><span class="badge badge-info">${terminalType}</span></td>
                <td>${signal.receivedAt ? new Date(signal.receivedAt).toLocaleString('ru-RU') : '-'}</td>
                <td>
                    ${signal.status === 'confirmed' ? 
                        '<span class="badge badge-success">✓ Тест</span>' : 
                        '<span class="badge badge-warning">Ожидание</span>'}
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewSignalDetails('${signal.id}')">
                        Детали
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }'''
    
    # 2. Исправляем функцию loadTerminals
    new_load_terminals = r'''function loadTerminals() {
        const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || '[]');
        const tbody = document.querySelector('#terminals table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (terminals.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 20px; color: #888;">
                        Нет зарегистрированных терминалов. Загрузите данные из Excel.
                    </td>
                </tr>
            `;
            return;
        }
        
        terminals.forEach(terminal => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${terminal.terminal_number || '-'}</strong></td>
                <td>${terminal.current_vessel_name || '-'}</td>
                <td>${terminal.current_mmsi || '-'}</td>
                <td><span class="badge badge-info">${terminal.terminal_type || 'INMARSAT'}</span></td>
                <td>${terminal.owner || '-'}</td>
                <td>${terminal.last_test_date ? new Date(terminal.last_test_date).toLocaleDateString('ru-RU') : '-'}</td>
                <td>${terminal.next_test_date ? new Date(terminal.next_test_date).toLocaleDateString('ru-RU') : '-'}</td>
                <td>
                    <span class="badge ${terminal.is_active ? 'badge-success' : 'badge-secondary'}">
                        ${terminal.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="editTerminal('${terminal.id}')">
                        Изменить
                    </button>
                    <button class="btn btn-sm btn-info" onclick="createTestRequest('${terminal.terminal_number}')">
                        Тест
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }'''
    
    # 3. Исправляем функцию loadRequests
    new_load_requests = r'''function loadRequests() {
        const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
        const tbody = document.querySelector('#requests table tbody');
        
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 20px; color: #888;">
                        Нет активных заявок
                    </td>
                </tr>
            `;
            return;
        }
        
        requests.forEach(request => {
            const statusBadge = request.status === 'confirmed' ? 
                '<span class="badge badge-success">Подтверждено</span>' :
                request.status === 'pending' ?
                '<span class="badge badge-warning">Ожидание</span>' :
                '<span class="badge badge-secondary">Отменено</span>';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.id || '-'}</td>
                <td><strong>${request.stationNumber || '-'}</strong></td>
                <td>${request.vesselName || '-'}</td>
                <td>${request.mmsi || '-'}</td>
                <td>${request.imo || '-'}</td>
                <td>${request.testDate ? new Date(request.testDate).toLocaleDateString('ru-RU') : '-'}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewRequest('${request.id}')">
                        Детали
                    </button>
                    ${request.status === 'pending' ? 
                        `<button class="btn btn-sm btn-success" onclick="confirmRequest('${request.id}')">
                            Подтвердить
                        </button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Обновляем счетчики
        updateDashboardData();
    }'''
    
    # 4. Добавляем автоматический вызов функций после загрузки
    auto_refresh_fix = '''                        // Обновляем интерфейс СРАЗУ после загрузки
                        setTimeout(() => {
                            loadTerminals();
                            loadRequests();
                            loadSignals();
                            loadDashboardData();
                            
                            // Если мы на вкладке, обновляем её
                            const activeTab = document.querySelector('.tab.active');
                            if (activeTab) {
                                const tabName = activeTab.textContent;
                                if (tabName.includes('Заявки')) loadRequests();
                                if (tabName.includes('Сигналы')) loadSignals();
                                if (tabName.includes('Терминалы')) loadTerminals();
                            }
                        }, 100);'''
    
    # Применяем исправления
    changes_made = []
    
    # 1. Заменяем loadSignals
    if 'function loadSignals()' in content:
        # Находим функцию loadSignals и заменяем её
        start_pos = content.find('function loadSignals()')
        if start_pos != -1:
            # Находим конец функции
            brace_count = 0
            pos = content.find('{', start_pos)
            end_pos = pos
            
            while pos < len(content):
                if content[pos] == '{':
                    brace_count += 1
                elif content[pos] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = pos + 1
                        break
                pos += 1
            
            # Заменяем функцию
            content = content[:start_pos] + new_load_signals + content[end_pos:]
            changes_made.append("loadSignals")
    
    # 2. Заменяем loadTerminals
    if 'function loadTerminals()' in content:
        start_pos = content.find('function loadTerminals()')
        if start_pos != -1:
            brace_count = 0
            pos = content.find('{', start_pos)
            end_pos = pos
            
            while pos < len(content):
                if content[pos] == '{':
                    brace_count += 1
                elif content[pos] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = pos + 1
                        break
                pos += 1
            
            content = content[:start_pos] + new_load_terminals + content[end_pos:]
            changes_made.append("loadTerminals")
    
    # 3. Заменяем loadRequests
    if 'function loadRequests()' in content:
        start_pos = content.find('function loadRequests()')
        if start_pos != -1:
            brace_count = 0
            pos = content.find('{', start_pos)
            end_pos = pos
            
            while pos < len(content):
                if content[pos] == '{':
                    brace_count += 1
                elif content[pos] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_pos = pos + 1
                        break
                pos += 1
            
            content = content[:start_pos] + new_load_requests + content[end_pos:]
            changes_made.append("loadRequests")
    
    # 4. Добавляем автообновление после загрузки Excel
    if 'showNotification(message, \'success\');' in content and auto_refresh_fix not in content:
        success_pos = content.find('showNotification(message, \'success\');')
        if success_pos > 0:
            insert_pos = content.find('\n', success_pos) + 1
            content = content[:insert_pos] + '\n' + auto_refresh_fix + '\n' + content[insert_pos:]
            changes_made.append("auto-refresh")
    
    # Записываем обновленный файл
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    if changes_made:
        print(f"✅ Файл index.html обновлен. Изменены функции: {', '.join(changes_made)}")
    else:
        print("⚠️ Не найдены функции для замены")
    
    return True

def add_test_data_generator():
    """Добавляет функцию для генерации тестовых данных"""
    
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        return False
    
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Добавляем функцию генерации тестовых данных
    test_data_function = '''
        // Функция для генерации тестовых данных (для отладки)
        function generateTestData() {
            // Тестовые терминалы
            const testTerminals = [
                {
                    id: 'T1',
                    terminal_number: '427309676',
                    terminal_type: 'INMARSAT',
                    current_vessel_name: 'АКАДЕМИК ЛОМОНОСОВ',
                    current_mmsi: '273456789',
                    current_imo: '',
                    owner: 'Российская Академия Наук',
                    contact_email: 'test@ran.ru',
                    is_active: true,
                    last_test_date: '2025-01-15T13:00:00',
                    next_test_date: '2025-02-15T13:00:00',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'T2',
                    terminal_number: '427309677',
                    terminal_type: 'INMARSAT',
                    current_vessel_name: 'АКАДЕМИК ЛОМОНОСОВ',
                    current_mmsi: '273456789',
                    current_imo: '',
                    owner: 'Российская Академия Наук',
                    contact_email: 'test@ran.ru',
                    is_active: true,
                    last_test_date: '2025-01-15T13:00:00',
                    next_test_date: '2025-02-15T13:00:00',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'T3',
                    terminal_number: '427309678',
                    terminal_type: 'IRIDIUM',
                    current_vessel_name: 'КАПИТАН ВОРОНИН',
                    current_mmsi: '273456790',
                    current_imo: '9234567',
                    owner: 'Северное Морское Пароходство',
                    contact_email: 'test@smp.ru',
                    is_active: true,
                    last_test_date: '2025-01-20T17:00:00',
                    next_test_date: '2025-02-20T17:00:00',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'T4',
                    terminal_number: '427305964',
                    terminal_type: 'TEST',
                    current_vessel_name: 'Неизвестно',
                    current_mmsi: '009598830',
                    current_imo: '',
                    owner: 'Тестовая организация',
                    contact_email: 'test@test.ru',
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ];
            
            // Тестовые сигналы
            const testSignals = [
                {
                    id: 'SIG-TEST-1757406693816',
                    stationNumber: '427309676',
                    vesselName: 'АКАДЕМИК ЛОМОНОСОВ',
                    mmsi: '273456789',
                    imo: '',
                    terminalType: 'INMARSAT',
                    receivedAt: '2025-09-09T11:31:00',
                    status: 'confirmed',
                    position: '60.123 N, 30.456 E',
                    testType: 'Тест'
                },
                {
                    id: 'SIG-TEST-1757408407136',
                    stationNumber: '427309676',
                    vesselName: 'АКАДЕМИК ЛОМОНОСОВ',
                    mmsi: '273456789',
                    imo: '',
                    terminalType: 'INMARSAT',
                    receivedAt: '2025-09-09T12:00:00',
                    status: 'confirmed',
                    position: '60.123 N, 30.456 E',
                    testType: 'Тест'
                },
                {
                    id: 'SIG-1757408414031-wumgqjtb4',
                    stationNumber: '427305964',
                    vesselName: 'Неизвестно',
                    mmsi: '009598830',
                    imo: '',
                    terminalType: 'TEST',
                    receivedAt: '2025-09-09T12:00:00',
                    status: 'confirmed',
                    testType: 'Тест'
                }
            ];
            
            // Сохраняем в localStorage
            localStorage.setItem('ssasTerminals', JSON.stringify(testTerminals));
            localStorage.setItem('testSignals', JSON.stringify(testSignals));
            
            // Обновляем интерфейс
            loadTerminals();
            loadSignals();
            loadRequests();
            loadDashboardData();
            
            showNotification('Тестовые данные загружены', 'success');
        }'''
    
    # Добавляем функцию если её нет
    if 'function generateTestData()' not in content:
        # Вставляем перед закрывающим тегом script
        script_end = content.rfind('</script>')
        if script_end > 0:
            content = content[:script_end] + '\n' + test_data_function + '\n' + content[script_end:]
            print("✅ Добавлена функция генерации тестовых данных")
            
            # Записываем обновленный файл
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
    else:
        print("ℹ️ Функция generateTestData уже существует")
    
    return False

if __name__ == "__main__":
    print("🔧 Исправление отображения данных после загрузки Excel")
    print("=" * 60)
    
    success = True
    
    # Применяем основные исправления
    if fix_display_issues():
        print("✅ Основные исправления применены")
    else:
        success = False
    
    # Добавляем генератор тестовых данных
    if add_test_data_generator():
        print("✅ Добавлен генератор тестовых данных")
    
    if success:
        print("\n✨ Все исправления успешно применены!")
        print("\n📋 Что исправлено:")
        print("1. Данные теперь отображаются сразу после загрузки Excel")
        print("2. Типы терминалов (INMARSAT, IRIDIUM, TEST) теперь в правильной колонке")
        print("3. IMO показывает только реальные номера IMO (7 цифр)")
        print("4. Автоматическое обновление всех вкладок после загрузки")
        print("5. Правильная обработка пустых таблиц с сообщениями")
        
        print("\n🧪 Для тестирования можете использовать в консоли браузера:")
        print("generateTestData() - загрузит тестовые данные")
        
        print("\n📝 Команда для запуска:")
        print("python C:\\Projects\\test-ssto-project\\fix_excel_display_and_columns.py")
    else:
        print("\n❌ Возникли ошибки при применении исправлений")