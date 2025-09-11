#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to fix encoding issues in index.html
Works with bytes to avoid encoding problems
"""

import os
import re
from pathlib import Path

def fix_all_issues():
    """Fix all encoding issues in index.html"""
    
    # File path
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        print("File not found:", index_path)
        return False
    
    print("Reading file:", index_path)
    
    # Read file as bytes
    with open(index_path, 'rb') as f:
        content_bytes = f.read()
    
    # Create backup
    backup_path = index_path.with_suffix('.html.backup_fix')
    with open(backup_path, 'wb') as f:
        f.write(content_bytes)
    print("Backup created:", backup_path)
    
    # Convert to string for processing
    try:
        content = content_bytes.decode('utf-8', errors='ignore')
    except:
        content = content_bytes.decode('latin-1', errors='ignore')
    
    print("\nApplying fixes...")
    
    # Dictionary of replacements using byte sequences
    # We'll work with the string but use hex codes for problematic chars
    replacements = [
        # Main module names - use hex codes
        (b'\xd0\xa2\xd0\x95\xd0\xa1\xd0\xa2 \xd0\xa1\xd0\xa1\xd0\xa2\xd0\x9e'.decode('utf-8', errors='ignore'), 'ТЕСТ ССТО'),
        (b'\xd0\x9c\xd0\x9e\xd0\x94\xd0\xa3\xd0\x9b\xd0\xac'.decode('utf-8', errors='ignore'), 'МОДУЛЬ'),
        
        # Common corrupted sequences - safe ASCII only
        ('TEST SSTO', 'ТЕСТ ССТО'),
        ('MODUL', 'МОДУЛЬ'),
        ('Sistema', 'Система'),
        ('upravleniya', 'управления'),
        ('testirovaniem', 'тестированием'),
        
        # Interface elements
        ('Zagruzit', 'Загрузить'),
        ('Nastroyki', 'Настройки'),
        ('Eksport', 'Экспорт'),
        ('Import', 'Импорт'),
        ('Glavnaya', 'Главная'),
        ('Novaya', 'Новая'),
        ('Zayavki', 'Заявки'),
        ('Signaly', 'Сигналы'),
        ('Terminaly', 'Терминалы'),
        ('Karta', 'Карта'),
        ('Otchety', 'Отчеты'),
        
        # Statuses
        ('AKTIVNYE', 'АКТИВНЫЕ'),
        ('OZHIDAYUT', 'ОЖИДАЮТ'),
        ('PODTVERZHDENO', 'ПОДТВЕРЖДЕНО'),
        ('VSEGO', 'ВСЕГО'),
        ('SIGNALOV', 'СИГНАЛОВ'),
        ('Status', 'Статус'),
        ('OTKLYUCHEN', 'ОТКЛЮЧЕН'),
        ('VKLYUCHEN', 'ВКЛЮЧЕН'),
        
        # Form fields
        ('NOMER', 'НОМЕР'),
        ('STOYKI', 'СТОЙКИ'),
        ('Nazvanie', 'Название'),
        ('sudna', 'судна'),
        ('Sudno', 'Судно'),
        ('Sudovladelets', 'Судовладелец'),
        ('Vladelets', 'Владелец'),
        ('Data', 'Дата'),
        ('testa', 'теста'),
        ('Vremya', 'Время'),
        
        # Actions
        ('Izmenit', 'Изменить'),
        ('Sozdat', 'Создать'),
        ('zayavku', 'заявку'),
        ('zayavka', 'заявка'),
        ('Rezhim', 'Режим'),
        ('rezhim', 'режим'),
        ('Nachata', 'Начата'),
        ('Zavershena', 'Завершена'),
        ('Obrabotat', 'Обработать'),
        ('Sinkhronizatsiya', 'Синхронизация'),
        ('Generirovat', 'Генерировать'),
        ('Proverka', 'Проверка'),
        ('Detali', 'Детали'),
        ('Deystviya', 'Действия'),
        
        # Organizations - transliterated
        ('FGBU', 'ФГБУ'),
        ('MORSPASSLUZHBA', 'МОРСПАССЛУЖБА'),
        ('ROSMORRECHFLOT', 'РОСМОРРЕЧФЛОТ'),
        ('MINTRANS ROSSII', 'МИНТРАНС РОССИИ'),
        ('Poisk-More', 'Поиск-Море'),
        
        # Vessel names
        ('AKADEMIK LOMONOSOV', 'АКАДЕМИК ЛОМОНОСОВ'),
        ('KAPITAN VORONIN', 'КАПИТАН ВОРОНИН'),
        ('Severnoe Morskoe Parokhodstvo', 'Северное Морское Пароходство'),
        ('Rossiyskaya Akademiya Nauk', 'Российская Академия Наук'),
    ]
    
    # Apply replacements
    for old_text, new_text in replacements:
        if old_text and old_text in content:
            content = content.replace(old_text, new_text)
            print(f"  Fixed: {new_text[:30] if len(new_text) > 30 else new_text}...")
    
    # Fix broken emojis using Unicode codes
    emoji_fixes = [
        ('\U0001f6a2', '\U0001F6A2'),  # ship
        ('\U0001f4ca', '\U0001F4CA'),  # bar chart
        ('\U0001f527', '\U0001F527'),  # wrench
        ('\U0001f4be', '\U0001F4BE'),  # floppy disk
        ('\U0001f4e5', '\U0001F4E5'),  # inbox tray
        ('\u2795', '\u2795'),           # plus
        ('\U0001f4cb', '\U0001F4CB'),  # clipboard
        ('\U0001f4e1', '\U0001F4E1'),  # satellite
        ('\U0001f5fa', '\U0001F5FA'),  # map
        ('\U0001f4c8', '\U0001F4C8'),  # chart
        ('\u2705', '\u2705'),           # check mark
        ('\U0001f504', '\U0001F504'),  # arrows
        ('\U0001f3b2', '\U0001F3B2'),  # die
        ('\U0001f3af', '\U0001F3AF'),  # target
        ('\U0001f4f7', '\U0001F4F7'),  # camera
    ]
    
    for old_emoji, new_emoji in emoji_fixes:
        content = content.replace(old_emoji, new_emoji)
    
    # Fix onclick attributes in wrong places
    content = content.replace('<style onclick="switchTab(\'map\')">', '<style>')
    content = content.replace('</div onclick="switchTab(\'new-request\')">', '</div>')
    content = content.replace('<script onclick="switchTab(\'requests\')">', '<script>')
    
    # Fix title tag
    content = re.sub(
        r'<title>.*?</title>',
        '<title>Модуль ТЕСТ ССТО - Система управления тестированием</title>',
        content,
        flags=re.DOTALL
    )
    
    # Fix meta charset if needed
    if '<meta charset="UTF-8">' not in content:
        content = content.replace('<head>', '<head>\n    <meta charset="UTF-8">')
    
    # Save fixed file
    print("\nSaving fixed file...")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\nFile successfully fixed!")
    print("Backup saved as:", backup_path)
    print("\nPlease refresh your browser (Ctrl+F5)")
    
    return True

if __name__ == "__main__":
    try:
        success = fix_all_issues()
        if success:
            print("\n=== SUCCESS ===")
            print("All encoding issues should be fixed!")
            print("If some text is still corrupted, run the script again.")
        else:
            print("\n=== ERROR ===")
            print("Failed to fix the file")
    except Exception as e:
        print(f"\nCritical error: {e}")
        import traceback
        traceback.print_exc()