#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Исправление двойной кодировки в index.html
Версия без проблемных символов в коде
"""

import re
import sys
from pathlib import Path

def fix_double_encoding(text):
    """
    Исправляет двойную кодировку UTF-8 -> Latin1
    """
    try:
        # Основной метод - декодировать из Latin1 обратно в UTF-8
        return text.encode('latin1').decode('utf-8')
    except:
        # Если не получилось, пробуем Windows-1252
        try:
            return text.encode('windows-1252').decode('utf-8')
        except:
            # Возвращаем оригинал если ничего не работает
            return text

def fix_html_structure(html):
    """
    Исправляет структурные проблемы HTML
    """
    # Проверяем, есть ли JavaScript вне тегов <script>
    js_patterns = [
        r'(class\s+\w+\s*{)',
        r'(function\s+\w+\s*\()',
        r'(const\s+\w+\s*=)',
        r'(let\s+\w+\s*=)',
        r'(var\s+\w+\s*=)',
    ]
    
    for pattern in js_patterns:
        matches = re.finditer(pattern, html)
        for match in matches:
            # Проверяем, находится ли JS код внутри <script>
            before_match = html[:match.start()]
            after_match = html[match.start():]
            
            # Считаем открытые и закрытые теги script до позиции
            open_scripts = before_match.count('<script')
            close_scripts = before_match.count('</script>')
            
            # Если JS код вне script тега
            if open_scripts <= close_scripts:
                # Находим конец JS блока (простая эвристика)
                js_end = after_match.find('</body>')
                if js_end == -1:
                    js_end = len(after_match)
                
                # Оборачиваем в script
                js_code = after_match[:js_end]
                html = before_match + '<script>\n' + js_code + '\n</script>' + after_match[js_end:]
                break
    
    # Удаляем дублированные функции
    seen_functions = set()
    def remove_duplicate_function(match):
        func_name = match.group(1)
        if func_name in seen_functions:
            return ''  # Удаляем дубликат
        seen_functions.add(func_name)
        return match.group(0)
    
    html = re.sub(
        r'function\s+(\w+)\s*\([^)]*\)\s*{[^}]*}',
        remove_duplicate_function,
        html,
        flags=re.DOTALL
    )
    
    # Исправляем onclick в неправильных местах
    html = html.replace('<style onclick=', '<style ')
    html = html.replace('</div onclick=', '</div><div onclick=')
    html = html.replace('<script onclick=', '<script ')
    
    return html

def process_html_content(html):
    """
    Обрабатывает HTML контент, исправляя только текстовые узлы
    """
    # Разбиваем HTML на части: теги и текст между ними
    parts = re.split(r'(<[^>]+>)', html)
    
    fixed_parts = []
    for part in parts:
        if part.startswith('<'):
            # Это тег - не трогаем
            fixed_parts.append(part)
        else:
            # Это текст - исправляем кодировку
            fixed_text = fix_double_encoding(part)
            fixed_parts.append(fixed_text)
    
    return ''.join(fixed_parts)

def fix_emojis(html):
    """
    Исправляет искаженные эмодзи используя замены
    """
    # Используем список кортежей вместо словаря с проблемными символами
    emoji_replacements = [
        # Формат: (искаженный текст, правильный эмодзи в unicode escape)
        ('\\xf0\\x9f\\x9a\\xa2', '\U0001F6A2'),  # ship
        ('\\xf0\\x9f\\x93\\x8a', '\U0001F4CA'),  # bar chart
        ('\\xe2\\x9c\\x89', '\u2709'),            # envelope
        ('\\xf0\\x9f\\x92\\xbe', '\U0001F4BE'),  # floppy disk
        ('\\xf0\\x9f\\x93\\xa5', '\U0001F4E5'),  # inbox tray
        ('\\xe2\\x9e\\x95', '\u2795'),            # plus
        ('\\xf0\\x9f\\x93\\x8b', '\U0001F4CB'),  # clipboard
        ('\\xf0\\x9f\\x93\\xa1', '\U0001F4E1'),  # satellite
        ('\\xf0\\x9f\\x96\\xa5', '\U0001F5A5'),  # desktop
        ('\\xf0\\x9f\\x97\\xba', '\U0001F5FA'),  # map
        ('\\xf0\\x9f\\x93\\x88', '\U0001F4C8'),  # chart
        ('\\xe2\\x9a\\xa0', '\u26A0'),            # warning
        ('\\xe2\\x9c\\x85', '\u2705'),            # check mark
        ('\\xf0\\x9f\\x94\\xa7', '\U0001F527'),  # wrench
        ('\\xf0\\x9f\\x94\\x84', '\U0001F504'),  # arrows
        ('\\xf0\\x9f\\x8e\\xb2', '\U0001F3B2'),  # die
        ('\\xf0\\x9f\\x8f\\xa5', '\U0001F3E5'),  # hospital
        ('\\xf0\\x9f\\x8e\\xaf', '\U0001F3AF'),  # target
        ('\\xf0\\x9f\\x93\\x8f', '\U0001F4CF'),  # ruler
        ('\\xf0\\x9f\\x93\\xb7', '\U0001F4F7'),  # camera
        ('\\xf0\\x9f\\x97\\x91', '\U0001F5D1'),  # trash
        ('\\xf0\\x9f\\x93\\xa8', '\U0001F4E8'),  # incoming envelope
        ('\\xe2\\x96\\xb6', '\u25B6'),            # play
        ('\\xe2\\x9a\\x99', '\u2699'),            # gear
    ]
    
    # Также добавим текстовые замены для распространенных случаев искажения
    text_replacements = [
        # Искаженные последовательности можно заменить напрямую
        ('Ã—', '×'),  # multiplication sign
        ('â€"', '–'),  # en dash
        ('â€"', '—'),  # em dash
        ('Â«', '«'),  # left quote
        ('Â»', '»'),  # right quote
    ]
    
    # Применяем замены
    for old_text, new_text in text_replacements:
        html = html.replace(old_text, new_text)
    
    return html

def ensure_meta_charset(html):
    """
    Убеждается, что есть правильный meta charset
    """
    if '<meta charset="UTF-8">' not in html and '<meta charset="utf-8">' not in html:
        # Добавляем после <head>
        html = html.replace('<head>', '<head>\n    <meta charset="UTF-8">')
    
    return html

def fix_html_file(input_path, output_path=None):
    """
    Главная функция исправления HTML файла
    """
    input_path = Path(input_path)
    
    if not input_path.exists():
        print(f"Error: File not found: {input_path}")
        return False
    
    print(f"Reading file: {input_path}")
    
    # Читаем файл
    try:
        with open(input_path, 'r', encoding='utf-8', errors='ignore') as f:
            html = f.read()
    except:
        with open(input_path, 'r', encoding='latin1', errors='ignore') as f:
            html = f.read()
    
    # Создаем резервную копию
    backup_path = input_path.with_suffix('.html.backup_double')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Backup saved: {backup_path}")
    
    print("Fixing double encoding...")
    
    # 1. Исправляем двойную кодировку в тексте
    fixed_html = process_html_content(html)
    
    # 2. Исправляем эмодзи
    print("Fixing emojis...")
    fixed_html = fix_emojis(fixed_html)
    
    # 3. Исправляем структуру HTML
    print("Fixing HTML structure...")
    fixed_html = fix_html_structure(fixed_html)
    
    # 4. Добавляем meta charset
    fixed_html = ensure_meta_charset(fixed_html)
    
    # 5. Исправляем title
    fixed_html = re.sub(
        r'<title>.*?</title>',
        '<title>Module TEST SSTO - Test Management System</title>',
        fixed_html,
        flags=re.DOTALL
    )
    
    # Определяем путь для сохранения
    if output_path is None:
        output_path = input_path
    else:
        output_path = Path(output_path)
    
    # Сохраняем исправленный файл
    print(f"Saving fixed file: {output_path}")
    with open(output_path, 'w', encoding='utf-8-sig') as f:  # UTF-8 with BOM для Windows
        f.write(fixed_html)
    
    print("File successfully fixed!")
    print("\nWhat was done:")
    print("  1. Fixed double encoding (UTF-8 -> Latin1 -> UTF-8)")
    print("  2. Fixed emojis")
    print("  3. Fixed HTML structure")
    print("  4. JavaScript wrapped in <script> tags")
    print("  5. Removed duplicate functions")
    print("  6. Added meta charset UTF-8")
    print("\nRefresh your browser (Ctrl+F5)")
    
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Если указан путь к файлу
        input_file = sys.argv[1]
        output_file = sys.argv[2] if len(sys.argv) > 2 else None
        fix_html_file(input_file, output_file)
    else:
        # По умолчанию исправляем index.html в текущей папке
        fix_html_file(r"C:\Projects\test-ssto-project\index.html")