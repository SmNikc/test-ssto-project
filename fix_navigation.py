#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для восстановления работы навигации (вкладок) в системе ССТО
Путь для сохранения: C:\Projects\test-ssto-project\fix_navigation.py
"""
import re
import os
from datetime import datetime
import shutil

def fix_navigation():
    """Восстанавливает работу кнопок навигации (вкладок)"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    print("=" * 70)
    print("ВОССТАНОВЛЕНИЕ НАВИГАЦИИ ССТО")
    print("=" * 70)
    
    # Создаем резервную копию
    backup_path = f"{file_path}.before_nav_fix_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Читаем файл
    print("\n📖 Чтение файла...")
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Сохраняем резервную копию
        with open(backup_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"   ✅ Файл прочитан")
        print(f"   💾 Резервная копия: {os.path.basename(backup_path)}")
    except Exception as e:
        print(f"❌ ОШИБКА при чтении: {str(e)}")
        return False
    
    # 1. ИСПРАВЛЯЕМ ФУНКЦИЮ switchTab - делаем её глобальной и надёжной
    print("\n🔧 Исправление функции switchTab...")
    
    # Удаляем старую функцию switchTab если она есть в IIFE
    content = re.sub(
        r'\(\(\) => \{[^}]*window\.switchTab[^}]+\}\)\(\);',
        '',
        content,
        flags=re.DOTALL
    )
    
    # Новая надежная функция switchTab
    new_switch_tab = """
        // ===================== ГЛОБАЛЬНАЯ ФУНКЦИЯ ПЕРЕКЛЮЧЕНИЯ ВКЛАДОК =====================
        function switchTab(targetId, e) {
            if (e) e.preventDefault();
            
            // Убираем активный класс со всех вкладок
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
            
            // Активируем нужную вкладку
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Активируем кнопку
            const btn = e?.target || document.querySelector(`.tab[data-tab="${targetId}"]`);
            if (btn && btn.classList.contains('tab')) {
                btn.classList.add('active');
            }
            
            // Скроллим к началу
            window.scrollTo({ top: 0, behavior: 'instant' });
            
            // Восстановление размера карты после показа секции
            if (targetId === 'map' && window.olMap && typeof window.olMap.updateSize === 'function') {
                setTimeout(() => {
                    window.olMap.updateSize();
                }, 100);
            }
            
            console.log('Переключено на вкладку:', targetId);
        }
        
        // Делаем функцию доступной глобально
        window.switchTab = switchTab;
"""
    
    # Вставляем новую функцию после объявления store
    store_pattern = r'const store = new DataStore\(\);'
    if re.search(store_pattern, content):
        content = re.sub(
            store_pattern,
            f'const store = new DataStore();\n{new_switch_tab}',
            content
        )
        print("   ✅ Функция switchTab добавлена глобально")
    
    # 2. ИСПРАВЛЯЕМ HTML КНОПОК НАВИГАЦИИ
    print("\n🔧 Исправление HTML кнопок навигации...")
    
    # Паттерн для кнопок навигации
    nav_buttons = [
        ('dashboard', '📊 Главная'),
        ('new-request', '➕ Новая заявка'),
        ('requests', '📋 Заявки'),
        ('signals', '📡 Сигналы'),
        ('terminals', '🖥️ Терминалы'),
        ('map', '🗺️ Карта'),
        ('reports', '📈 Отчёты')
    ]
    
    # Находим блок nav
    nav_pattern = r'<nav>(.*?)</nav>'
    nav_match = re.search(nav_pattern, content, re.DOTALL)
    
    if nav_match:
        # Создаем новый блок навигации с правильными обработчиками
        new_nav = '<nav>\n'
        for tab_id, tab_text in nav_buttons:
            active_class = ' class="tab active"' if tab_id == 'dashboard' else ' class="tab"'
            new_nav += f'            <button{active_class} data-tab="{tab_id}" onclick="switchTab(\'{tab_id}\', event)">{tab_text}</button>\n'
        new_nav += '        </nav>'
        
        content = re.sub(nav_pattern, new_nav, content, flags=re.DOTALL)
        print("   ✅ HTML кнопок навигации исправлен")
    
    # 3. ДОБАВЛЯЕМ ОБРАБОТЧИК СОБЫТИЙ ДЛЯ ДЕЛЕГИРОВАНИЯ (как запасной вариант)
    print("\n🔧 Добавление обработчика событий...")
    
    event_handler = """
        // ===================== ОБРАБОТЧИК КЛИКОВ НА ВКЛАДКИ (ДЕЛЕГИРОВАНИЕ) =====================
        document.addEventListener('DOMContentLoaded', function() {
            // Обработчик для кнопок навигации
            document.addEventListener('click', function(e) {
                const tab = e.target.closest('.tab[data-tab]');
                if (tab) {
                    e.preventDefault();
                    const targetId = tab.getAttribute('data-tab');
                    switchTab(targetId, e);
                }
            });
            
            // Загружаем начальные данные
            if (typeof loadDashboard === 'function') loadDashboard();
            if (typeof loadRequests === 'function') loadRequests();
            if (typeof loadSignals === 'function') loadSignals();
            if (typeof loadTerminals === 'function') loadTerminals();
            
            console.log('✅ Система навигации инициализирована');
        });
"""
    
    # Добавляем обработчик перед закрывающим тегом script
    script_end = content.rfind('</script>')
    if script_end > 0:
        content = content[:script_end] + event_handler + '\n' + content[script_end:]
        print("   ✅ Обработчик событий добавлен")
    
    # 4. УБИРАЕМ ДУБЛИРУЮЩИЕСЯ ОБРАБОТЧИКИ
    print("\n🔧 Удаление дублирующихся обработчиков...")
    
    # Удаляем старые inline обработчики в табах если они неправильные
    content = re.sub(
        r'<button class="tab([^"]*)" data-tab="([^"]+)">',
        r'<button class="tab\1" data-tab="\2" onclick="switchTab(\'\2\', event)">',
        content
    )
    
    # 5. ИСПРАВЛЯЕМ АКТИВАЦИЮ ПЕРВОЙ ВКЛАДКИ
    print("\n🔧 Установка начальной вкладки...")
    
    init_dashboard = """
        // Активируем вкладку "Главная" при загрузке
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
                switchTab('dashboard');
            }, 100);
        });
"""
    
    # Добавляем инициализацию если её нет
    if 'switchTab(\'dashboard\')' not in content:
        script_end = content.rfind('</script>')
        if script_end > 0:
            content = content[:script_end] + init_dashboard + '\n' + content[script_end:]
            print("   ✅ Инициализация начальной вкладки добавлена")
    
    # 6. ПРОВЕРЯЕМ И ИСПРАВЛЯЕМ ID КОНТЕНТНЫХ БЛОКОВ
    print("\n🔧 Проверка ID контентных блоков...")
    
    # Убеждаемся что все content блоки имеют правильные id
    for tab_id, _ in nav_buttons:
        pattern = f'<div class="content[^"]*" id="{tab_id}"'
        if not re.search(pattern, content):
            # Пытаемся найти блок без id и добавить
            content = re.sub(
                f'<div class="content([^"]*)">(.*?{tab_id})',
                f'<div class="content\\1" id="{tab_id}">\\2',
                content,
                flags=re.DOTALL | re.IGNORECASE
            )
    
    print("   ✅ ID контентных блоков проверены")
    
    # Сохраняем файл
    print("\n💾 Сохранение файла...")
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Файл сохранен: {file_path}")
    except Exception as e:
        print(f"❌ ОШИБКА при сохранении: {str(e)}")
        return False
    
    print("\n" + "=" * 70)
    print("✅ НАВИГАЦИЯ ВОССТАНОВЛЕНА!")
    print("\n📋 Что исправлено:")
    print("  • Функция switchTab сделана глобальной")
    print("  • Исправлены onclick обработчики на кнопках")
    print("  • Добавлено делегирование событий")
    print("  • Установлена начальная вкладка")
    print("  • Проверены ID контентных блоков")
    
    print("\n⚠️ Теперь:")
    print("  1. Обновите страницу (Ctrl+F5)")
    print("  2. Проверьте работу всех вкладок")
    print("  3. Убедитесь что контент отображается")
    
    print("\n🔍 Если проблемы остались:")
    print("  1. Откройте консоль браузера (F12)")
    print("  2. Проверьте наличие ошибок")
    print("  3. Попробуйте вручную: switchTab('terminals')")
    
    return True

def check_backup_versions():
    """Показывает доступные резервные копии"""
    
    project_dir = r'C:\Projects\test-ssto-project'
    
    print("\n📁 ДОСТУПНЫЕ РЕЗЕРВНЫЕ КОПИИ:")
    print("-" * 50)
    
    backups = []
    for file in os.listdir(project_dir):
        if 'index_14_36.html' in file and file != 'index_14_36.html':
            file_path = os.path.join(project_dir, file)
            size = os.path.getsize(file_path) / 1024  # в KB
            mtime = datetime.fromtimestamp(os.path.getmtime(file_path))
            backups.append((file, size, mtime))
    
    backups.sort(key=lambda x: x[2], reverse=True)
    
    for backup, size, mtime in backups:
        print(f"  • {backup}")
        print(f"    Размер: {size:.1f} KB | Дата: {mtime.strftime('%Y-%m-%d %H:%M:%S')}")
    
    print("\n💡 Для восстановления из резервной копии:")
    print('   shutil.copy("backup_file", "index_14_36.html")')

if __name__ == "__main__":
    print("🚀 Запуск скрипта восстановления навигации...")
    
    # Показываем доступные резервные копии
    check_backup_versions()
    
    # Запускаем исправление
    success = fix_navigation()
    
    if success:
        print("\n✨ Скрипт успешно завершен!")
        print("🔄 Не забудьте обновить страницу в браузере!")
    else:
        print("\n❌ Скрипт завершен с ошибками")
        print("💡 Проверьте путь к файлу и права доступа")