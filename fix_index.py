#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для комплексного обновления index.html
Версия: 1.0
"""

import re
import os
import shutil
from datetime import datetime

def backup_file(filepath):
    """Создает резервную копию файла"""
    backup_path = f"{filepath}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(filepath, backup_path)
    print(f"✅ Создана резервная копия: {backup_path}")
    return backup_path

def replace_function(content, func_name, new_code):
    """Универсальная замена функции"""
    # Паттерн для поиска функции
    pattern = rf'function {func_name}\(\)[^{{]*\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}}'
    
    matches = list(re.finditer(pattern, content, re.DOTALL))
    if matches:
        print(f"  ✓ Найдена функция {func_name}")
        content = content[:matches[0].start()] + new_code + content[matches[0].end():]
    else:
        print(f"  ⚠ Функция {func_name} не найдена")
    
    return content

def replace_class(content, class_name, new_code):
    """Универсальная замена класса"""
    # Паттерн для поиска класса с учетом вложенных методов
    pattern = rf'class {class_name}\s*\{{(?:[^{{}}]|\{{(?:[^{{}}]|\{{[^{{}}]*\}})*\}})*\}}'
    
    matches = list(re.finditer(pattern, content, re.DOTALL))
    if matches:
        print(f"  ✓ Найден класс {class_name}")
        content = content[:matches[0].start()] + new_code + content[matches[0].end():]
    else:
        print(f"  ⚠ Класс {class_name} не найден")
    
    return content

def update_table_headers(content):
    """Обновляет заголовки таблиц для добавления IMO"""
    
    # Обновление таблицы заявок
    pattern1 = r'(<div id="requests"[^>]*>.*?<thead>.*?<tr>)(.*?)(<\/tr>.*?<\/thead>)'
    
    def replace_requests_header(match):
        if 'IMO' in match.group(2):
            return match.group(0)
        
        new_headers = '''
                    <th>ID</th>
                    <th>Номер стойки</th>
                    <th>Судно</th>
                    <th>MMSI</th>
                    <th>IMO</th>
                    <th>Дата теста</th>
                    <th>Статус</th>
                    <th>Действия</th>
                '''
        return match.group(1) + new_headers + match.group(3)
    
    content = re.sub(pattern1, replace_requests_header, content, flags=re.DOTALL)
    
    # Обновление таблицы сигналов
    pattern2 = r'(<div id="signals"[^>]*>.*?<thead>.*?<tr>)(.*?)(<\/tr>.*?<\/thead>)'
    
    def replace_signals_header(match):
        if 'IMO' in match.group(2):
            return match.group(0)
        
        new_headers = '''
                    <th>ID</th>
                    <th>Номер стойки</th>
                    <th>Судно</th>
                    <th>MMSI</th>
                    <th>IMO</th>
                    <th>Тип</th>
                    <th>Время получения</th>
                    <th>Тест/Тревога</th>
                    <th>Действия</th>
                '''
        return match.group(1) + new_headers + match.group(3)
    
    content = re.sub(pattern2, replace_signals_header, content, flags=re.DOTALL)
    
    print("  ✓ Заголовки таблиц обновлены")
    return content

def main():
    """Главная функция"""
    
    filepath = 'index.html'
    
    if not os.path.exists(filepath):
        print(f"❌ Файл {filepath} не найден!")
        return
    
    print(f"📄 Обработка файла: {filepath}")
    print(f"📏 Размер: {os.path.getsize(filepath):,} байт\n")
    
    backup_path = backup_file(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print("🔧 Выполнение обновлений:\n")
        
        # 1. Обновление loadRequests
        print("1. Обновление функции loadRequests...")
        new_loadRequests = '''        function loadRequests() {
            const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            const tbody = document.getElementById('requests-tbody');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            requests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${request.id}</td>
                    <td><strong>${request.stationNumber}</strong></td>
                    <td>${request.vesselName}</td>
                    <td>${request.mmsi}</td>
                    <td>${request.imo || '-'}</td>
                    <td>${formatDate(request.testDate)}</td>
                    <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                    <td>
                        <button onclick="viewRequest('${request.id}')" class="btn btn-secondary">Просмотр</button>
                        ${request.status === 'pending' ? 
                            `<button onclick="confirmRequest('${request.id}')" class="btn btn-primary">Подтвердить</button>` : 
                            `<button onclick="generateConfirmationPDF('${request.id}')" class="btn btn-primary">📄 PDF</button>`
                        }
                    </td>
                `;
                tbody.appendChild(row);
            });
        }'''
        content = replace_function(content, 'loadRequests', new_loadRequests)
        
        # 2. Обновление loadSignals
        print("\n2. Обновление функции loadSignals...")
        new_loadSignals = '''        function loadSignals() {
            const signals = JSON.parse(localStorage.getItem('signals') || '[]');
            const tbody = document.getElementById('signals-tbody');
            
            if (!tbody) return;
            
            tbody.innerHTML = '';
            
            signals.forEach(signal => {
                const vessel = app.vesselDB.findByStationNumber(signal.stationNumber);
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${signal.id}</td>
                    <td><strong>${signal.stationNumber}</strong></td>
                    <td>${vessel ? vessel.name : 'Неизвестно'}</td>
                    <td>${signal.mmsi || '-'}</td>
                    <td>${vessel ? vessel.imo || '-' : '-'}</td>
                    <td>${signal.type}</td>
                    <td>${formatDate(signal.receivedAt)}</td>
                    <td>${signal.isTest ? '✅ Тест' : '🚨 Тревога'}</td>
                    <td>
                        <button onclick="viewSignal('${signal.id}')" class="btn btn-secondary">Детали</button>
                        ${!signal.isTest ? 
                            `<button onclick="sendToPoiskMore('${signal.id}')" class="btn btn-primary">В Поиск-Море</button>` : 
                            ''
                        }
                    </td>
                `;
                tbody.appendChild(row);
            });
        }'''
        content = replace_function(content, 'loadSignals', new_loadSignals)
        
        # 3. Обновление класса ExcelDataLoader
        print("\n3. Обновление класса ExcelDataLoader...")
        new_ExcelDataLoader = '''class ExcelDataLoader {
            constructor() {
                this.setupHandlers();
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

            async loadExcelFile(file) {
                showNotification('Загрузка файла Excel...', 'info');

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = e.target.result;
                        const workbook = XLSX.read(data, { type: 'binary' });
                        
                        let vesselsLoaded = 0;
                        let requestsLoaded = 0;
                        let signalsLoaded = 0;

                        workbook.SheetNames.forEach(sheetName => {
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(worksheet);
                            
                            const sheetNameLower = sheetName.toLowerCase();
                            
                            if (sheetNameLower.includes('суд') || sheetNameLower.includes('vessel') || 
                                sheetNameLower.includes('терминал') || sheetNameLower.includes('terminal')) {
                                vesselsLoaded += this.loadVessels(jsonData);
                            } 
                            else if (sheetNameLower.includes('заявк') || sheetNameLower.includes('request')) {
                                requestsLoaded += this.loadRequests(jsonData);
                            }
                            else if (sheetNameLower.includes('сигнал') || sheetNameLower.includes('signal')) {
                                signalsLoaded += this.loadSignals(jsonData);
                            }
                            else {
                                this.autoDetectAndLoad(jsonData);
                            }
                        });

                        loadRequests();
                        loadSignals();
                        loadTerminals();
                        loadDashboardData();
                        
                        if (window.mapManager && window.mapManager.map) {
                            window.mapManager.loadSignalsToMap();
                        }

                        showNotification(`Загружено: ${vesselsLoaded} судов, ${requestsLoaded} заявок, ${signalsLoaded} сигналов`, 'success');
                        
                    } catch (error) {
                        console.error('Ошибка загрузки Excel:', error);
                        showNotification('Ошибка загрузки файла: ' + error.message, 'error');
                    }
                };
                reader.readAsBinaryString(file);
            }

            parseVesselName(value) {
                if (!value) return { name: '', mmsi: '', imo: '' };
                
                const str = String(value).trim();
                let name = str;
                let mmsi = '';
                let imo = '';
                
                const mmsiMatch = str.match(/\\b(\\d{9})\\b/);
                if (mmsiMatch) {
                    mmsi = mmsiMatch[1];
                    name = str.replace(mmsiMatch[0], '').trim();
                }
                
                const imoMatch = str.match(/\\b(\\d{7})\\b/);
                if (imoMatch) {
                    imo = imoMatch[1];
                    name = str.replace(imoMatch[0], '').trim();
                }
                
                name = name.replace(/[,;:\\-]+$/, '').trim();
                
                return { name, mmsi, imo };
            }

            loadVessels(data) {
                let loaded = 0;
                const vessels = app.vesselDB.vessels;
                
                data.forEach(row => {
                    try {
                        const stationNumber = String(
                            row['Номер стойки'] || 
                            row['Номер терминала'] || 
                            row['Station Number'] || 
                            row['Terminal'] || 
                            ''
                        ).trim();
                        
                        const vesselData = this.parseVesselName(
                            row['Судно'] || 
                            row['Название судна'] || 
                            row['Vessel'] || 
                            row['Vessel Name'] || 
                            ''
                        );
                        
                        const mmsi = row['MMSI'] || vesselData.mmsi || '';
                        const imo = row['IMO'] || vesselData.imo || '';
                        
                        if (stationNumber && stationNumber.match(/^\\d{9}$/)) {
                            let vessel = vessels.find(v => 
                                v.stationNumbers && v.stationNumbers.includes(stationNumber)
                            );
                            
                            if (!vessel) {
                                vessel = {
                                    id: `V${Date.now()}-${loaded}`,
                                    name: vesselData.name || 'Неизвестное судно',
                                    mmsi: String(mmsi).padStart(9, '0'),
                                    imo: String(imo),
                                    stationNumbers: [stationNumber],
                                    owner: row['Судовладелец'] || row['Owner'] || '',
                                    operator: row['Оператор'] || row['Operator'] || '',
                                    email: row['Email'] || row['Почта'] || '',
                                    satcomType: row['Тип'] || row['Type'] || 'INMARSAT',
                                    status: 'ACTIVE',
                                    lastTest: row['Последний тест'] || null,
                                    nextTest: row['Следующий тест'] || null
                                };
                                
                                vessels.push(vessel);
                                loaded++;
                            }
                        }
                    } catch (error) {
                        console.error('Ошибка обработки строки судна:', error, row);
                    }
                });
                
                app.vesselDB.save();
                return loaded;
            }

            loadRequests(data) {
                let loaded = 0;
                const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
                
                data.forEach(row => {
                    try {
                        const stationNumber = String(
                            row['Номер стойки'] || 
                            row['Station Number'] || 
                            ''
                        ).trim();
                        
                        const vesselData = this.parseVesselName(
                            row['Судно'] || row['Vessel'] || ''
                        );
                        
                        if (stationNumber && stationNumber.match(/^\\d{9}$/)) {
                            const request = {
                                id: row['ID'] || `REQ-${Date.now()}-${loaded}`,
                                stationNumber: stationNumber,
                                vesselName: vesselData.name,
                                mmsi: row['MMSI'] || vesselData.mmsi || '',
                                imo: row['IMO'] || vesselData.imo || '',
                                shipOwner: row['Судовладелец'] || '',
                                email: row['Email'] || '',
                                testDate: this.parseDate(row['Дата теста'] || row['Test Date']),
                                testTime: row['Время'] || '',
                                satcomType: row['Тип'] || 'INMARSAT',
                                status: this.parseStatus(row['Статус'] || row['Status']),
                                createdAt: new Date().toISOString()
                            };
                            
                            if (!requests.find(r => r.stationNumber === request.stationNumber && 
                                                   r.testDate === request.testDate)) {
                                requests.push(request);
                                loaded++;
                            }
                        }
                    } catch (error) {
                        console.error('Ошибка обработки строки заявки:', error, row);
                    }
                });
                
                localStorage.setItem('testRequests', JSON.stringify(requests));
                return loaded;
            }

            loadSignals(data) {
                let loaded = 0;
                const signals = JSON.parse(localStorage.getItem('signals') || '[]');
                
                data.forEach(row => {
                    try {
                        const stationNumber = String(
                            row['Номер стойки'] || 
                            row['Терминал'] || 
                            row['Station'] || 
                            ''
                        ).trim();
                        
                        if (stationNumber && stationNumber.match(/^\\d{9}$/)) {
                            const signal = {
                                id: row['ID'] || `SIG-${Date.now()}-${loaded}`,
                                stationNumber: stationNumber,
                                mmsi: String(row['MMSI'] || '').trim(),
                                type: row['Тип'] || row['Type'] || 'INMARSAT',
                                coordinates: this.parseCoordinates(
                                    row['Широта'] || row['Lat'],
                                    row['Долгота'] || row['Lon']
                                ),
                                receivedAt: this.parseDate(row['Получен'] || row['Received']) || new Date().toISOString(),
                                isTest: this.parseBoolean(row['Тест'] || row['Test']),
                                status: row['Статус'] || 'received'
                            };
                            
                            const vessel = app.vesselDB.findByStationNumber(stationNumber);
                            if (vessel) {
                                signal.vesselName = vessel.name;
                                signal.mmsi = signal.mmsi || vessel.mmsi;
                            }
                            
                            signals.push(signal);
                            loaded++;
                        }
                    } catch (error) {
                        console.error('Ошибка обработки строки сигнала:', error, row);
                    }
                });
                
                localStorage.setItem('signals', JSON.stringify(signals));
                return loaded;
            }

            autoDetectAndLoad(data) {
                if (!data || data.length === 0) return;
                
                const firstRow = data[0];
                const keys = Object.keys(firstRow);
                
                if (keys.some(k => k.toLowerCase().includes('стойк') || k.toLowerCase().includes('terminal'))) {
                    if (keys.some(k => k.toLowerCase().includes('широта') || k.toLowerCase().includes('lat'))) {
                        this.loadSignals(data);
                    } else if (keys.some(k => k.toLowerCase().includes('дата тест') || k.toLowerCase().includes('test date'))) {
                        this.loadRequests(data);
                    } else {
                        this.loadVessels(data);
                    }
                }
            }

            parseDate(value) {
                if (!value) return null;
                
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date.toISOString().split('T')[0];
                }
                
                const parts = String(value).split(/[.\\-\\/]/);
                if (parts.length === 3) {
                    const day = parseInt(parts[0]);
                    const month = parseInt(parts[1]) - 1;
                    const year = parseInt(parts[2]);
                    
                    if (year > 1900 && year < 2100) {
                        return new Date(year, month, day).toISOString().split('T')[0];
                    }
                }
                
                return null;
            }

            parseCoordinates(lat, lon) {
                if (!lat || !lon) return null;
                
                const latitude = parseFloat(lat);
                const longitude = parseFloat(lon);
                
                if (!isNaN(latitude) && !isNaN(longitude)) {
                    return { lat: latitude, lon: longitude };
                }
                
                return null;
            }

            parseStatus(value) {
                if (!value) return 'pending';
                
                const status = String(value).toLowerCase();
                if (status.includes('подтвержд') || status.includes('confirm')) return 'confirmed';
                if (status.includes('отмен') || status.includes('cancel')) return 'cancelled';
                if (status.includes('ожид') || status.includes('pending')) return 'pending';
                
                return 'pending';
            }

            parseBoolean(value) {
                if (typeof value === 'boolean') return value;
                const str = String(value).toLowerCase();
                return str === 'да' || str === 'yes' || str === 'true' || str === '1';
            }

            openFileDialog() {
                document.getElementById('excel-upload').click();
            }
        }'''
        content = replace_class(content, 'ExcelDataLoader', new_ExcelDataLoader)
        
        # 4. Обновление заголовков таблиц
        print("\n4. Обновление заголовков таблиц...")
        content = update_table_headers(content)
        
        # Сохранение
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"\n✅ Файл успешно обновлен!")
        print(f"📏 Новый размер: {len(content):,} символов")
        print(f"\n💾 Резервная копия: {backup_path}")
        print(f"🔄 Для отката: cp {backup_path} {filepath}")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        print(f"🔄 Восстановление из резервной копии...")
        shutil.copy2(backup_path, filepath)
        print(f"✅ Файл восстановлен")

if __name__ == "__main__":
    main()