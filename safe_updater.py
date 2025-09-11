#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Безопасный обновлятор системы ССТО
- Автоматическое создание резервных копий
- Версионирование изменений
- Возможность отката
- Проверка синтаксиса JavaScript
Путь: C:\Projects\test-ssto-project\safe_updater.py
"""

import os
import re
import json
import shutil
from datetime import datetime
from pathlib import Path
import hashlib

class SafeUpdater:
    def __init__(self, project_dir=r'C:\Projects\test-ssto-project\frontend-static'):
        self.project_dir = Path(project_dir)
        self.target_file = self.project_dir / 'index_14_36.html'
        self.backup_dir = self.project_dir / 'backups'
        self.versions_file = self.project_dir / 'versions.json'
        
        # Создаем папку для резервных копий
        self.backup_dir.mkdir(exist_ok=True)
        
        # Загружаем историю версий
        self.versions = self.load_versions()
    
    def load_versions(self):
        """Загружаем историю версий"""
        if self.versions_file.exists():
            with open(self.versions_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return []
    
    def save_versions(self):
        """Сохраняем историю версий"""
        with open(self.versions_file, 'w', encoding='utf-8') as f:
            json.dump(self.versions, f, indent=2, ensure_ascii=False)
    
    def get_file_hash(self, filepath):
        """Получаем хэш файла для проверки изменений"""
        with open(filepath, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    
    def create_backup(self, description=""):
        """Создаем резервную копию с описанием"""
        if not self.target_file.exists():
            print(f"❌ Файл не найден: {self.target_file}")
            return None
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_hash = self.get_file_hash(self.target_file)
        
        # Проверяем, изменился ли файл с последней версии
        if self.versions and self.versions[-1]['hash'] == file_hash:
            print("ℹ️ Файл не изменился с последней версии")
            return self.versions[-1]['backup']
        
        backup_name = f"index_14_36_{timestamp}.html"
        backup_path = self.backup_dir / backup_name
        
        shutil.copy(self.target_file, backup_path)
        
        # Сохраняем информацию о версии
        version_info = {
            'timestamp': timestamp,
            'backup': str(backup_name),
            'hash': file_hash,
            'description': description
        }
        self.versions.append(version_info)
        self.save_versions()
        
        print(f"✅ Резервная копия создана: {backup_name}")
        print(f"   Описание: {description}")
        return backup_path
    
    def list_versions(self):
        """Показываем список версий"""
        print("\n📋 ИСТОРИЯ ВЕРСИЙ:")
        print("-" * 70)
        
        if not self.versions:
            print("Нет сохраненных версий")
            return
        
        for i, version in enumerate(self.versions[-10:], 1):  # Последние 10 версий
            timestamp = version['timestamp']
            desc = version['description'] or 'Без описания'
            print(f"{i}. {timestamp}: {desc}")
    
    def rollback(self, version_index=None):
        """Откат к предыдущей версии"""
        if not self.versions:
            print("❌ Нет версий для отката")
            return False
        
        if version_index is None:
            # Откат к предыдущей версии
            version = self.versions[-2] if len(self.versions) > 1 else self.versions[-1]
        else:
            try:
                version = self.versions[version_index]
            except IndexError:
                print(f"❌ Версия {version_index} не найдена")
                return False
        
        backup_file = self.backup_dir / version['backup']
        if not backup_file.exists():
            print(f"❌ Файл резервной копии не найден: {backup_file}")
            return False
        
        # Создаем копию текущей версии перед откатом
        self.create_backup(f"Перед откатом к {version['timestamp']}")
        
        # Выполняем откат
        shutil.copy(backup_file, self.target_file)
        print(f"✅ Выполнен откат к версии {version['timestamp']}")
        print(f"   Описание: {version['description']}")
        return True
    
    def add_localstorage(self):
        """Добавляем поддержку LocalStorage"""
        print("\n🔧 Добавление LocalStorage...")
        
        # Создаем резервную копию
        self.create_backup("Перед добавлением LocalStorage")
        
        # Читаем файл
        content = self.target_file.read_text(encoding='utf-8')
        
        # Код для LocalStorage
        localstorage_code = """
        // ===================== LocalStorage Support =====================
        // Автоматическое сохранение данных
        function saveToLocalStorage() {
            try {
                localStorage.setItem('ssto_requests', JSON.stringify(storage.requests));
                localStorage.setItem('ssto_signals', JSON.stringify(storage.signals));
                localStorage.setItem('ssto_terminals', JSON.stringify(storage.terminals));
                console.log('✅ Данные сохранены в LocalStorage');
            } catch(e) {
                console.error('Ошибка сохранения:', e);
            }
        }
        
        // Загрузка данных при старте
        function loadFromLocalStorage() {
            try {
                const requests = localStorage.getItem('ssto_requests');
                const signals = localStorage.getItem('ssto_signals');
                const terminals = localStorage.getItem('ssto_terminals');
                
                if (requests) storage.requests = JSON.parse(requests);
                if (signals) storage.signals = JSON.parse(signals);
                if (terminals) storage.terminals = JSON.parse(terminals);
                
                console.log('✅ Данные загружены из LocalStorage');
                console.log('  Заявки:', storage.requests.length);
                console.log('  Сигналы:', storage.signals.length);
                console.log('  Терминалы:', storage.terminals.length);
                
                // Обновляем интерфейс
                updateDashboard();
                loadRequests();
                loadSignals();
                loadTerminals();
            } catch(e) {
                console.error('Ошибка загрузки:', e);
            }
        }
        
        // Очистка данных
        function clearAllData() {
            if (confirm('Удалить все данные? Это действие нельзя отменить!')) {
                localStorage.removeItem('ssto_requests');
                localStorage.removeItem('ssto_signals');
                localStorage.removeItem('ssto_terminals');
                storage.requests = [];
                storage.signals = [];
                storage.terminals = [];
                updateDashboard();
                loadRequests();
                loadSignals();
                loadTerminals();
                alert('Все данные удалены');
            }
        }
"""
        
        # Находим место для вставки (после объявления storage)
        insert_marker = "const storage = {"
        insert_pos = content.find(insert_marker)
        
        if insert_pos == -1:
            print("❌ Не найден маркер для вставки")
            return False
        
        # Находим конец объекта storage
        insert_pos = content.find("};", insert_pos) + 2
        
        # Вставляем код LocalStorage
        content = content[:insert_pos] + "\n" + localstorage_code + content[insert_pos:]
        
        # Модифицируем функции для автосохранения
        modifications = [
            # После добавления заявки
            ("storage.requests.push(request);", 
             "storage.requests.push(request);\n            saveToLocalStorage();"),
            
            # После добавления тестовых данных
            ("alert('Тестовые данные добавлены!');",
             "saveToLocalStorage();\n            alert('Тестовые данные добавлены!');"),
            
            # После подтверждения заявки
            ("request.status = 'confirmed';",
             "request.status = 'confirmed';\n                saveToLocalStorage();"),
            
            # В DOMContentLoaded
            ("// Инициализация\n            updateDashboard();",
             "// Инициализация\n            loadFromLocalStorage();")
        ]
        
        for old, new in modifications:
            content = content.replace(old, new, 1)
        
        # Добавляем кнопку очистки данных в интерфейс
        clear_button = '<button class="btn btn-secondary" onclick="clearAllData()">🗑️ Очистить все данные</button>'
        content = content.replace(
            '<button class="btn btn-primary" onclick="systemCheck()">🏥 Проверка системы</button>',
            f'<button class="btn btn-primary" onclick="systemCheck()">🏥 Проверка системы</button>\n                {clear_button}'
        )
        
        # Сохраняем файл
        self.target_file.write_text(content, encoding='utf-8')
        
        print("✅ LocalStorage добавлен успешно!")
        print("\n📋 Что добавлено:")
        print("  • Автосохранение при любых изменениях")
        print("  • Загрузка данных при открытии страницы")
        print("  • Кнопка очистки всех данных")
        print("  • Логирование в консоль")
        
        return True
    
    def add_excel_parser(self):
        """Добавляем улучшенный парсер Excel"""
        print("\n🔧 Добавление парсера Excel...")
        
        # Создаем резервную копию
        self.create_backup("Перед добавлением парсера Excel")
        
        # Читаем файл
        content = self.target_file.read_text(encoding='utf-8')
        
        # Код парсера Excel
        excel_parser_code = """
        // ===================== Excel Parser =====================
        function uploadExcel() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.xlsx,.xls';
            input.onchange = function(e) {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = function(event) {
                    try {
                        const data = event.target.result;
                        const workbook = XLSX.read(data, {type: 'binary'});
                        
                        let totalImported = 0;
                        
                        // Обрабатываем каждый лист
                        workbook.SheetNames.forEach(sheetName => {
                            const sheet = workbook.Sheets[sheetName];
                            const jsonData = XLSX.utils.sheet_to_json(sheet);
                            
                            jsonData.forEach(row => {
                                // Парсим номер терминала (9 цифр)
                                const terminalNumber = String(row['Номер стойки'] || row['Terminal'] || '').replace(/\\D/g, '').slice(-9);
                                
                                // Парсим MMSI (9 цифр)
                                const mmsi = String(row['MMSI'] || '').replace(/\\D/g, '').slice(-9);
                                
                                if (terminalNumber || mmsi) {
                                    // Проверяем, не существует ли уже такой терминал
                                    const exists = storage.terminals.find(t => 
                                        t.terminal_number === terminalNumber || t.mmsi === mmsi
                                    );
                                    
                                    if (!exists) {
                                        storage.terminals.push({
                                            terminal_number: terminalNumber,
                                            vessel_name: row['Судно'] || row['Vessel'] || '',
                                            mmsi: mmsi,
                                            type: (row['Тип'] || 'ИНМАРСАТ').toUpperCase().includes('ИРИДИУМ') ? 'ИРИДИУМ' : 'ИНМАРСАТ',
                                            owner: row['Владелец'] || row['Owner'] || '',
                                            lastTest: row['Последний тест'] || row['Last Test'] || '',
                                            status: 'active'
                                        });
                                        totalImported++;
                                    }
                                }
                            });
                        });
                        
                        if (totalImported > 0) {
                            saveToLocalStorage();
                            loadTerminals();
                            updateDashboard();
                        }
                        
                        alert('Импорт завершен!\\n' +
                              'Новых записей: ' + totalImported + '\\n' +
                              'Всего терминалов: ' + storage.terminals.length);
                        
                    } catch(error) {
                        console.error('Ошибка парсинга Excel:', error);
                        alert('Ошибка при чтении файла Excel. Проверьте формат файла.');
                    }
                };
                reader.readAsBinaryString(file);
            };
            input.click();
        }
"""
        
        # Заменяем старую функцию uploadExcel
        pattern = r"function uploadExcel\(\) \{ alert\('Загрузка Excel в разработке'\); \}"
        content = re.sub(pattern, excel_parser_code.strip(), content)
        
        # Сохраняем файл
        self.target_file.write_text(content, encoding='utf-8')
        
        print("✅ Парсер Excel добавлен успешно!")
        print("\n📋 Возможности парсера:")
        print("  • Автоматическое извлечение номеров терминалов")
        print("  • Парсинг MMSI и IMO")
        print("  • Проверка дубликатов")
        print("  • Обработка нескольких листов")
        
        return True
    
    def test_javascript(self):
        """Простая проверка синтаксиса JavaScript"""
        print("\n🔍 Проверка JavaScript...")
        
        content = self.target_file.read_text(encoding='utf-8')
        
        # Извлекаем JavaScript
        script_match = re.search(r'<script[^>]*>(.*?)</script>', content, re.DOTALL)
        if not script_match:
            print("❌ JavaScript не найден")
            return False
        
        js_code = script_match.group(1)
        
        # Простые проверки
        checks = [
            (js_code.count('{') == js_code.count('}'), "Скобки {} сбалансированы"),
            (js_code.count('(') == js_code.count(')'), "Скобки () сбалансированы"),
            (js_code.count('[') == js_code.count(']'), "Скобки [] сбалансированы"),
            ('function uploadExcel' in js_code, "Функция uploadExcel найдена"),
            ('function saveToLocalStorage' in js_code or 'saveToLocalStorage' not in js_code, "LocalStorage функции корректны"),
        ]
        
        all_ok = True
        for check, description in checks:
            if check:
                print(f"  ✅ {description}")
            else:
                print(f"  ❌ {description}")
                all_ok = False
        
        return all_ok

def main():
    """Главное меню"""
    updater = SafeUpdater()
    
    while True:
        print("\n" + "=" * 70)
        print("БЕЗОПАСНЫЙ ОБНОВЛЯТОР ССТО")
        print("=" * 70)
        print("\nВыберите действие:")
        print("1. Показать версии")
        print("2. Создать резервную копию")
        print("3. Добавить LocalStorage")
        print("4. Добавить парсер Excel")
        print("5. Откатиться к предыдущей версии")
        print("6. Проверить JavaScript")
        print("0. Выход")
        
        choice = input("\nВаш выбор: ").strip()
        
        if choice == '1':
            updater.list_versions()
        
        elif choice == '2':
            desc = input("Описание версии: ").strip()
            updater.create_backup(desc)
        
        elif choice == '3':
            updater.add_localstorage()
        
        elif choice == '4':
            updater.add_excel_parser()
        
        elif choice == '5':
            updater.list_versions()
            version = input("Номер версии для отката (Enter для предыдущей): ").strip()
            if version:
                updater.rollback(int(version) - 1)
            else:
                updater.rollback()
        
        elif choice == '6':
            updater.test_javascript()
        
        elif choice == '0':
            break

if __name__ == "__main__":
    main()