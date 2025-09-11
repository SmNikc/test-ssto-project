#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для добавления класса ExcelLoader в восстановленный файл
Путь для сохранения: C:\Projects\test-ssto-project\add_excel_loader.py
"""

import os
from datetime import datetime

def add_excel_loader():
    """Добавляет класс ExcelLoader в файл"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    print("=" * 70)
    print("ДОБАВЛЕНИЕ КЛАССА ExcelLoader")
    print("=" * 70)
    
    # Создаем резервную копию
    backup_path = f"{file_path}.before_excel_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Читаем файл
    print("\n📖 Чтение файла...")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        print(f"   ✅ Файл прочитан: {len(content)} символов")
        
        # Сохраняем резервную копию
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   💾 Резервная копия: {os.path.basename(backup_path)}")
    except Exception as e:
        print(f"❌ ОШИБКА при чтении: {str(e)}")
        return False
    
    # Проверяем, есть ли уже ExcelLoader
    if 'class ExcelLoader' in content or 'ExcelLoader' in content:
        print("\n✅ ExcelLoader уже существует в файле")
        return True
    
    print("\n🔧 Добавление класса ExcelLoader...")
    
    # Класс ExcelLoader
    excel_loader_code = """
// ============= КЛАСС ДЛЯ ЗАГРУЗКИ EXCEL =============
class ExcelLoader {
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

    openFileDialog() {
        const input = document.getElementById('excel-upload');
        if (input) {
            input.click();
        }
    }

    loadExcelFile(file) {
        console.log('📂 Загрузка файла:', file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                
                // Обрабатываем каждый лист
                let allData = [];
                workbook.SheetNames.forEach(sheetName => {
                    console.log('📄 Обработка листа:', sheetName);
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    allData = allData.concat(jsonData);
                });
                
                console.log('📊 Всего строк данных:', allData.length);
                this.processExcelData(allData);
                
            } catch (error) {
                console.error('❌ Ошибка загрузки:', error);
                alert('Ошибка загрузки файла: ' + error.message);
            }
        };
        
        reader.onerror = () => {
            alert('Ошибка чтения файла');
        };
        
        reader.readAsBinaryString(file);
    }

    processExcelData(data) {
        console.log('🔄 Обработка данных Excel, записей:', data.length);
        
        if (!data || data.length === 0) {
            alert('Файл не содержит данных');
            return;
        }
        
        let requests = [];
        let terminals = [];
        
        // Обрабатываем каждую строку
        data.forEach((row, index) => {
            // Извлекаем номер станции (9 цифр)
            let stationNumber = '';
            
            // Ищем номер станции в разных полях
            for (let key in row) {
                const value = String(row[key] || '');
                // Ищем 9 цифр подряд
                const matches = value.match(/[0-9]{9}/);
                if (matches) {
                    stationNumber = matches[0];
                    break;
                }
            }
            
            if (!stationNumber) {
                console.log('Пропускаем строку', index, '- нет номера станции');
                return;
            }
            
            // Определяем тип записи
            // Если есть поле с датой теста - это заявка
            let hasTestDate = false;
            let testDate = '';
            
            for (let key in row) {
                if (key.toLowerCase().includes('дата') || 
                    key.toLowerCase().includes('тест') || 
                    key.toLowerCase().includes('план')) {
                    if (row[key]) {
                        hasTestDate = true;
                        testDate = String(row[key]);
                        break;
                    }
                }
            }
            
            if (hasTestDate) {
                // Создаем заявку
                const request = {
                    id: 'REQ-' + Date.now() + '-' + index,
                    stationNumber: stationNumber,
                    vesselName: row['Судно'] || row['Название судна'] || row['Vessel'] || '',
                    mmsi: row['MMSI'] || row['ММС'] || '',
                    imo: row['IMO'] || row['ИМО'] || '',
                    testDate: testDate,
                    status: 'pending',
                    createdAt: new Date().toISOString()
                };
                
                requests.push(request);
                console.log('Добавлена заявка:', stationNumber);
            } else {
                // Создаем терминал
                const terminal = {
                    id: 'T-' + Date.now() + '-' + index,
                    terminal_number: stationNumber,
                    vessel_name: row['Судно'] || row['Vessel'] || '',
                    mmsi: row['MMSI'] || '',
                    terminal_type: row['Тип связи'] || row['Type'] || 'INMARSAT',
                    owner: row['Владелец'] || row['Owner'] || '',
                    status: 'active'
                };
                
                terminals.push(terminal);
                console.log('Добавлен терминал:', stationNumber);
            }
        });
        
        // Сохраняем в localStorage
        if (requests.length > 0) {
            const existingRequests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            localStorage.setItem('testRequests', JSON.stringify([...existingRequests, ...requests]));
            console.log('Сохранено заявок:', requests.length);
        }
        
        if (terminals.length > 0) {
            const existingTerminals = JSON.parse(localStorage.getItem('ssasTerminals') || '[]');
            localStorage.setItem('ssasTerminals', JSON.stringify([...existingTerminals, ...terminals]));
            console.log('Сохранено терминалов:', terminals.length);
        }
        
        // Обновляем интерфейс
        if (typeof loadRequests === 'function') loadRequests();
        if (typeof loadTerminals === 'function') loadTerminals();
        if (typeof loadDashboard === 'function') loadDashboard();
        
        alert('Загружено: ' + requests.length + ' заявок, ' + terminals.length + ' терминалов');
    }
}

// Создаем экземпляр ExcelLoader
window.excelLoader = new ExcelLoader();

// ============= КОНЕЦ КЛАССА ExcelLoader =============
"""
    
    # Находим место для вставки - перед закрывающим </script>
    last_script_pos = content.rfind('</script>')
    if last_script_pos > 0:
        # Вставляем код
        content = content[:last_script_pos] + excel_loader_code + '\n' + content[last_script_pos:]
        print("   ✅ Класс ExcelLoader добавлен")
    else:
        print("❌ Не найдено место для вставки кода")
        return False
    
    # Сохраняем файл
    print("\n💾 Сохранение файла...")
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Файл сохранен: {file_path}")
    except Exception as e:
        print(f"❌ ОШИБКА при сохранении: {str(e)}")
        return False
    
    # Проверка
    print("\n🔍 Проверка...")
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        final_content = f.read()
    
    if 'class ExcelLoader' in final_content:
        print("   ✅ ExcelLoader успешно добавлен")
        print("\n" + "=" * 70)
        print("✅ ГОТОВО!")
        print("\n⚠️ Теперь:")
        print("  1. Обновите страницу в браузере: Ctrl+F5")
        print("  2. Попробуйте загрузить Excel файл")
        print("  3. Проверьте консоль браузера (F12)")
        return True
    else:
        print("   ❌ ExcelLoader не найден после добавления")
        return False

if __name__ == "__main__":
    add_excel_loader()
    print("\n✨ Скрипт завершен")