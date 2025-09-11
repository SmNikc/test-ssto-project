#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для исправления проблемы с кодировкой UTF-8 при генерации PDF в index.html
Путь: C:\\Projects\\test-ssto-project\\fix_pdf_encoding.py
Запуск: python fix_pdf_encoding.py
"""

import os
import re
import sys
from pathlib import Path

def fix_pdf_encoding():
    """Исправляет проблему с кодировкой в функциях генерации PDF"""
    
    # Путь к файлу index.html
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    # Проверяем существование файла
    if not index_path.exists():
        print(f"❌ Файл не найден: {index_path}")
        return False
    
    print(f"📄 Читаю файл: {index_path}")
    
    # Читаем содержимое файла с правильной кодировкой
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except UnicodeDecodeError:
        # Если UTF-8 не работает, пробуем другие кодировки
        print("⚠️ Проблема с UTF-8, пробую windows-1251...")
        try:
            with open(index_path, 'r', encoding='windows-1251') as f:
                content = f.read()
        except:
            print("❌ Не удалось прочитать файл")
            return False
    
    print("✅ Файл прочитан успешно")
    
    # Сохраняем оригинал
    backup_path = index_path.with_suffix('.html.backup')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"💾 Создана резервная копия: {backup_path}")
    
    # Счетчик изменений
    changes_made = 0
    
    # 1. Добавляем функцию для работы с кириллицей в PDF после загрузки jsPDF
    jspdf_script = r'<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>'
    
    if jspdf_script in content:
        print("🔧 Добавляю поддержку кириллицы для jsPDF...")
        
        # Вставляем скрипт с функцией для обработки кириллицы
        cyrillic_support = '''
    <!-- Поддержка кириллицы для PDF -->
    <script>
        // Функция для транслитерации кириллицы в латиницу
        function cyrillicToTranslit(text) {
            const converter = {
                'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
                'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z', 'и': 'i',
                'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
                'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
                'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
                'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '',
                'э': 'e', 'ю': 'yu', 'я': 'ya',
                'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
                'Е': 'E', 'Ё': 'E', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
                'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
                'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
                'У': 'U', 'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch',
                'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
                'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya',
                ' ': ' ', '.': '.', ',': ',', '!': '!', '?': '?',
                '-': '-', ':': ':', ';': ';', '"': '"', "'": "'",
                '(': '(', ')': ')', '[': '[', ']': ']', '/': '/',
                '«': '"', '»': '"', '—': '-', '–': '-'
            };
            
            if (!text) return '';
            return text.split('').map(char => converter[char] || char).join('');
        }
        
        // Функция-обертка для безопасного добавления текста в PDF
        function addTextToPDF(doc, text, x, y, options) {
            try {
                // Транслитерируем текст для PDF
                const translitText = cyrillicToTranslit(String(text));
                doc.text(translitText, x, y, options);
            } catch (e) {
                console.error('Ошибка при добавлении текста в PDF:', e);
                // Пробуем добавить без опций
                try {
                    doc.text(String(text), x, y);
                } catch (e2) {
                    console.error('Не удалось добавить текст:', text);
                }
            }
        }
    </script>'''
        
        content = content.replace(jspdf_script, jspdf_script + cyrillic_support)
        changes_made += 1
    
    # 2. Исправляем функцию generateConfirmationPDF
    print("🔧 Исправляю функцию generateConfirmationPDF...")
    
    # Находим функцию generateConfirmationPDF и заменяем doc.text на addTextToPDF
    def replace_in_function(content, func_name):
        # Паттерн для поиска функции
        pattern = rf'(function {func_name}\([^)]*\)\s*{{)'
        match = re.search(pattern, content)
        
        if match:
            start = match.end()
            # Находим конец функции (подсчитываем фигурные скобки)
            brace_count = 1
            i = start
            while i < len(content) and brace_count > 0:
                if content[i] == '{':
                    brace_count += 1
                elif content[i] == '}':
                    brace_count -= 1
                i += 1
            
            if brace_count == 0:
                # Извлекаем тело функции
                func_body = content[start:i-1]
                # Заменяем doc.text на addTextToPDF
                new_func_body = re.sub(
                    r'doc\.text\(',
                    r'addTextToPDF(doc, ',
                    func_body
                )
                # Собираем обратно
                new_content = content[:start] + new_func_body + content[i-1:]
                return new_content, True
        
        return content, False
    
    # Применяем замену для generateConfirmationPDF
    content, changed = replace_in_function(content, 'generateConfirmationPDF')
    if changed:
        changes_made += 1
        print("  ✓ Функция generateConfirmationPDF исправлена")
    
    # 3. Исправляем функцию exportReportToPDF
    print("🔧 Исправляю функцию exportReportToPDF...")
    content, changed = replace_in_function(content, 'exportReportToPDF')
    if changed:
        changes_made += 1
        print("  ✓ Функция exportReportToPDF исправлена")
    
    # 4. Исправляем искаженные тексты с безопасной обработкой
    print("🔧 Исправляю искаженные тексты...")
    
    # Список замен (без проблемных символов)
    replacements = [
        ('Ð¢Ð•Ð¡Ð¢ Ð¡Ð¡Ð¢Ðž', 'ТЕСТ ССТО'),
        ('ÐžÑ‚Ñ‡ÐµÑ‚', 'Отчет'),
        ('Ð—Ð°ÑÐ²ÐºÐ°', 'Заявка'),
        ('Ð¡Ð¸Ð³Ð½Ð°Ð»', 'Сигнал'),
        ('Ð¢Ñ€ÐµÐ²Ð¾Ð³', 'Тревог'),
        ('ÑÐ¾Ð·Ð´Ð°Ð½Ð°', 'создана'),
        ('Ð¿Ð¾Ð´Ñ‚Ð²ÐµÑ€Ð¶Ð´ÐµÐ½', 'подтвержден'),
    ]
    
    for old_text, new_text in replacements:
        if old_text in content:
            content = content.replace(old_text, new_text)
            changes_made += 1
            print(f"  ✓ Заменено: {old_text[:20]}... → {new_text}")
    
    # 5. Специальная обработка для title и других мета-тегов
    print("🔧 Исправляю мета-теги...")
    
    # Исправляем title
    content = re.sub(
        r'<title>[^<]*</title>',
        '<title>Модуль ТЕСТ ССТО - Система управления тестированием</title>',
        content
    )
    changes_made += 1
    
    # 6. Добавляем корректную кодировку если её нет
    if 'charset="UTF-8"' not in content and 'charset=UTF-8' not in content:
        content = content.replace('<head>', '<head>\n    <meta charset="UTF-8">')
        changes_made += 1
        print("  ✓ Добавлена мета-информация о кодировке UTF-8")
    
    # 7. Сохраняем исправленный файл
    print(f"\n💾 Сохраняю исправленный файл...")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Успешно исправлено! Внесено изменений: {changes_made}")
    print(f"📝 Резервная копия сохранена в: {backup_path}")
    
    return True

if __name__ == "__main__":
    try:
        success = fix_pdf_encoding()
        if success:
            print("\n🎉 Скрипт выполнен успешно!")
            print("ℹ️  Теперь PDF-документы будут генерироваться с транслитерацией кириллицы.")
            print("    Все тексты будут автоматически преобразованы в латиницу для корректного отображения в PDF.")
        else:
            print("\n❌ Произошла ошибка при выполнении скрипта")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)