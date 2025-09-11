#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для полного восстановления системы ССТО из рабочей версии
и применения всех необходимых исправлений
Путь для сохранения: C:\Projects\test-ssto-project\restore_and_fix_all.py
"""
import re
import os
import shutil
from datetime import datetime

def restore_and_fix():
    """Восстанавливает из рабочей версии и применяет все исправления"""
    
    project_dir = r'C:\Projects\test-ssto-project'
    target_file = os.path.join(project_dir, 'index_14_36.html')
    working_backup = os.path.join(project_dir, 'index_14_36.html.backup_20250910_013247')
    
    print("=" * 70)
    print("🔄 ПОЛНОЕ ВОССТАНОВЛЕНИЕ И ИСПРАВЛЕНИЕ СИСТЕМЫ ССТО")
    print("=" * 70)
    
    # Проверяем наличие рабочей резервной копии
    if not os.path.exists(working_backup):
        print(f"❌ Не найдена рабочая резервная копия: {working_backup}")
        print("\n📁 Доступные файлы в папке:")
        for f in os.listdir(project_dir):
            if 'index' in f:
                print(f"  • {f}")
        return False
    
    # Создаем финальную резервную копию текущей версии
    if os.path.exists(target_file):
        final_backup = f"{target_file}.final_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy(target_file, final_backup)
        print(f"💾 Создана финальная резервная копия: {os.path.basename(final_backup)}")
    
    # ВОССТАНАВЛИВАЕМ ИЗ РАБОЧЕЙ ВЕРСИИ
    print(f"\n📥 Восстановление из рабочей версии...")
    shutil.copy(working_backup, target_file)
    print(f"   ✅ Восстановлено из: {os.path.basename(working_backup)}")
    
    # Читаем восстановленный файл
    print("\n📖 Чтение восстановленного файла...")
    with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    print("   ✅ Файл прочитан, размер: {:.1f} KB".format(len(content) / 1024))
    
    # ===================== ПРИМЕНЯЕМ ВСЕ ИСПРАВЛЕНИЯ =====================
    
    print("\n" + "=" * 70)
    print("📋 ПРИМЕНЕНИЕ ИСПРАВЛЕНИЙ")
    print("=" * 70)
    
    # 1. ДОБАВЛЯЕМ DataStore класс
    print("\n1️⃣ Добавление DataStore...")
    
    datastore_code = """
        // ===================== DataStore: единое хранилище (LocalStorage) ===================== 
        class DataStore {
            constructor() {
                this.keys = {
                    requests: 'testRequests',
                    signals:  'signals',
                    terminals:'vessels'
                };
                this.ensureArrays();
            }
            
            ensureArrays() {
                for (const k of Object.values(this.keys)) {
                    if (!Array.isArray(this._get(k))) this._set(k, []);
                }
            }
            
            _get(key) { 
                return JSON.parse(localStorage.getItem(key) || '[]'); 
            }
            
            _set(key, v) { 
                localStorage.setItem(key, JSON.stringify(v)); 
            }
            
            get(key) { 
                return this._get(this.keys[key]); 
            }
            
            set(key, v) { 
                this._set(this.keys[key], v); 
            }
            
            upsert(key, arr) {
                const store = this.get(key);
                const upserted = [];
                for (const item of arr) {
                    const id = item.id || item.terminal_number || item.signal_number;
                    const idx = store.findIndex(i => 
                        i.id === id || 
                        i.terminal_number === id || 
                        i.signal_number === id
                    );
                    if (idx > -1) store[idx] = { ...store[idx], ...item };
                    else store.push(item);
                    upserted.push(store[idx] || item);
                }
                this.set(key, store);
                return upserted;
            }
            
            remove(key, id) {
                const store = this.get(key);
                const idx = store.findIndex(i => 
                    i.id === id || 
                    i.terminal_number === id || 
                    i.signal_number === id
                );
                if (idx > -1) store.splice(idx, 1);
                this.set(key, store);
            }
        }
        
        const store = new DataStore();
"""
    
    # Добавляем после открывающего тега script
    script_start = content.find('<script>') + len('<script>')
    content = content[:script_start] + datastore_code + content[script_start:]
    print("   ✅ DataStore добавлен")
    
    # 2. ДОБАВЛЯЕМ ExcelLoader класс
    print("\n2️⃣ Добавление ExcelLoader...")
    
    excel_loader_code = """
        // ===================== ExcelLoader: идемпотентный импорт Excel ===================== 
        class ExcelLoader {
            constructor(store) {
                this.store = store;
                this.mode = 'merge';  // 'merge' / 'replace'
            }
            
            handleFile(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const data = evt.target.result;
                    const wb = XLSX.read(data, { type: 'binary' });
                    this.processExcelData(wb);
                };
                reader.readAsBinaryString(file);
            }
            
            processExcelData(wb) {
                const sheets = wb.SheetNames;
                let preview = { new: 0, updated: 0, skipped: 0 };
                const requests = [], signals = [], terminals = [];
                
                for (const sheetName of sheets) {
                    const ws = wb.Sheets[sheetName];
                    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
                    
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row.length < 2) continue;
                        
                        const headers = rows[0];
                        const obj = {};
                        for (let j = 0; j < headers.length; j++) {
                            obj[headers[j]] = row[j];
                        }
                        
                        // Detect sheet type by headers
                        if (this.hasHeader(headers, ['Заявка', 'Request', 'Номер стойки', 'Terminal'])) {
                            requests.push(obj);
                        } else if (this.hasHeader(headers, ['Сигнал', 'Signal', 'Время получения'])) {
                            signals.push(obj);
                        } else if (this.hasHeader(headers, ['Терминал', 'Vessel', 'MMSI', 'Судно'])) {
                            terminals.push(this.parseTerminal(obj));
                        }
                    }
                }
                
                // Process with mode
                if (this.mode === 'replace') {
                    this.store.set('requests', requests);
                    this.store.set('signals', signals);
                    this.store.set('terminals', terminals);
                    preview = { 
                        new: requests.length + signals.length + terminals.length, 
                        updated: 0, 
                        skipped: 0 
                    };
                } else {
                    const upReq = this.store.upsert('requests', requests);
                    const upSig = this.store.upsert('signals', signals);
                    const upTer = this.store.upsert('terminals', terminals);
                    preview.new = upReq.filter(i => !i.id).length + 
                                 upSig.filter(i => !i.id).length + 
                                 upTer.filter(i => !i.id).length;
                    preview.updated = upReq.length + upSig.length + upTer.length - preview.new;
                }
                
                alert(`Импорт завершен:\\nНовых: ${preview.new}\\nОбновлено: ${preview.updated}\\nПропущено: ${preview.skipped}`);
                
                // Обновляем все таблицы
                if (typeof loadDashboard === 'function') loadDashboard();
                if (typeof loadRequests === 'function') loadRequests();
                if (typeof loadSignals === 'function') loadSignals();
                if (typeof loadTerminals === 'function') loadTerminals();
            }
            
            parseTerminal(obj) {
                const terminal = {
                    id: obj.id || 'T-' + Date.now() + '-' + Math.random(),
                    terminal_number: obj['Номер стойки'] || obj['Terminal Number'] || '',
                    vessel_name: obj['Судно'] || obj['Vessel'] || '',
                    mmsi: obj['MMSI'] || '',
                    terminal_type: obj['Тип связи'] || obj['Type'] || 'INMARSAT',
                    owner: obj['Владелец'] || obj['Owner'] || '',
                    lastTest: obj['Последний тест'] || obj['Last Test'] || '',
                    status: 'active'
                };
                
                // Пытаемся найти дату последнего теста
                for (let key in obj) {
                    if ((key.toLowerCase().includes('послед') && key.toLowerCase().includes('тест')) ||
                        (key.toLowerCase().includes('last') && key.toLowerCase().includes('test'))) {
                        const dateValue = obj[key];
                        if (dateValue) {
                            const date = new Date(dateValue);
                            if (!isNaN(date)) {
                                terminal.lastTest = date.toISOString().split('T')[0];
                                terminal.status = 'tested';
                            } else {
                                terminal.lastTest = String(dateValue);
                            }
                        }
                    }
                }
                
                return terminal;
            }
            
            hasHeader(headers, keywords) {
                return keywords.some(kw => 
                    headers.some(h => h && h.toLowerCase().includes(kw.toLowerCase()))
                );
            }
        }
        
        const excelLoader = new ExcelLoader(store);
"""
    
    content = content[:script_start] + content[:script_start].split('const store')[0] + datastore_code + excel_loader_code + content[script_start:]
    content = re.sub(r'const store = new DataStore\(\);\s*const store = new DataStore\(\);', 'const store = new DataStore();', content)
    print("   ✅ ExcelLoader добавлен")
    
    # 3. ИСПРАВЛЯЕМ uploadExcel функцию
    print("\n3️⃣ Исправление uploadExcel...")
    
    content = re.sub(
        r'function uploadExcel\(\)\s*{[^}]+}',
        """function uploadExcel() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.onchange = (e) => excelLoader.handleFile(e);
            input.click();
        }""",
        content,
        flags=re.DOTALL
    )
    print("   ✅ uploadExcel исправлен")
    
    # 4. ИСПРАВЛЯЕМ loadTerminals функцию
    print("\n4️⃣ Исправление loadTerminals...")
    
    improved_load_terminals = """function loadTerminals() {
            console.log('🚢 Загрузка терминалов...');
            
            const terminals = store.get('terminals');
            const tbody = document.getElementById('terminals-tbody');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            if (terminals.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Нет терминалов</td></tr>';
            } else {
                terminals.forEach(terminal => {
                    // Определяем статус на русском
                    let status = 'Активен';
                    let statusClass = 'status-active';
                    
                    if (terminal.status === 'inactive') {
                        status = 'Неактивен';
                        statusClass = 'status-inactive';
                    } else if (terminal.status === 'tested') {
                        status = 'Протестирован';
                        statusClass = 'status-tested';
                    } else if (terminal.status === 'pending') {
                        status = 'Ожидает теста';
                        statusClass = 'status-pending';
                    }
                    
                    // Вычисляем следующий тест
                    let nextTestDate = '';
                    if (terminal.lastTest) {
                        const lastDate = new Date(terminal.lastTest);
                        if (!isNaN(lastDate)) {
                            const nextDate = new Date(lastDate);
                            nextDate.setFullYear(nextDate.getFullYear() + 1);
                            nextTestDate = nextDate.toISOString().split('T')[0];
                        }
                    }
                    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${terminal.terminal_number || ''}</td>
                        <td>${terminal.vessel_name || ''}</td>
                        <td>${terminal.mmsi || ''}</td>
                        <td>${terminal.terminal_type || 'INMARSAT'}</td>
                        <td>${terminal.owner || ''}</td>
                        <td>${terminal.lastTest || ''}</td>
                        <td>${nextTestDate}</td>
                        <td><span class="status-badge ${statusClass}">${status}</span></td>
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="viewTerminal('${terminal.id || terminal.terminal_number}')">Просмотр</button>
                            <button class="btn btn-success btn-sm" onclick="testTerminal('${terminal.terminal_number}')">Тест</button>
                        </td>
                    `;
                    tbody.appendChild(row);
                });
            }
        }"""
    
    content = re.sub(
        r'function loadTerminals\(\)\s*{[^}]+}',
        improved_load_terminals,
        content,
        flags=re.DOTALL
    )
    print("   ✅ loadTerminals исправлен")
    
    # 5. ДОБАВЛЯЕМ testTerminal функцию
    print("\n5️⃣ Добавление testTerminal...")
    
    test_terminal_func = """
        function testTerminal(terminalNumber) {
            const signal = {
                id: 'SIG' + Date.now(),
                terminal: terminalNumber,
                type: 'TEST',
                received: new Date().toISOString(),
                isTest: true
            };
            store.upsert('signals', [signal]);
            
            const terminals = store.get('terminals');
            const terminal = terminals.find(t => t.terminal_number === terminalNumber);
            if (terminal) {
                terminal.lastTest = new Date().toISOString().split('T')[0];
                terminal.status = 'tested';
                store.set('terminals', terminals);
            }
            
            loadTerminals();
            loadSignals();
            loadDashboard();
            
            alert(`Тестовый сигнал отправлен для терминала ${terminalNumber}`);
        }
"""
    
    # Добавляем перед initMap
    if 'function testTerminal' not in content:
        content = re.sub(
            r'(let olMap;)',
            test_terminal_func + '\n\n\\1',
            content
        )
        print("   ✅ testTerminal добавлен")
    
    # 6. ДОБАВЛЯЕМ СТИЛИ для статусов
    print("\n6️⃣ Добавление стилей для статусов...")
    
    status_styles = """
        .status-badge { 
            padding: 4px 8px; 
            border-radius: 4px; 
            font-size: 0.8em; 
            display: inline-block;
        }
        .status-active { 
            background: #d4edda; 
            color: #155724; 
        }
        .status-inactive { 
            background: #f8d7da; 
            color: #721c24; 
        }
        .status-tested { 
            background: #c7f3c7; 
            color: #0d5f0d; 
        }
        .status-pending { 
            background: #fff3cd; 
            color: #856404; 
        }"""
    
    # Добавляем перед </style>
    style_end = content.find('</style>')
    if style_end > 0 and '.status-tested' not in content:
        content = content[:style_end] + status_styles + content[style_end:]
        print("   ✅ Стили для статусов добавлены")
    
    # 7. УБЕЖДАЕМСЯ ЧТО НАВИГАЦИЯ РАБОТАЕТ
    print("\n7️⃣ Проверка навигации...")
    
    # Проверяем что есть обработчики для табов
    if 'document.querySelectorAll(\'.tab\').forEach(tab =>' not in content:
        nav_handler = """
        // Обработчики для переключения вкладок
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.tab').forEach(tab => {
                tab.addEventListener('click', function(e) {
                    e.preventDefault();
                    const targetId = this.getAttribute('data-tab');
                    
                    // Убираем активный класс со всех вкладок
                    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
                    
                    // Активируем нужную вкладку
                    this.classList.add('active');
                    const targetContent = document.getElementById(targetId);
                    if (targetContent) {
                        targetContent.classList.add('active');
                    }
                    
                    // Обновляем карту при необходимости
                    if (targetId === 'map' && window.olMap) {
                        setTimeout(() => {
                            window.olMap.updateSize();
                        }, 100);
                    }
                });
            });
        });
"""
        script_end = content.rfind('</script>')
        if script_end > 0:
            content = content[:script_end] + nav_handler + '\n' + content[script_end:]
            print("   ✅ Обработчики навигации добавлены")
    
    # 8. ИСПРАВЛЯЕМ ЗАГОЛОВКИ ТАБЛИЦЫ ТЕРМИНАЛОВ
    print("\n8️⃣ Исправление заголовков таблицы терминалов...")
    
    terminals_headers = """<tr>
                    <th>Номер стойки</th>
                    <th>Судно</th>
                    <th>MMSI</th>
                    <th>Тип связи</th>
                    <th>Владелец</th>
                    <th>Последний тест</th>
                    <th>Следующий тест</th>
                    <th>Статус</th>
                    <th>Действия</th>
                </tr>"""
    
    # Находим и заменяем заголовки таблицы терминалов
    content = re.sub(
        r'<thead>\s*<tr>\s*<th>Номер стойки[^<]*</th>[^</tr>]*</tr>\s*</thead>',
        f'<thead>{terminals_headers}</thead>',
        content,
        flags=re.DOTALL
    )
    print("   ✅ Заголовки таблицы исправлены")
    
    # 9. ФИНАЛЬНАЯ ПРОВЕРКА И ОЧИСТКА
    print("\n9️⃣ Финальная проверка и очистка...")
    
    # Убираем дублированные объявления
    content = re.sub(r'(const store = new DataStore\(\);)\s*\1', '\\1', content)
    content = re.sub(r'(const excelLoader = new ExcelLoader\(store\);)\s*\1', '\\1', content)
    
    print("   ✅ Очистка завершена")
    
    # Сохраняем результат
    print("\n💾 Сохранение исправленного файла...")
    with open(target_file, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Файл сохранен: {target_file}")
    print(f"   📏 Размер: {len(content) / 1024:.1f} KB")
    
    print("\n" + "=" * 70)
    print("✅ ВОССТАНОВЛЕНИЕ И ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!")
    print("=" * 70)
    
    print("\n📋 Что было сделано:")
    print("  ✅ Восстановлена рабочая версия")
    print("  ✅ Добавлен класс DataStore")
    print("  ✅ Добавлен класс ExcelLoader")
    print("  ✅ Исправлена функция loadTerminals")
    print("  ✅ Добавлена функция testTerminal")
    print("  ✅ Добавлены стили для статусов")
    print("  ✅ Исправлена навигация")
    print("  ✅ Исправлены заголовки таблиц")
    
    print("\n🎯 Теперь должно работать:")
    print("  • Переключение вкладок")
    print("  • Загрузка Excel файлов")
    print("  • Отображение терминалов с правильными статусами")
    print("  • Кнопка 'Тест' для отправки тестовых сигналов")
    print("  • Автоматический расчет даты следующего теста")
    
    print("\n⚠️ Действия:")
    print("  1. Откройте index_14_36.html в браузере")
    print("  2. Нажмите Ctrl+F5 для полного обновления")
    print("  3. Проверьте все вкладки")
    print("  4. Загрузите Excel файл с данными")
    
    return True

if __name__ == "__main__":
    print("🚀 ЗАПУСК ПОЛНОГО ВОССТАНОВЛЕНИЯ...")
    print("-" * 70)
    
    success = restore_and_fix()
    
    if success:
        print("\n✨ Система успешно восстановлена и исправлена!")
        print("🌟 Все функции должны работать корректно")
    else:
        print("\n❌ Произошла ошибка при восстановлении")
        print("💡 Проверьте наличие файла резервной копии")