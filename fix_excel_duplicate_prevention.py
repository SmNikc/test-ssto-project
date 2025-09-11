#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_excel_duplicate_prevention.py
Улучшение логики загрузки Excel для предотвращения дубликатов
Путь: C:\Projects\test-ssto-project\fix_excel_duplicate_prevention.py
"""

import re
import os
from pathlib import Path

def fix_excel_loader():
    """Обновляет класс ExcelDataLoader для предотвращения дубликатов"""
    
    # Путь к файлу index.html
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        print(f"❌ Файл не найден: {index_path}")
        return False
    
    # Читаем содержимое файла
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Находим и заменяем класс ExcelDataLoader
    old_class = r'''        // ===== КЛАСС ExcelDataLoader =====
        class ExcelDataLoader \{
            constructor\(\) \{
                this\.setupHandlers\(\);
            \}

            setupHandlers\(\) \{
                const input = document\.getElementById\('excel-upload'\);
                if \(input\) \{
                    input\.addEventListener\('change', \(e\) => \{
                        const file = e\.target\.files\[0\];
                        if \(file\) \{
                            this\.loadExcelFile\(file\);
                        \}
                    \}\);
                \}
            \}

            parseVesselName\(value\) \{
                if \(!value\) return \{ name: '', mmsi: '', imo: '' \};
                
                const str = String\(value\)\.trim\(\);
                let name = str;
                let mmsi = '';
                let imo = '';
                
                // Поиск MMSI \(9 цифр\)
                const mmsiMatch = str\.match\(/\\b\(\\d\{9\}\)\\b/\);
                if \(mmsiMatch\) \{
                    mmsi = mmsiMatch\[1\];
                    name = str\.replace\(mmsiMatch\[0\], ''\)\.trim\(\);
                \}
                
                // Поиск IMO \(7 цифр\)
                const imoMatch = str\.match\(/\\b\(\\d\{7\}\)\\b/\);
                if \(imoMatch\) \{
                    imo = imoMatch\[1\];
                    name = str\.replace\(imoMatch\[0\], ''\)\.trim\(\);
                \}
                
                name = name\.replace\(/\[,;:\\-\]\+\$/, ''\)\.trim\(\);
                
                return \{ name, mmsi, imo \};
            \}

            async loadExcelFile\(file\) \{
                showNotification\('Загрузка файла\.\.\.', 'info'\);

                const reader = new FileReader\(\);
                reader\.onload = \(e\) => \{
                    try \{
                        const data = e\.target\.result;
                        const workbook = XLSX\.read\(data, \{ type: 'binary' \}\);
                        
                        const sheetName = workbook\.SheetNames\[0\];
                        const worksheet = workbook\.Sheets\[sheetName\];
                        const jsonData = XLSX\.utils\.sheet_to_json\(worksheet\);
                        
                        this\.processImportedData\(jsonData\);
                        showNotification\(`Импортировано \$\{jsonData\.length\} записей`, 'success'\);
                    \} catch \(error\) \{
                        showNotification\('Ошибка загрузки файла', 'error'\);
                    \}
                \};
                reader\.readAsBinaryString\(file\);
            \}

            processImportedData\(data\) \{
                // Обработка импортированных данных
                data\.forEach\(row => \{
                    if \(row\['Номер стойки'\] && row\['Судно'\]\) \{
                        const vessel = \{
                            name: row\['Судно'\],
                            mmsi: String\(row\['MMSI'\] \|\| ''\),
                            imo: String\(row\['IMO'\] \|\| ''\),
                            stationNumbers: \[String\(row\['Номер стойки'\]\)\],
                            owner: row\['Владелец'\] \|\| '',
                            email: row\['Email'\] \|\| '',
                            satcomType: row\['Тип связи'\] \|\| 'INMARSAT'
                        \};
                        app\.vesselDB\.addVessel\(vessel\);
                    \}
                \}\);
                
                loadTerminals\(\);
            \}

            openFileDialog\(\) \{
                document\.getElementById\('excel-upload'\)\.click\(\);
            \}
        \}'''
    
    new_class = '''        // ===== КЛАСС ExcelDataLoader С ПРЕДОТВРАЩЕНИЕМ ДУБЛИКАТОВ =====
        class ExcelDataLoader {
            constructor() {
                this.setupHandlers();
                this.lastLoadedFile = null;
                this.lastLoadedHash = null;
            }

            setupHandlers() {
                const input = document.getElementById('excel-upload');
                if (input) {
                    input.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            this.loadExcelFile(file);
                        }
                    });
                }
            }

            parseVesselName(value) {
                if (!value) return { name: '', mmsi: '', imo: '' };
                
                const str = String(value).trim();
                let name = str;
                let mmsi = '';
                let imo = '';
                
                // Поиск MMSI (9 цифр)
                const mmsiMatch = str.match(/\\b(\\d{9})\\b/);
                if (mmsiMatch) {
                    mmsi = mmsiMatch[1];
                    name = str.replace(mmsiMatch[0], '').trim();
                }
                
                // Поиск IMO (7 цифр)
                const imoMatch = str.match(/\\b(\\d{7})\\b/);
                if (imoMatch) {
                    imo = imoMatch[1];
                    name = str.replace(imoMatch[0], '').trim();
                }
                
                name = name.replace(/[,;:\\-]+$/, '').trim();
                
                return { name, mmsi, imo };
            }

            async calculateFileHash(content) {
                // Простой хэш для проверки уникальности содержимого
                let hash = 0;
                for (let i = 0; i < content.length; i++) {
                    const char = content.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash.toString(36);
            }

            async loadExcelFile(file) {
                showNotification('Проверка файла...', 'info');

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = e.target.result;
                        
                        // Проверяем хэш файла
                        const fileHash = await this.calculateFileHash(data);
                        
                        // Если это тот же файл, предупреждаем
                        if (this.lastLoadedHash === fileHash) {
                            const confirmReload = confirm(
                                'Этот файл уже был загружен. Хотите загрузить его повторно?\\n\\n' +
                                'Это может создать дубликаты в базе данных.'
                            );
                            if (!confirmReload) {
                                showNotification('Загрузка отменена', 'warning');
                                return;
                            }
                        }
                        
                        const workbook = XLSX.read(data, { type: 'binary' });
                        
                        const sheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[sheetName];
                        const jsonData = XLSX.utils.sheet_to_json(worksheet);
                        
                        // Предлагаем очистить старые данные
                        if (app.vesselDB && app.vesselDB.vessels.length > 0) {
                            const clearOld = confirm(
                                `В базе уже есть ${app.vesselDB.vessels.length} судов.\\n\\n` +
                                'Очистить существующие данные перед загрузкой новых?\\n\\n' +
                                'ДА - очистить и загрузить новые\\n' +
                                'НЕТ - добавить к существующим (возможны дубликаты)'
                            );
                            
                            if (clearOld) {
                                this.clearExistingData();
                            }
                        }
                        
                        // Обрабатываем с проверкой дубликатов
                        const result = this.processImportedDataWithCheck(jsonData);
                        
                        // Сохраняем информацию о загруженном файле
                        this.lastLoadedFile = file.name;
                        this.lastLoadedHash = fileHash;
                        localStorage.setItem('lastExcelFile', file.name);
                        localStorage.setItem('lastExcelHash', fileHash);
                        localStorage.setItem('lastExcelDate', new Date().toISOString());
                        
                        showNotification(
                            `Загружено: ${result.added} новых, ${result.updated} обновлено, ${result.skipped} пропущено`,
                            'success'
                        );
                        
                    } catch (error) {
                        console.error('Ошибка загрузки:', error);
                        showNotification('Ошибка загрузки файла: ' + error.message, 'error');
                    }
                };
                reader.readAsBinaryString(file);
            }

            clearExistingData() {
                // Очищаем данные о судах
                if (app.vesselDB) {
                    app.vesselDB.vessels = [];
                    app.vesselDB.save();
                }
                
                // Очищаем терминалы
                const terminals = [];
                localStorage.setItem('ssasTerminals', JSON.stringify(terminals));
                
                // Очищаем заявки только если пользователь подтвердит
                const clearRequests = confirm('Также очистить существующие заявки?');
                if (clearRequests) {
                    localStorage.setItem('testRequests', JSON.stringify([]));
                    localStorage.setItem('testSignals', JSON.stringify([]));
                }
                
                showNotification('Существующие данные очищены', 'info');
            }

            processImportedDataWithCheck(data) {
                const result = {
                    added: 0,
                    updated: 0,
                    skipped: 0
                };
                
                // Создаем карту существующих терминалов
                const existingTerminals = JSON.parse(localStorage.getItem('ssasTerminals') || '[]');
                const terminalMap = new Map();
                existingTerminals.forEach(t => {
                    terminalMap.set(t.terminal_number, t);
                });
                
                // Обрабатываем данные с проверкой дубликатов
                data.forEach(row => {
                    const stationNumber = String(row['Номер стойки'] || '').trim();
                    const vesselName = String(row['Судно'] || '').trim();
                    
                    if (!stationNumber || !vesselName) {
                        result.skipped++;
                        return;
                    }
                    
                    // Проверяем наличие терминала
                    const existingTerminal = terminalMap.get(stationNumber);
                    
                    if (existingTerminal) {
                        // Обновляем существующий терминал
                        const updatedData = {
                            name: vesselName,
                            mmsi: String(row['MMSI'] || existingTerminal.current_mmsi || ''),
                            imo: String(row['IMO'] || existingTerminal.current_imo || ''),
                            owner: row['Владелец'] || existingTerminal.owner || '',
                            email: row['Email'] || existingTerminal.contact_email || '',
                            satcomType: row['Тип связи'] || existingTerminal.terminal_type || 'INMARSAT'
                        };
                        
                        // Проверяем, изменились ли данные
                        const hasChanges = 
                            existingTerminal.current_vessel_name !== updatedData.name ||
                            existingTerminal.current_mmsi !== updatedData.mmsi ||
                            existingTerminal.current_imo !== updatedData.imo;
                        
                        if (hasChanges) {
                            // Обновляем терминал
                            existingTerminal.current_vessel_name = updatedData.name;
                            existingTerminal.current_mmsi = updatedData.mmsi;
                            existingTerminal.current_imo = updatedData.imo;
                            existingTerminal.owner = updatedData.owner;
                            existingTerminal.contact_email = updatedData.email;
                            existingTerminal.terminal_type = updatedData.satcomType;
                            existingTerminal.updated_at = new Date().toISOString();
                            
                            result.updated++;
                        } else {
                            result.skipped++;
                        }
                    } else {
                        // Создаем новый терминал
                        const newTerminal = {
                            id: 'T' + Date.now() + Math.random().toString(36).substr(2, 9),
                            terminal_number: stationNumber,
                            terminal_type: row['Тип связи'] || 'INMARSAT',
                            current_vessel_name: vesselName,
                            current_mmsi: String(row['MMSI'] || ''),
                            current_imo: String(row['IMO'] || ''),
                            owner: row['Владелец'] || '',
                            contact_email: row['Email'] || '',
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        
                        terminalMap.set(stationNumber, newTerminal);
                        result.added++;
                    }
                    
                    // Также обновляем базу судов если она используется
                    if (app.vesselDB) {
                        const vessel = {
                            name: vesselName,
                            mmsi: String(row['MMSI'] || ''),
                            imo: String(row['IMO'] || ''),
                            stationNumbers: [stationNumber],
                            owner: row['Владелец'] || '',
                            email: row['Email'] || '',
                            satcomType: row['Тип связи'] || 'INMARSAT'
                        };
                        
                        // Проверяем наличие судна по MMSI или IMO
                        const existing = app.vesselDB.vessels.find(v => 
                            (vessel.mmsi && v.mmsi === vessel.mmsi) ||
                            (vessel.imo && v.imo === vessel.imo) ||
                            (v.name === vessel.name && v.stationNumbers.includes(stationNumber))
                        );
                        
                        if (existing) {
                            // Добавляем номер стойки если его нет
                            if (!existing.stationNumbers.includes(stationNumber)) {
                                existing.stationNumbers.push(stationNumber);
                            }
                            // Обновляем данные
                            Object.assign(existing, {
                                name: vessel.name,
                                owner: vessel.owner || existing.owner,
                                email: vessel.email || existing.email,
                                satcomType: vessel.satcomType || existing.satcomType,
                                updated_at: new Date().toISOString()
                            });
                        } else {
                            app.vesselDB.addVessel(vessel);
                        }
                    }
                });
                
                // Сохраняем обновленные терминалы
                const updatedTerminals = Array.from(terminalMap.values());
                localStorage.setItem('ssasTerminals', JSON.stringify(updatedTerminals));
                
                // Обновляем интерфейс
                loadTerminals();
                loadDashboardData();
                
                return result;
            }

            openFileDialog() {
                // Показываем информацию о последней загрузке
                const lastFile = localStorage.getItem('lastExcelFile');
                const lastDate = localStorage.getItem('lastExcelDate');
                
                if (lastFile && lastDate) {
                    const date = new Date(lastDate);
                    const dateStr = date.toLocaleDateString('ru-RU') + ' ' + date.toLocaleTimeString('ru-RU');
                    console.log(`Последняя загрузка: ${lastFile} (${dateStr})`);
                }
                
                document.getElementById('excel-upload').click();
            }
        }'''
    
    # Пытаемся найти и заменить класс
    if '// ===== КЛАСС ExcelDataLoader =====' in content:
        # Ищем начало и конец класса
        start_pattern = r'// ===== КЛАСС ExcelDataLoader =====[\s\S]*?class ExcelDataLoader\s*{'
        end_pattern = r'openFileDialog\(\)\s*{\s*document\.getElementById\(\'excel-upload\'\)\.click\(\);\s*}\s*}'
        
        # Находим полный класс
        import re
        match = re.search(start_pattern + r'[\s\S]*?' + end_pattern, content)
        
        if match:
            old_text = match.group(0)
            content = content.replace(old_text, new_class)
            print("✅ Класс ExcelDataLoader обновлен")
        else:
            print("⚠️ Не удалось найти точное соответствие класса, добавляем после VesselDB")
            # Вставляем после класса VesselDB
            vesseldb_end = content.find('        }', content.find('class VesselDB'))
            if vesseldb_end > 0:
                insert_pos = content.find('\n', vesseldb_end) + 1
                content = content[:insert_pos] + '\n' + new_class + '\n' + content[insert_pos:]
    else:
        print("⚠️ Маркер класса не найден, попробуем заменить по содержимому")
        # Альтернативный поиск
        if 'class ExcelDataLoader' in content:
            # Находим начало класса
            start = content.find('class ExcelDataLoader')
            # Ищем конец класса (следующий класс или конец скрипта)
            end = content.find('\n        class ', start + 1)
            if end == -1:
                end = content.find('\n        // =====', start + 1)
            if end == -1:
                end = content.find('\n        function ', start + 1)
            
            if end > start:
                # Находим закрывающую скобку класса
                brace_count = 0
                pos = content.find('{', start)
                while pos < len(content):
                    if content[pos] == '{':
                        brace_count += 1
                    elif content[pos] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            end = pos + 1
                            break
                    pos += 1
                
                # Заменяем класс
                old_text = content[start:end]
                content = content[:start] + new_class.strip() + content[end:]
                print("✅ Класс ExcelDataLoader заменен")
    
    # Записываем обновленный файл
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Файл index.html обновлен")
    print("\n📝 Добавлены функции:")
    print("  - Проверка дубликатов при загрузке")
    print("  - Хэширование файлов для определения повторной загрузки")
    print("  - Опция очистки существующих данных")
    print("  - Обновление существующих записей вместо создания дубликатов")
    print("  - Статистика загрузки (добавлено/обновлено/пропущено)")
    print("  - Сохранение информации о последней загрузке")
    
    return True

if __name__ == "__main__":
    print("🔧 Улучшение логики загрузки Excel файлов")
    print("=" * 50)
    
    if fix_excel_loader():
        print("\n✅ Успешно обновлено!")
        print("\nТеперь при загрузке Excel:")
        print("1. Проверяется, не загружен ли этот же файл повторно")
        print("2. Предлагается очистить старые данные перед загрузкой")
        print("3. Проверяются дубликаты по номеру стойки/MMSI/IMO")
        print("4. Обновляются существующие записи вместо создания дубликатов")
        print("5. Показывается статистика загрузки")
    else:
        print("\n❌ Ошибка при обновлении!")