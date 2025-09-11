#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Финальный скрипт обновления index.html для проекта ТЕСТ ССТО
Версия: 3.0 - работает с актуальным файлом из проекта
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

def analyze_file_structure(content):
    """Анализирует структуру файла для диагностики"""
    print("\n📊 Анализ структуры файла:")
    
    # Поиск ключевых элементов
    patterns = {
        'loadRequests': r'loadRequests',
        'loadSignals': r'loadSignals',
        'loadTerminals': r'loadTerminals',
        'ExcelDataLoader': r'ExcelDataLoader',
        'VesselDB': r'VesselDB',
        'requests-tbody': r'requests-tbody',
        'signals-tbody': r'signals-tbody',
        'terminals-tbody': r'terminals-tbody'
    }
    
    for name, pattern in patterns.items():
        matches = re.findall(pattern, content)
        if matches:
            print(f"  ✓ {name}: найдено {len(matches)} раз")
        else:
            print(f"  ✗ {name}: НЕ НАЙДЕНО")
    
    # Проверка наличия IMO в таблицах
    if 'request.imo' in content:
        print("  ✓ IMO уже есть в loadRequests")
    else:
        print("  ✗ IMO отсутствует в loadRequests")
    
    return True

def add_imo_to_tables(content):
    """Добавляет колонку IMO во все таблицы"""
    changes_made = False
    
    # 1. Добавить IMO в HTML заголовки таблицы заявок
    if '<th>MMSI</th>' in content and '<th>IMO</th>' not in content:
        content = content.replace(
            '<th>MMSI</th>\n                        <th>Дата теста</th>',
            '<th>MMSI</th>\n                        <th>IMO</th>\n                        <th>Дата теста</th>'
        )
        # Альтернативный формат
        content = content.replace(
            '<th>MMSI</th>\n                    <th>Дата теста</th>',
            '<th>MMSI</th>\n                    <th>IMO</th>\n                    <th>Дата теста</th>'
        )
        print("  ✓ Добавлен заголовок IMO в таблицу заявок")
        changes_made = True
    
    # 2. Добавить IMO в функцию loadRequests
    if 'function loadRequests' in content and 'request.imo' not in content:
        # Найти место после request.mmsi
        pattern = r'(\$\{request\.mmsi\})</td>'
        replacement = r'\1</td>\n                    <td>${request.imo || \'-\'}</td>'
        content = re.sub(pattern, replacement, content)
        print("  ✓ Добавлено поле IMO в loadRequests")
        changes_made = True
    
    # 3. Добавить IMO в HTML заголовки таблицы сигналов
    signals_header_pattern = r'(<th>MMSI</th>\s*<th>Тип</th>)'
    if re.search(signals_header_pattern, content):
        content = re.sub(
            signals_header_pattern,
            r'<th>MMSI</th>\n                    <th>IMO</th>\n                    <th>Тип</th>',
            content
        )
        print("  ✓ Добавлен заголовок IMO в таблицу сигналов")
        changes_made = True
    
    # 4. Добавить IMO в функцию loadSignals
    if 'function loadSignals' in content and not re.search(r'vessel\.imo|signal\.imo', content):
        # Найти место после signal.mmsi
        pattern = r'(\$\{signal\.mmsi \|\| \'-\'\})</td>'
        replacement = r'\1</td>\n                    <td>${vessel ? vessel.imo || \'-\' : \'-\'}</td>'
        content = re.sub(pattern, replacement, content)
        print("  ✓ Добавлено поле IMO в loadSignals")
        changes_made = True
    
    return content, changes_made

def add_excel_loader_improvements(content):
    """Добавляет улучшения в ExcelDataLoader если он существует"""
    changes_made = False
    
    # Проверяем наличие класса
    if 'class ExcelDataLoader' not in content:
        print("  ⚠ Класс ExcelDataLoader не найден")
        return content, False
    
    # Добавляем метод parseVesselName если его нет
    if 'parseVesselName' not in content:
        # Найти место после constructor для вставки метода
        insert_position = content.find('setupHandlers() {')
        if insert_position > 0:
            # Найти конец метода setupHandlers
            brace_count = 0
            i = insert_position
            while i < len(content):
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        # Вставить новый метод после setupHandlers
                        new_method = '''

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
            }'''
                        content = content[:i+1] + new_method + content[i+1:]
                        print("  ✓ Добавлен метод parseVesselName в ExcelDataLoader")
                        changes_made = True
                        break
                i += 1
    
    return content, changes_made

def main():
    filepath = 'index.html'
    
    if not os.path.exists(filepath):
        print(f"❌ Файл {filepath} не найден!")
        print("Убедитесь, что скрипт запущен в папке проекта")
        return
    
    print(f"📄 Обработка файла: {filepath}")
    print(f"📏 Размер: {os.path.getsize(filepath):,} байт")
    
    backup_path = backup_file(filepath)
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Анализ файла
        analyze_file_structure(content)
        
        print("\n🔧 Применение изменений:")
        
        total_changes = False
        
        # 1. Добавление IMO в таблицы
        print("\n1. Добавление колонки IMO:")
        content, changes1 = add_imo_to_tables(content)
        total_changes = total_changes or changes1
        
        # 2. Улучшение ExcelDataLoader
        print("\n2. Улучшение ExcelDataLoader:")
        content, changes2 = add_excel_loader_improvements(content)
        total_changes = total_changes or changes2
        
        if total_changes:
            # Сохранение
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"\n✅ Файл успешно обновлен!")
            print(f"📏 Новый размер: {len(content):,} символов")
        else:
            print("\n✅ Изменения не требуются, файл уже актуален")
        
        print(f"\n💾 Резервная копия: {backup_path}")
        print(f"🔄 Для отката используйте:")
        print(f"    Windows: copy {backup_path} {filepath}")
        print(f"    Linux/Mac: cp {backup_path} {filepath}")
        
    except Exception as e:
        print(f"\n❌ Ошибка: {e}")
        print(f"🔄 Восстановление из резервной копии...")
        shutil.copy2(backup_path, filepath)
        print(f"✅ Файл восстановлен")

if __name__ == "__main__":
    main()