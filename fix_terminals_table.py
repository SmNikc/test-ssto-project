#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для исправления таблицы терминалов - правильный порядок колонок и русские статусы
Путь для сохранения: C:\Projects\test-ssto-project\fix_terminals_table.py
"""

import re
import os
from datetime import datetime

def fix_terminals_table():
    """Исправляет отображение таблицы терминалов"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    print("=" * 70)
    print("ИСПРАВЛЕНИЕ ТАБЛИЦЫ ТЕРМИНАЛОВ")
    print("=" * 70)
    
    # Создаем резервную копию
    backup_path = f"{file_path}.before_terminals_fix_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Читаем файл
    print("\n📖 Чтение файла...")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Сохраняем резервную копию
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Файл прочитан")
        print(f"   💾 Резервная копия: {os.path.basename(backup_path)}")
    except Exception as e:
        print(f"❌ ОШИБКА при чтении: {str(e)}")
        return False
    
    # 1. ИСПРАВЛЯЕМ ФУНКЦИЮ loadTerminals
    print("\n🔧 Исправление функции loadTerminals...")
    
    new_load_terminals = """function loadTerminals() {
    console.log('🚢 Загрузка терминалов...');
    
    const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || 
                                localStorage.getItem('terminals') || 
                                localStorage.getItem('vessels') || '[]');
    const tbody = document.getElementById('terminals-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (terminals.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Нет терминалов</td></tr>';
        } else {
            terminals.forEach(terminal => {
                // Определяем статус на русском
                let status = 'Активен';
                if (terminal.status === 'inactive') status = 'Неактивен';
                if (terminal.status === 'tested') status = 'Протестирован';
                if (terminal.status === 'pending') status = 'Ожидает теста';
                
                // Вычисляем следующий тест (последний тест + 1 год)
                let nextTestDate = '';
                if (terminal.lastTest || terminal.last_test) {
                    const lastDate = new Date(terminal.lastTest || terminal.last_test);
                    if (!isNaN(lastDate)) {
                        const nextDate = new Date(lastDate);
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        nextTestDate = nextDate.toISOString().split('T')[0];
                    }
                }
                
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${terminal.terminal_number || terminal.stationNumber || ''}</td>
                    <td>${terminal.vessel_name || terminal.vesselName || terminal.name || ''}</td>
                    <td>${terminal.mmsi || ''}</td>
                    <td>${terminal.terminal_type || terminal.terminalType || terminal.type || 'INMARSAT'}</td>
                    <td>${terminal.owner || terminal.shipOwner || ''}</td>
                    <td>${terminal.lastTest || terminal.last_test || ''}</td>
                    <td>${nextTestDate}</td>
                    <td><span class="status-badge status-${terminal.status || 'active'}">${status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewTerminal('${terminal.id || terminal.terminal_number}')">Просмотр</button>
                        <button class="btn btn-success btn-sm" onclick="testTerminal('${terminal.terminal_number}')">Тест</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    if (typeof loadDashboard !== 'undefined') loadDashboard();
}"""
    
    # Заменяем старую функцию
    old_func_pattern = r'function loadTerminals\(\)\s*\{[^}]*(?:\{[^}]*\}[^}]*)*\}'
    if re.search(old_func_pattern, content):
        content = re.sub(old_func_pattern, new_load_terminals, content)
        print("   ✅ Функция loadTerminals исправлена")
    
    # 2. ДОБАВЛЯЕМ ФУНКЦИЮ viewTerminal если её нет
    if 'function viewTerminal' not in content:
        print("\n🔧 Добавление функции viewTerminal...")
        
        view_terminal_func = """
// Функция просмотра терминала
function viewTerminal(terminalId) {
    const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || 
                                  localStorage.getItem('terminals') || '[]');
    const terminal = terminals.find(t => 
        t.id === terminalId || 
        t.terminal_number === terminalId ||
        t.stationNumber === terminalId
    );
    
    if (!terminal) {
        alert('Терминал не найден');
        return;
    }
    
    let nextTestDate = '';
    if (terminal.lastTest || terminal.last_test) {
        const lastDate = new Date(terminal.lastTest || terminal.last_test);
        if (!isNaN(lastDate)) {
            const nextDate = new Date(lastDate);
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            nextTestDate = nextDate.toLocaleDateString('ru-RU');
        }
    }
    
    const info = `ИНФОРМАЦИЯ О ТЕРМИНАЛЕ ССТО
    
Номер терминала: ${terminal.terminal_number || terminal.stationNumber || ''}
Судно: ${terminal.vessel_name || terminal.vesselName || terminal.name || 'Не указано'}
MMSI: ${terminal.mmsi || 'Не указан'}
IMO: ${terminal.imo || 'Не указан'}
Тип связи: ${terminal.terminal_type || terminal.type || 'INMARSAT'}
Владелец: ${terminal.owner || terminal.shipOwner || 'Не указан'}
Последний тест: ${terminal.lastTest || terminal.last_test || 'Не проводился'}
Следующий тест: ${nextTestDate || 'Не запланирован'}
Статус: ${terminal.status === 'active' ? 'Активен' : 'Неактивен'}`;
    
    alert(info);
}

// Функция тестирования терминала
function testTerminal(terminalNumber) {
    if (confirm('Создать тестовый сигнал для терминала ' + terminalNumber + '?')) {
        const signal = {
            id: 'SIG-TEST-' + Date.now(),
            stationNumber: terminalNumber,
            signalType: 'TEST',
            receivedAt: new Date().toISOString(),
            status: 'new',
            isTest: true
        };
        
        const signals = JSON.parse(localStorage.getItem('signals') || '[]');
        signals.push(signal);
        localStorage.setItem('signals', JSON.stringify(signals));
        
        // Обновляем последний тест для терминала
        const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || '[]');
        const terminal = terminals.find(t => t.terminal_number === terminalNumber);
        if (terminal) {
            terminal.lastTest = new Date().toISOString().split('T')[0];
            terminal.status = 'tested';
            localStorage.setItem('ssasTerminals', JSON.stringify(terminals));
        }
        
        if (typeof loadSignals !== 'undefined') loadSignals();
        if (typeof loadTerminals !== 'undefined') loadTerminals();
        
        alert('Тестовый сигнал создан');
    }
}"""
        
        # Добавляем перед закрывающим </script>
        last_script = content.rfind('</script>')
        if last_script > 0:
            content = content[:last_script] + view_terminal_func + '\n' + content[last_script:]
            print("   ✅ Функции viewTerminal и testTerminal добавлены")
    
    # 3. УЛУЧШАЕМ ПАРСИНГ ДАТЬ В ExcelLoader
    print("\n🔧 Улучшение парсинга дат в ExcelLoader...")
    
    # Находим processExcelData в ExcelLoader
    excel_process_pattern = r'(processExcelData\(data\)\s*\{[^}]*terminal[^}]*\})'
    excel_match = re.search(excel_process_pattern, content, re.DOTALL | re.IGNORECASE)
    
    if excel_match:
        old_process = excel_match.group(0)
        
        # Модифицируем создание терминала для извлечения дат
        terminal_creation = """
                // Создаем терминал
                const terminal = {
                    id: 'T-' + Date.now() + '-' + index,
                    terminal_number: stationNumber,
                    vessel_name: row['Судно'] || row['Vessel'] || '',
                    mmsi: row['MMSI'] || '',
                    terminal_type: row['Тип связи'] || row['Type'] || 'INMARSAT',
                    owner: row['Владелец'] || row['Owner'] || '',
                    lastTest: row['Последний тест'] || row['Last Test'] || '',
                    status: 'active'
                };
                
                // Пытаемся найти дату последнего теста в любом поле
                for (let key in row) {
                    if ((key.toLowerCase().includes('послед') && key.toLowerCase().includes('тест')) ||
                        key.toLowerCase().includes('last') && key.toLowerCase().includes('test')) {
                        const dateValue = row[key];
                        if (dateValue) {
                            // Преобразуем в дату
                            const date = new Date(dateValue);
                            if (!isNaN(date)) {
                                terminal.lastTest = date.toISOString().split('T')[0];
                                terminal.status = 'tested';
                            } else {
                                terminal.lastTest = String(dateValue);
                            }
                        }
                    }
                }"""
        
        # Заменяем старое создание терминала на новое
        if '// Создаем терминал' in old_process:
            new_process = re.sub(
                r'//\s*Создаем терминал[^}]+\};',
                terminal_creation,
                old_process
            )
            content = content.replace(old_process, new_process)
            print("   ✅ Парсинг дат в ExcelLoader улучшен")
    
    # 4. ДОБАВЛЯЕМ СТИЛИ ДЛЯ СТАТУСОВ
    if '.status-tested' not in content:
        print("\n🔧 Добавление стилей для статусов...")
        
        status_styles = """
        .status-tested {
            background: #c7f3c7;
            color: #0d5f0d;
        }
        
        .status-inactive {
            background: #f3c7c7;
            color: #5f0d0d;
        }
"""
        
        # Добавляем стили перед </style>
        style_end = content.find('</style>')
        if style_end > 0:
            content = content[:style_end] + status_styles + content[style_end:]
            print("   ✅ Стили для статусов добавлены")
    
    # Сохраняем файл
    print("\n💾 Сохранение файла...")
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Файл сохранен: {file_path}")
    except Exception as e:
        print(f"❌ ОШИБКА при сохранении: {str(e)}")
        return False
    
    print("\n" + "=" * 70)
    print("✅ ИСПРАВЛЕНИЯ ВЫПОЛНЕНЫ!")
    print("\n📋 Что исправлено:")
    print("  • Правильный порядок колонок в таблице терминалов")
    print("  • Статусы на русском языке")
    print("  • Автоматический расчет даты следующего теста (+1 год)")
    print("  • Кнопки в правильной колонке 'Действия'")
    print("  • Добавлена кнопка 'Тест' для создания тестового сигнала")
    print("  • Улучшен парсинг дат из Excel")
    print("\n⚠️ Теперь:")
    print("  1. Обновите страницу (Ctrl+F5)")
    print("  2. Перезагрузите Excel файл")
    print("  3. Проверьте таблицу терминалов")
    
    return True

if __name__ == "__main__":
    fix_terminals_table()
    print("\n✨ Скрипт завершен")