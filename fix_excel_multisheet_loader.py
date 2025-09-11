#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_excel_multisheet_loader.py
Улучшенная загрузка Excel с обработкой всех листов и тремя опциями
Путь: C:\Projects\test-ssto-project\fix_excel_multisheet_loader.py
"""

import re
import os
from pathlib import Path

def fix_excel_loader():
    """Обновляет класс ExcelDataLoader для работы с несколькими листами"""
    
    # Путь к файлу index.html
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        print(f"❌ Файл не найден: {index_path}")
        return False
    
    # Читаем содержимое файла
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Новый улучшенный класс ExcelDataLoader
    new_class = '''        // ===== КЛАСС ExcelDataLoader С ОБРАБОТКОЙ ВСЕХ ЛИСТОВ =====
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

            // Парсинг имени судна с извлечением MMSI и IMO
            parseVesselInfo(value) {
                if (!value) return { name: '', mmsi: '', imo: '' };
                
                const str = String(value).trim();
                let name = str;
                let mmsi = '';
                let imo = '';
                
                // Проверяем разные форматы записи
                // Формат: "Название судна MMSI:123456789" или "Название (MMSI 123456789)"
                const mmsiPatterns = [
                    /MMSI[\s:]*(\d{9})/i,
                    /\(MMSI[\s:]*(\d{9})\)/i,
                    /[\s,;](\d{9})(?:\s|$)/,  // 9 цифр отдельно
                    /MMSI[\s:]*(\d{8,9})/i     // иногда 8 цифр
                ];
                
                for (const pattern of mmsiPatterns) {
                    const match = str.match(pattern);
                    if (match) {
                        mmsi = match[1].padStart(9, '0'); // Дополняем нулями если нужно
                        name = str.replace(match[0], '').trim();
                        break;
                    }
                }
                
                // Проверяем IMO
                const imoPatterns = [
                    /IMO[\s:]*(\d{7})/i,
                    /\(IMO[\s:]*(\d{7})\)/i,
                    /IMO[\s:]*([0-9]{7})/i,
                    /(?:^|\s)(\d{7})(?:\s|$)/  // 7 цифр отдельно
                ];
                
                for (const pattern of imoPatterns) {
                    const match = str.match(pattern);
                    if (match) {
                        imo = match[1];
                        name = str.replace(match[0], '').trim();
                        break;
                    }
                }
                
                // Очищаем имя от лишних символов
                name = name.replace(/[,;:\-\(\)]+$/, '').trim();
                name = name.replace(/^\[|\]$/g, '').trim();
                
                return { name, mmsi, imo };
            }

            async calculateFileHash(content) {
                let hash = 0;
                for (let i = 0; i < content.length; i++) {
                    const char = content.charCodeAt(i);
                    hash = ((hash << 5) - hash) + char;
                    hash = hash & hash;
                }
                return hash.toString(36);
            }

            // Показываем диалог с тремя опциями
            async showLoadDialog(existingData) {
                return new Promise((resolve) => {
                    const modal = document.createElement('div');
                    modal.className = 'modal';
                    modal.style.cssText = `
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0,0,0,0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 10000;
                    `;
                    
                    const dialog = document.createElement('div');
                    dialog.style.cssText = `
                        background: white;
                        border-radius: 8px;
                        padding: 30px;
                        max-width: 500px;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    `;
                    
                    dialog.innerHTML = `
                        <h2 style="margin-top: 0; color: #333;">Загрузка данных Excel</h2>
                        <p style="color: #666; line-height: 1.6;">
                            В базе уже есть данные:<br>
                            • Терминалов: <strong>${existingData.terminals}</strong><br>
                            • Судов: <strong>${existingData.vessels}</strong><br>
                            • Заявок: <strong>${existingData.requests}</strong>
                        </p>
                        <p style="color: #444; margin-top: 20px;">
                            <strong>Выберите действие:</strong>
                        </p>
                        <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: space-between;">
                            <button id="btn-replace" style="
                                padding: 10px 20px;
                                background: #dc3545;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">ДА - Заменить всё</button>
                            
                            <button id="btn-append" style="
                                padding: 10px 20px;
                                background: #28a745;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">НЕТ - Добавить к существующим</button>
                            
                            <button id="btn-cancel" style="
                                padding: 10px 20px;
                                background: #6c757d;
                                color: white;
                                border: none;
                                border-radius: 4px;
                                cursor: pointer;
                                font-size: 14px;
                            ">Отказаться</button>
                        </div>
                        <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                            <small style="color: #666;">
                                <strong>ДА</strong> - Полная замена всех данных<br>
                                <strong>НЕТ</strong> - Добавить новые и обновить существующие<br>
                                <strong>Отказаться</strong> - Не загружать файл
                            </small>
                        </div>
                    `;
                    
                    modal.appendChild(dialog);
                    document.body.appendChild(modal);
                    
                    // Обработчики кнопок
                    document.getElementById('btn-replace').onclick = () => {
                        modal.remove();
                        resolve('replace');
                    };
                    
                    document.getElementById('btn-append').onclick = () => {
                        modal.remove();
                        resolve('append');
                    };
                    
                    document.getElementById('btn-cancel').onclick = () => {
                        modal.remove();
                        resolve('cancel');
                    };
                });
            }

            async loadExcelFile(file) {
                showNotification('Чтение файла Excel...', 'info');

                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        const data = e.target.result;
                        const fileHash = await this.calculateFileHash(data);
                        
                        // Проверяем, не тот же ли это файл
                        if (this.lastLoadedHash === fileHash) {
                            if (!confirm('Этот файл уже был загружен. Продолжить?')) {
                                showNotification('Загрузка отменена', 'warning');
                                return;
                            }
                        }
                        
                        // Читаем Excel
                        const workbook = XLSX.read(data, { type: 'binary' });
                        
                        // Собираем существующие данные
                        const existingData = {
                            terminals: JSON.parse(localStorage.getItem('ssasTerminals') || '[]').length,
                            vessels: app.vesselDB ? app.vesselDB.vessels.length : 0,
                            requests: JSON.parse(localStorage.getItem('testRequests') || '[]').length
                        };
                        
                        // Если есть данные, показываем диалог
                        let action = 'replace'; // по умолчанию
                        if (existingData.terminals > 0 || existingData.vessels > 0 || existingData.requests > 0) {
                            action = await this.showLoadDialog(existingData);
                        }
                        
                        if (action === 'cancel') {
                            showNotification('Загрузка отменена', 'warning');
                            return;
                        }
                        
                        // Очищаем данные если выбрана замена
                        if (action === 'replace') {
                            this.clearAllData();
                        }
                        
                        // Обрабатываем все листы
                        const results = {
                            terminals: { added: 0, updated: 0, skipped: 0 },
                            vessels: { added: 0, updated: 0, skipped: 0 },
                            requests: { added: 0, updated: 0, skipped: 0 }
                        };
                        
                        // Обрабатываем каждый лист
                        for (const sheetName of workbook.SheetNames) {
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            
                            console.log(`Обработка листа: ${sheetName}, записей: ${jsonData.length}`);
                            
                            // Определяем тип данных по названию листа или содержимому
                            const sheetNameLower = sheetName.toLowerCase();
                            
                            if (sheetNameLower.includes('терминал') || sheetNameLower.includes('terminal') || 
                                sheetNameLower.includes('стойк') || this.isTerminalData(jsonData)) {
                                // Обрабатываем как терминалы
                                const result = this.processTerminals(jsonData, action === 'append');
                                results.terminals.added += result.added;
                                results.terminals.updated += result.updated;
                                results.terminals.skipped += result.skipped;
                                
                            } else if (sheetNameLower.includes('суд') || sheetNameLower.includes('vessel') || 
                                      sheetNameLower.includes('ship') || this.isVesselData(jsonData)) {
                                // Обрабатываем как суда
                                const result = this.processVessels(jsonData, action === 'append');
                                results.vessels.added += result.added;
                                results.vessels.updated += result.updated;
                                results.vessels.skipped += result.skipped;
                                
                            } else if (sheetNameLower.includes('заявк') || sheetNameLower.includes('request') || 
                                      sheetNameLower.includes('тест') || this.isRequestData(jsonData)) {
                                // Обрабатываем как заявки
                                const result = this.processRequests(jsonData, action === 'append');
                                results.requests.added += result.added;
                                results.requests.updated += result.updated;
                                results.requests.skipped += result.skipped;
                                
                            } else {
                                // Пытаемся определить по содержимому
                                if (this.isTerminalData(jsonData)) {
                                    const result = this.processTerminals(jsonData, action === 'append');
                                    results.terminals.added += result.added;
                                    results.terminals.updated += result.updated;
                                    results.terminals.skipped += result.skipped;
                                }
                            }
                        }
                        
                        // Сохраняем информацию о загрузке
                        this.lastLoadedFile = file.name;
                        this.lastLoadedHash = fileHash;
                        localStorage.setItem('lastExcelFile', file.name);
                        localStorage.setItem('lastExcelHash', fileHash);
                        localStorage.setItem('lastExcelDate', new Date().toISOString());
                        
                        // Обновляем интерфейс
                        loadTerminals();
                        loadRequests();
                        loadDashboardData();
                        
                        // Показываем результаты
                        let message = 'Загрузка завершена:\\n\\n';
                        if (results.terminals.added + results.terminals.updated > 0) {
                            message += `Терминалы: ${results.terminals.added} новых, ${results.terminals.updated} обновлено\\n`;
                        }
                        if (results.vessels.added + results.vessels.updated > 0) {
                            message += `Суда: ${results.vessels.added} новых, ${results.vessels.updated} обновлено\\n`;
                        }
                        if (results.requests.added + results.requests.updated > 0) {
                            message += `Заявки: ${results.requests.added} новых, ${results.requests.updated} обновлено\\n`;
                        }
                        
                        showNotification(message, 'success');
                        
                    } catch (error) {
                        console.error('Ошибка загрузки:', error);
                        showNotification('Ошибка загрузки файла: ' + error.message, 'error');
                    }
                };
                reader.readAsBinaryString(file);
            }

            // Определение типа данных по содержимому
            isTerminalData(data) {
                if (!data || data.length === 0) return false;
                const firstRow = data[0];
                return firstRow.hasOwnProperty('Номер стойки') || 
                       firstRow.hasOwnProperty('terminal_number') ||
                       firstRow.hasOwnProperty('Terminal Number') ||
                       firstRow.hasOwnProperty('Station Number');
            }

            isVesselData(data) {
                if (!data || data.length === 0) return false;
                const firstRow = data[0];
                return (firstRow.hasOwnProperty('Судно') || firstRow.hasOwnProperty('Vessel Name')) &&
                       !firstRow.hasOwnProperty('Номер стойки');
            }

            isRequestData(data) {
                if (!data || data.length === 0) return false;
                const firstRow = data[0];
                return firstRow.hasOwnProperty('Дата теста') || 
                       firstRow.hasOwnProperty('Test Date') ||
                       firstRow.hasOwnProperty('Время начала') ||
                       firstRow.hasOwnProperty('Контактное лицо');
            }

            // Очистка всех данных
            clearAllData() {
                // Очищаем терминалы
                localStorage.setItem('ssasTerminals', JSON.stringify([]));
                
                // Очищаем суда
                if (app.vesselDB) {
                    app.vesselDB.vessels = [];
                    app.vesselDB.save();
                }
                
                // Очищаем заявки и сигналы
                localStorage.setItem('testRequests', JSON.stringify([]));
                localStorage.setItem('testSignals', JSON.stringify([]));
                localStorage.setItem('confirmations', JSON.stringify([]));
                
                console.log('Все данные очищены');
            }

            // Обработка терминалов
            processTerminals(data, isAppend) {
                const result = { added: 0, updated: 0, skipped: 0 };
                
                const existingTerminals = isAppend ? 
                    JSON.parse(localStorage.getItem('ssasTerminals') || '[]') : [];
                const terminalMap = new Map();
                
                existingTerminals.forEach(t => {
                    terminalMap.set(t.terminal_number, t);
                });
                
                data.forEach(row => {
                    const stationNumber = String(row['Номер стойки'] || row['terminal_number'] || '').trim();
                    const vesselInfo = this.parseVesselInfo(row['Судно'] || row['Vessel Name'] || '');
                    
                    if (!stationNumber) {
                        result.skipped++;
                        return;
                    }
                    
                    const existing = terminalMap.get(stationNumber);
                    
                    if (existing && isAppend) {
                        // Обновляем существующий
                        existing.current_vessel_name = vesselInfo.name;
                        existing.current_mmsi = vesselInfo.mmsi || row['MMSI'] || '';
                        existing.current_imo = vesselInfo.imo || row['IMO'] || '';
                        existing.owner = row['Владелец'] || row['Owner'] || existing.owner;
                        existing.contact_email = row['Email'] || row['Contact Email'] || existing.contact_email;
                        existing.terminal_type = row['Тип связи'] || row['Terminal Type'] || existing.terminal_type;
                        existing.updated_at = new Date().toISOString();
                        result.updated++;
                    } else {
                        // Создаем новый
                        const newTerminal = {
                            id: 'T' + Date.now() + Math.random().toString(36).substr(2, 9),
                            terminal_number: stationNumber,
                            terminal_type: row['Тип связи'] || row['Terminal Type'] || 'INMARSAT',
                            current_vessel_name: vesselInfo.name,
                            current_mmsi: vesselInfo.mmsi || row['MMSI'] || '',
                            current_imo: vesselInfo.imo || row['IMO'] || '',
                            owner: row['Владелец'] || row['Owner'] || '',
                            contact_email: row['Email'] || row['Contact Email'] || '',
                            is_active: true,
                            created_at: new Date().toISOString(),
                            updated_at: new Date().toISOString()
                        };
                        terminalMap.set(stationNumber, newTerminal);
                        result.added++;
                    }
                });
                
                // Сохраняем
                const terminals = Array.from(terminalMap.values());
                localStorage.setItem('ssasTerminals', JSON.stringify(terminals));
                
                return result;
            }

            // Обработка судов
            processVessels(data, isAppend) {
                const result = { added: 0, updated: 0, skipped: 0 };
                
                if (!app.vesselDB) {
                    app.vesselDB = new VesselDB();
                }
                
                if (!isAppend) {
                    app.vesselDB.vessels = [];
                }
                
                data.forEach(row => {
                    const vesselInfo = this.parseVesselInfo(row['Судно'] || row['Vessel Name'] || '');
                    
                    if (!vesselInfo.name) {
                        result.skipped++;
                        return;
                    }
                    
                    const vessel = {
                        name: vesselInfo.name,
                        mmsi: vesselInfo.mmsi || row['MMSI'] || '',
                        imo: vesselInfo.imo || row['IMO'] || '',
                        callSign: row['Позывной'] || row['Call Sign'] || '',
                        stationNumbers: row['Номер стойки'] ? [String(row['Номер стойки'])] : [],
                        owner: row['Владелец'] || row['Owner'] || '',
                        email: row['Email'] || row['Contact Email'] || '',
                        satcomType: row['Тип связи'] || row['Terminal Type'] || 'INMARSAT',
                        flag: row['Флаг'] || row['Flag'] || '',
                        type: row['Тип судна'] || row['Vessel Type'] || ''
                    };
                    
                    // Проверяем существование
                    const existing = app.vesselDB.vessels.find(v => 
                        (vessel.mmsi && v.mmsi === vessel.mmsi) ||
                        (vessel.imo && v.imo === vessel.imo) ||
                        (v.name === vessel.name)
                    );
                    
                    if (existing && isAppend) {
                        // Обновляем
                        Object.assign(existing, vessel);
                        existing.updated_at = new Date().toISOString();
                        result.updated++;
                    } else if (!existing) {
                        // Добавляем новое
                        app.vesselDB.addVessel(vessel);
                        result.added++;
                    } else {
                        result.skipped++;
                    }
                });
                
                app.vesselDB.save();
                return result;
            }

            // Обработка заявок
            processRequests(data, isAppend) {
                const result = { added: 0, updated: 0, skipped: 0 };
                
                const existingRequests = isAppend ? 
                    JSON.parse(localStorage.getItem('testRequests') || '[]') : [];
                
                data.forEach(row => {
                    const vesselInfo = this.parseVesselInfo(row['Судно'] || row['Vessel Name'] || '');
                    
                    if (!vesselInfo.name && !row['Номер стойки']) {
                        result.skipped++;
                        return;
                    }
                    
                    const request = {
                        id: 'REQ' + Date.now() + Math.random().toString(36).substr(2, 5),
                        vesselName: vesselInfo.name,
                        mmsi: vesselInfo.mmsi || row['MMSI'] || '',
                        imo: vesselInfo.imo || row['IMO'] || '',
                        stationNumber: String(row['Номер стойки'] || row['Station Number'] || ''),
                        testDate: row['Дата теста'] || row['Test Date'] || new Date().toISOString().split('T')[0],
                        startTime: row['Время начала'] || row['Start Time'] || '10:00',
                        endTime: row['Время окончания'] || row['End Time'] || '11:00',
                        contactPerson: row['Контактное лицо'] || row['Contact Person'] || '',
                        contactPhone: row['Телефон'] || row['Phone'] || '',
                        email: row['Email'] || '',
                        organization: row['Организация'] || row['Organization'] || '',
                        notes: row['Примечания'] || row['Notes'] || '',
                        status: row['Статус'] || 'pending',
                        createdAt: new Date().toISOString()
                    };
                    
                    // Проверяем дубликаты
                    const existing = existingRequests.find(r => 
                        r.stationNumber === request.stationNumber &&
                        r.testDate === request.testDate
                    );
                    
                    if (!existing) {
                        existingRequests.push(request);
                        result.added++;
                    } else {
                        result.skipped++;
                    }
                });
                
                localStorage.setItem('testRequests', JSON.stringify(existingRequests));
                return result;
            }

            openFileDialog() {
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
    
    # Ищем место для вставки класса
    # Попробуем найти существующий класс ExcelDataLoader
    if 'class ExcelDataLoader' in content:
        # Находим начало класса
        start = content.find('class ExcelDataLoader')
        # Находим закрывающую скобку класса
        brace_count = 0
        pos = content.find('{', start)
        end = pos
        
        if pos != -1:
            while pos < len(content):
                if content[pos] == '{':
                    brace_count += 1
                elif content[pos] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end = pos + 1
                        break
                pos += 1
            
            # Также ищем комментарий перед классом
            comment_start = content.rfind('//', 0, start)
            if comment_start != -1 and comment_start > start - 100:
                start = comment_start
            
            # Заменяем весь класс
            content = content[:start] + new_class + content[end:]
            print("✅ Класс ExcelDataLoader заменен")
    else:
        # Если класс не найден, добавляем после VesselDB
        vesseldb_pos = content.find('class VesselDB')
        if vesseldb_pos != -1:
            # Находим конец класса VesselDB
            brace_count = 0
            pos = content.find('{', vesseldb_pos)
            while pos < len(content):
                if content[pos] == '{':
                    brace_count += 1
                elif content[pos] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        insert_pos = pos + 1
                        # Находим конец строки
                        insert_pos = content.find('\n', insert_pos) + 1
                        content = content[:insert_pos] + '\n' + new_class + '\n' + content[insert_pos:]
                        print("✅ Класс ExcelDataLoader добавлен после VesselDB")
                        break
                pos += 1
    
    # Записываем обновленный файл
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Файл index.html обновлен")
    return True

if __name__ == "__main__":
    print("🔧 Улучшение загрузчика Excel с обработкой всех листов")
    print("=" * 60)
    
    if fix_excel_loader():
        print("\n✅ Успешно обновлено!")
        print("\n📋 Новые возможности:")
        print("1. Обработка ВСЕХ листов в Excel файле")
        print("2. Автоматическое определение типа данных (терминалы/суда/заявки)")
        print("3. Три опции при загрузке:")
        print("   • ДА - полная замена всех данных")
        print("   • НЕТ - добавить к существующим")
        print("   • Отказаться - не загружать")
        print("4. Умный парсинг судов с MMSI/IMO в одной ячейке")
        print("5. Обработка разных форматов записи (MMSI:123456789, IMO 1234567 и т.д.)")
        print("6. Статистика по каждому типу данных")
        print("\n📝 Команда для запуска:")
        print("python C:\\Projects\\test-ssto-project\\fix_excel_multisheet_loader.py")
    else:
        print("\n❌ Ошибка при обновлении!")