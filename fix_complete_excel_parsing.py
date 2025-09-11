#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для полного парсинга ВСЕХ полей из Excel включая контактные данные
Путь для сохранения: C:\Projects\test-ssto-project\fix_complete_excel_parsing.py
"""

import re
import os
from datetime import datetime

def fix_complete_excel_parsing():
    """Исправляет парсинг Excel для извлечения ВСЕХ полей данных"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    # Читаем файл
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Создаем резервную копию
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Резервная копия: {backup_path}")
    
    # 1. РАСШИРЯЕМ ТАБЛИЦУ ЗАЯВОК - добавляем колонки для контактных данных
    # Находим заголовки таблицы заявок
    requests_table_pattern = r'(<div id="requests"[^>]*>.*?<thead>.*?<tr>)(.*?)(</tr>.*?</thead>)'
    
    new_requests_headers = """
                        <th>ID</th>
                        <th>Номер стойки</th>
                        <th>Судно</th>
                        <th>MMSI</th>
                        <th>IMO</th>
                        <th>Судовладелец</th>
                        <th>Контактное лицо</th>
                        <th>Email</th>
                        <th>Телефон</th>
                        <th>Дата теста</th>
                        <th>Статус</th>
                        <th>Действия</th>"""
    
    content = re.sub(
        requests_table_pattern,
        r'\1' + new_requests_headers + r'\3',
        content,
        flags=re.DOTALL
    )
    
    # 2. РАСШИРЯЕМ ФУНКЦИЮ loadRequests для отображения всех полей
    new_load_requests = """function loadRequests() {
    console.log('📋 Загрузка заявок с полными данными...');
    
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const tbody = document.getElementById('requests-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align: center; padding: 20px;">Нет заявок</td></tr>';
        } else {
            requests.forEach(request => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-size: 11px;">${request.id || 'N/A'}</td>
                    <td><strong>${request.stationNumber || ''}</strong></td>
                    <td>${request.vesselName || ''}</td>
                    <td>${request.mmsi || ''}</td>
                    <td>${request.imo || ''}</td>
                    <td>${request.shipOwner || request.owner || ''}</td>
                    <td>${request.contactPerson || ''}</td>
                    <td style="font-size: 11px;">${request.email || ''}</td>
                    <td>${request.phone || request.contactPhone || ''}</td>
                    <td>${request.testDate || ''}</td>
                    <td><span class="status-badge status-${request.status}">${
                        request.status === 'pending' ? 'Ожидает' : 
                        request.status === 'confirmed' ? 'Подтверждено' : 
                        'Новая'
                    }</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="viewRequest('${request.id}')">Просмотр</button>
                        ${request.status === 'pending' ? 
                            `<button class="btn btn-success btn-sm" onclick="confirmRequest('${request.id}')">Подтвердить</button>` : ''}
                    </td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    if (typeof loadDashboard !== 'undefined') loadDashboard();
}"""
    
    # Заменяем функцию loadRequests
    old_load_requests = r'function loadRequests\(\)[^}]+\{[^}]+\}'
    content = re.sub(old_load_requests, new_load_requests, content, flags=re.DOTALL)
    
    # 3. УЛУЧШАЕМ ПАРСИНГ EXCEL - извлекаем ВСЕ возможные поля
    new_excel_parser = """
    processExcelData(data) {
        console.log('🔍 Полный парсинг Excel данных, записей:', data.length);
        
        if (!data || data.length === 0) {
            console.log('Нет данных для обработки');
            return;
        }
        
        // Словарь возможных названий колонок
        const columnMapping = {
            stationNumber: ['Номер стойки', 'Номер терминала', 'Terminal Number', 'Station Number', 'Mobile Terminal No', 'Стойка'],
            vesselName: ['Судно', 'Название судна', 'Vessel', 'Ship Name', 'Vessel Name', 'Наименование судна'],
            mmsi: ['MMSI', 'ММС', 'ММСИ'],
            imo: ['IMO', 'ИМО'],
            shipOwner: ['Судовладелец', 'Владелец', 'Owner', 'Ship Owner', 'Компания'],
            contactPerson: ['Контактное лицо', 'ФИО', 'Contact Person', 'Ответственный', 'Контакт'],
            email: ['Email', 'E-mail', 'Почта', 'Электронная почта', 'Contact Email'],
            phone: ['Телефон', 'Phone', 'Tel', 'Контактный телефон', 'Тел'],
            address: ['Адрес', 'Address', 'Адрес компании'],
            testDate: ['Дата теста', 'Плановая дата', 'Test Date', 'Дата', 'План тест'],
            terminalType: ['Тип связи', 'Terminal Type', 'Тип терминала', 'Тип'],
            lastTest: ['Последний тест', 'Last Test', 'Дата последнего теста'],
            nextTest: ['Следующий тест', 'Next Test', 'План следующего теста'],
            status: ['Статус', 'Status', 'Состояние'],
            notes: ['Примечания', 'Notes', 'Комментарии', 'Заметки']
        };
        
        // Функция для поиска значения по возможным названиям колонок
        function findValue(row, possibleKeys) {
            for (let key of possibleKeys) {
                // Проверяем точное совпадение
                if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                    return row[key];
                }
                // Проверяем частичное совпадение (без учета регистра)
                for (let rowKey in row) {
                    if (rowKey.toLowerCase().includes(key.toLowerCase())) {
                        if (row[rowKey] !== undefined && row[rowKey] !== null && row[rowKey] !== '') {
                            return row[rowKey];
                        }
                    }
                }
            }
            return '';
        }
        
        // Функция извлечения номера станции из любого поля
        function extractStationNumber(row) {
            // Сначала пробуем найти в соответствующих колонках
            const stationValue = findValue(row, columnMapping.stationNumber);
            if (stationValue) {
                const match = String(stationValue).match(/\\d{9}/);
                if (match) return match[0];
            }
            
            // Если не нашли, ищем во всех полях
            for (let key in row) {
                const value = String(row[key] || '');
                const match = value.match(/\\d{9}/);
                if (match) return match[0];
            }
            return '';
        }
        
        // Определяем тип данных
        const headers = Object.keys(data[0]);
        console.log('Заголовки таблицы:', headers);
        
        const hasTestDate = headers.some(h => 
            columnMapping.testDate.some(key => h.toLowerCase().includes(key.toLowerCase()))
        );
        
        const hasSignalType = headers.some(h => 
            h.toLowerCase().includes('сигнал') || h.toLowerCase().includes('signal')
        );
        
        let requests = [];
        let terminals = [];
        let signals = [];
        
        // Обрабатываем каждую строку
        data.forEach((row, index) => {
            const stationNumber = extractStationNumber(row);
            
            if (!stationNumber) {
                console.log('Пропускаем строку без номера станции:', row);
                return;
            }
            
            // Определяем тип записи
            if (hasTestDate && !hasSignalType) {
                // Это заявка на тестирование
                const request = {
                    id: 'REQ-' + Date.now() + '-' + index,
                    stationNumber: stationNumber,
                    vesselName: findValue(row, columnMapping.vesselName),
                    mmsi: findValue(row, columnMapping.mmsi),
                    imo: findValue(row, columnMapping.imo),
                    shipOwner: findValue(row, columnMapping.shipOwner),
                    contactPerson: findValue(row, columnMapping.contactPerson),
                    email: findValue(row, columnMapping.email),
                    phone: findValue(row, columnMapping.phone),
                    address: findValue(row, columnMapping.address),
                    testDate: findValue(row, columnMapping.testDate),
                    notes: findValue(row, columnMapping.notes),
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                
                // Убираем пустые поля
                Object.keys(request).forEach(key => {
                    if (request[key] === '') delete request[key];
                });
                
                requests.push(request);
                console.log('Добавлена заявка:', request);
                
            } else if (hasSignalType) {
                // Это сигнал
                const signal = {
                    id: 'SIG-' + Date.now() + '-' + index,
                    stationNumber: stationNumber,
                    vesselName: findValue(row, columnMapping.vesselName),
                    mmsi: findValue(row, columnMapping.mmsi),
                    signalType: findValue(row, columnMapping.terminalType) || 'TEST',
                    receivedAt: new Date().toISOString(),
                    status: 'new'
                };
                signals.push(signal);
                console.log('Добавлен сигнал:', signal);
                
            } else {
                // Это терминал
                const terminal = {
                    id: 'T-' + Date.now() + '-' + index,
                    terminal_number: stationNumber,
                    vessel_name: findValue(row, columnMapping.vesselName),
                    mmsi: findValue(row, columnMapping.mmsi),
                    terminal_type: findValue(row, columnMapping.terminalType) || 'INMARSAT',
                    owner: findValue(row, columnMapping.shipOwner),
                    contact_person: findValue(row, columnMapping.contactPerson),
                    email: findValue(row, columnMapping.email),
                    phone: findValue(row, columnMapping.phone),
                    address: findValue(row, columnMapping.address),
                    lastTest: findValue(row, columnMapping.lastTest),
                    nextTest: findValue(row, columnMapping.nextTest),
                    status: findValue(row, columnMapping.status) || 'active',
                    notes: findValue(row, columnMapping.notes)
                };
                
                // Убираем пустые поля
                Object.keys(terminal).forEach(key => {
                    if (terminal[key] === '') delete terminal[key];
                });
                
                terminals.push(terminal);
                console.log('Добавлен терминал:', terminal);
            }
        });
        
        // Сохраняем данные с проверкой дубликатов
        if (requests.length > 0) {
            const existingRequests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            // Проверяем дубликаты по номеру станции и дате
            const newRequests = requests.filter(newReq => 
                !existingRequests.some(existReq => 
                    existReq.stationNumber === newReq.stationNumber && 
                    existReq.testDate === newReq.testDate
                )
            );
            localStorage.setItem('testRequests', JSON.stringify([...existingRequests, ...newRequests]));
            console.log('Добавлено новых заявок:', newRequests.length, 'из', requests.length);
        }
        
        if (terminals.length > 0) {
            const existingTerminals = JSON.parse(localStorage.getItem('ssasTerminals') || '[]');
            // Проверяем дубликаты по номеру терминала
            const newTerminals = terminals.filter(newTerm => 
                !existingTerminals.some(existTerm => 
                    existTerm.terminal_number === newTerm.terminal_number
                )
            );
            localStorage.setItem('ssasTerminals', JSON.stringify([...existingTerminals, ...newTerminals]));
            console.log('Добавлено новых терминалов:', newTerminals.length, 'из', terminals.length);
        }
        
        if (signals.length > 0) {
            const existingSignals = JSON.parse(localStorage.getItem('signals') || '[]');
            localStorage.setItem('signals', JSON.stringify([...existingSignals, ...signals]));
            console.log('Добавлено сигналов:', signals.length);
        }
        
        // Обновляем все таблицы
        if (typeof loadRequests !== 'undefined') loadRequests();
        if (typeof loadTerminals !== 'undefined') loadTerminals();
        if (typeof loadSignals !== 'undefined') loadSignals();
        if (typeof loadDashboard !== 'undefined') loadDashboard();
        
        // Показываем сообщение об успехе
        if (typeof showNotification !== 'undefined') {
            showNotification(`Загружено: ${requests.length} заявок, ${terminals.length} терминалов, ${signals.length} сигналов`, 'success');
        }
    }"""
    
    # Заменяем функцию processExcelData
    excel_process_pattern = r'processExcelData\(data\)[^}]+\{(?:[^{}]|\{[^}]*\})*\}'
    content = re.sub(excel_process_pattern, new_excel_parser, content, flags=re.DOTALL)
    
    # 4. Добавляем функцию подтверждения заявки
    confirm_function = """
function confirmRequest(requestId) {
    console.log('Подтверждение заявки:', requestId);
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const request = requests.find(r => r.id === requestId);
    
    if (request) {
        request.status = 'confirmed';
        request.confirmedAt = new Date().toISOString();
        localStorage.setItem('testRequests', JSON.stringify(requests));
        
        loadRequests();
        loadDashboard();
        
        if (typeof showNotification !== 'undefined') {
            showNotification('Заявка подтверждена', 'success');
        }
    }
}
"""
    
    # Добавляем функцию если её нет
    if 'function confirmRequest' not in content:
        last_script = content.rfind('</script>')
        if last_script > 0:
            content = content[:last_script] + confirm_function + '\n' + content[last_script:]
    
    # Сохраняем файл
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Файл исправлен: {file_path}")
    print("\n📋 Что сделано:")
    print("  ✓ Расширена таблица заявок - добавлены колонки для всех данных")
    print("  ✓ Полный парсинг Excel с извлечением ВСЕХ полей:")
    print("    • Номер стойки (9 цифр)")
    print("    • Название судна")
    print("    • MMSI и IMO")
    print("    • Судовладелец")
    print("    • Контактное лицо (ФИО)")
    print("    • Email")
    print("    • Телефон")
    print("    • Адрес")
    print("    • Даты тестов")
    print("    • Примечания")
    print("  ✓ Автоматическое определение типа данных")
    print("  ✓ Проверка дубликатов при загрузке")
    print("  ✓ Кнопка подтверждения заявок")
    print("\n⚠️ Обновите страницу (Ctrl+F5) и загрузите Excel файл заново")

if __name__ == "__main__":
    fix_complete_excel_parsing()
    print("\n✨ Готово!")