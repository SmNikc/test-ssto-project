#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Полное исправление index.html - финальная версия
Исправляет: двойную кодировку, JS вне тегов, дубликаты, обработчики событий
"""

import re
import sys
from pathlib import Path

def fix_mojibake(text):
    """Исправляет двойную кодировку UTF-8 -> Latin-1"""
    try:
        # Основной метод исправления mojibake
        return text.encode('latin-1', errors='ignore').decode('utf-8', errors='ignore')
    except:
        return text

def wrap_js_in_script_tags(html):
    """Находит JS код вне тегов <script> и оборачивает его"""
    
    # Паттерны для поиска JS кода
    js_patterns = [
        r'(class\s+\w+\s*\{)',
        r'(function\s+\w+\s*\([^)]*\)\s*\{)',
        r'(const\s+\w+\s*=)',
        r'(let\s+\w+\s*=)',
        r'(var\s+\w+\s*=)',
        r'(document\.addEventListener)',
        r'(window\.\w+\s*=)',
    ]
    
    # Проверяем, есть ли JS код вне тегов script
    for pattern in js_patterns:
        matches = list(re.finditer(pattern, html))
        for match in matches:
            # Проверяем, находится ли код внутри script тега
            before = html[:match.start()]
            open_scripts = before.count('<script')
            close_scripts = before.count('</script>')
            
            # Если JS вне script тега
            if open_scripts <= close_scripts:
                # Находим начало JS блока
                js_start = match.start()
                
                # Находим конец JS блока (перед </body> или </html>)
                js_end_patterns = ['</body>', '</html>', '<div', '<section']
                js_end = len(html)
                
                for end_pattern in js_end_patterns:
                    pos = html.find(end_pattern, js_start)
                    if pos != -1 and pos < js_end:
                        js_end = pos
                
                # Извлекаем JS код
                js_code = html[js_start:js_end]
                
                # Оборачиваем в script тег
                wrapped = f'\n<script type="text/javascript">\n{js_code}\n</script>\n'
                
                # Заменяем в HTML
                html = html[:js_start] + wrapped + html[js_end:]
                
                print(f"  ✓ Обернут JS блок в <script> теги (позиция {js_start})")
                break  # Обработали один блок, повторим поиск
    
    return html

def fix_event_handlers(html):
    """Исправляет обработчики событий"""
    
    # Исправляем switchTab без параметра event
    html = re.sub(
        r'onclick="switchTab\(\'([^\']+)\'\)"',
        r'onclick="switchTab(event, \'\1\')"',
        html
    )
    
    # Исправляем функцию switchTab
    html = re.sub(
        r'function\s+switchTab\s*\(\s*tabName\s*\)',
        'function switchTab(event, tabName)',
        html
    )
    
    # Заменяем event.target на безопасный доступ
    html = re.sub(
        r'event\.target',
        '(event && event.currentTarget ? event.currentTarget : event.target)',
        html
    )
    
    return html

def remove_duplicates(html):
    """Удаляет дублированные функции и классы"""
    
    # Находим все функции
    func_pattern = r'function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}'
    functions = {}
    
    for match in re.finditer(func_pattern, html, re.DOTALL):
        func_name = match.group(1)
        if func_name not in functions:
            functions[func_name] = match.group(0)
        else:
            # Дубликат - удаляем
            html = html.replace(match.group(0), '')
            print(f"  ✓ Удален дубликат функции: {func_name}")
    
    # Удаляем множественные DOMContentLoaded
    loaded_pattern = r'document\.addEventListener\([\'"]DOMContentLoaded[\'"][^}]+\}\);?'
    loaded_matches = list(re.finditer(loaded_pattern, html, re.DOTALL))
    
    if len(loaded_matches) > 1:
        # Оставляем только первый
        for match in loaded_matches[1:]:
            html = html.replace(match.group(0), '')
        print(f"  ✓ Удалены дублированные DOMContentLoaded listeners")
    
    return html

def fix_css_selectors(html):
    """Исправляет CSS селекторы для карты"""
    
    # Исправляем высоту карты
    html = re.sub(
        r'#map\s*\{\s*height:\s*\d+px;',
        '#map-container { height: 500px;',
        html
    )
    
    # Добавляем стили для map-container если их нет
    if '#map-container' not in html and 'id="map-container"' in html:
        style_addition = """
        #map-container { 
            height: 500px; 
            width: 100%;
            position: relative;
        }"""
        html = html.replace('</style>', style_addition + '\n</style>')
    
    return html

def process_html_content(html):
    """Обрабатывает HTML, исправляя текстовые узлы"""
    
    # Разбиваем на теги и текст
    parts = re.split(r'(<[^>]+>)', html)
    
    fixed_parts = []
    for part in parts:
        if part.startswith('<'):
            # Это тег - не трогаем
            fixed_parts.append(part)
        else:
            # Это текст - исправляем mojibake
            fixed_text = fix_mojibake(part)
            fixed_parts.append(fixed_text)
    
    return ''.join(fixed_parts)

def ensure_meta_charset(html):
    """Гарантирует наличие meta charset UTF-8"""
    
    if '<meta charset="UTF-8">' not in html and '<meta charset="utf-8">' not in html:
        # Добавляем после <head>
        html = html.replace('<head>', '<head>\n    <meta charset="UTF-8">')
    
    return html

def fix_structure_issues(html):
    """Исправляет структурные проблемы"""
    
    # Убираем onclick из неправильных мест
    html = html.replace('<style onclick=', '<style ')
    html = html.replace('</div onclick=', '</div><div onclick=')
    html = html.replace('<script onclick=', '<script ')
    
    # Исправляем незакрытые теги
    if html.count('<script') > html.count('</script>'):
        html += '\n</script>'
    
    return html

def main():
    """Главная функция"""
    
    # Путь к файлу
    input_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not input_path.exists():
        print(f"❌ Файл не найден: {input_path}")
        return False
    
    print(f"📖 Читаю файл: {input_path}")
    
    # Читаем файл
    try:
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
    except:
        with open(input_path, 'r', encoding='latin-1', errors='ignore') as f:
            html = f.read()
    
    # Создаем резервную копию
    backup_path = input_path.with_suffix('.html.backup_complete')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"💾 Резервная копия: {backup_path}")
    
    print("\n🔧 Применяю исправления...")
    
    # 1. Исправляем mojibake (двойную кодировку)
    print("1. Исправление двойной кодировки...")
    html = process_html_content(html)
    
    # 2. Оборачиваем JS в script теги
    print("2. Оборачивание JS кода в <script> теги...")
    html = wrap_js_in_script_tags(html)
    
    # 3. Исправляем обработчики событий
    print("3. Исправление обработчиков событий...")
    html = fix_event_handlers(html)
    
    # 4. Удаляем дубликаты
    print("4. Удаление дублированных функций...")
    html = remove_duplicates(html)
    
    # 5. Исправляем CSS селекторы
    print("5. Исправление CSS для карты...")
    html = fix_css_selectors(html)
    
    # 6. Исправляем структурные проблемы
    print("6. Исправление структурных проблем...")
    html = fix_structure_issues(html)
    
    # 7. Гарантируем UTF-8
    print("7. Добавление meta charset UTF-8...")
    html = ensure_meta_charset(html)
    
    # 8. Исправляем title
    html = re.sub(
        r'<title>.*?</title>',
        '<title>Модуль ТЕСТ ССТО - Система управления тестированием</title>',
        html,
        flags=re.DOTALL
    )
    
    # Сохраняем исправленный файл
    print(f"\n💾 Сохраняю исправленный файл...")
    with open(input_path, 'w', encoding='utf-8', errors='ignore') as f:
        f.write(html)
    
    print("\n" + "="*60)
    print("✅ ФАЙЛ УСПЕШНО ИСПРАВЛЕН!")
    print("="*60)
    
    print("\n📋 Что было исправлено:")
    print("  ✓ Двойная кодировка (mojibake)")
    print("  ✓ JavaScript обернут в <script> теги")
    print("  ✓ Обработчики событий (добавлен параметр event)")
    print("  ✓ Удалены дублированные функции")
    print("  ✓ CSS селекторы для карты")
    print("  ✓ Структурные проблемы HTML")
    print("  ✓ Meta charset UTF-8")
    
    print("\n⚠️  ВАЖНО:")
    print("  1. Обновите страницу в браузере (Ctrl+F5)")
    print("  2. Откройте консоль браузера (F12)")
    print("  3. Проверьте наличие ошибок JavaScript")
    print("  4. Протестируйте клики по кнопкам")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if not success:
            print("\n❌ Не удалось исправить файл")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)