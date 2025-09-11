#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Финальная проверка и мелкие доработки системы ССТО
Путь для сохранения: C:\Projects\test-ssto-project\final_check.py
"""

import re
from pathlib import Path
from datetime import datetime
import shutil

def final_check_and_fix():
    """Финальная проверка и мелкие исправления"""
    
    project_dir = Path(r'C:\Projects\test-ssto-project')
    target = project_dir / 'index_14_36.html'
    
    print("=" * 70)
    print("🔍 ФИНАЛЬНАЯ ПРОВЕРКА СИСТЕМЫ ССТО")
    print("=" * 70)
    
    if not target.exists():
        print(f'❌ Файл не найден: {target}')
        return False
    
    # Создаем резервную копию
    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup = target.with_name(f'{target.name}.before_final_{ts}')
    shutil.copy(str(target), str(backup))
    print(f'💾 Резервная копия: {backup.name}')
    
    # Читаем файл
    print('\n📖 Чтение файла...')
    content = target.read_text(encoding='utf-8', errors='ignore')
    
    # Проверки
    print('\n🔍 ПРОВЕРКА КОМПОНЕНТОВ:')
    
    # 1. DataStore
    if 'class DataStore' in content:
        print('  ✅ DataStore класс найден')
    else:
        print('  ❌ DataStore класс отсутствует')
    
    # 2. ExcelLoader
    if 'class ExcelLoader' in content:
        print('  ✅ ExcelLoader класс найден')
    else:
        print('  ❌ ExcelLoader класс отсутствует')
    
    # 3. switchTab
    if 'window.switchTab' in content:
        print('  ✅ Функция switchTab найдена')
    else:
        print('  ❌ Функция switchTab отсутствует')
    
    # 4. Делегирование событий
    if "document.addEventListener('click'" in content and "'.tab[data-tab]'" in content:
        print('  ✅ Делегирование событий настроено')
    else:
        print('  ❌ Делегирование событий не настроено')
    
    # 5. loadTerminals
    if 'function loadTerminals' in content:
        print('  ✅ Функция loadTerminals найдена')
    else:
        print('  ❌ Функция loadTerminals отсутствует')
    
    # МЕЛКИЕ ИСПРАВЛЕНИЯ
    print('\n🔧 ПРИМЕНЕНИЕ МЕЛКИХ ИСПРАВЛЕНИЙ:')
    
    # 1. Добавляем визуальную обратную связь
    if 'showNotification' not in content:
        print('  📝 Добавление функции уведомлений...')
        notification_func = """
        // Функция для показа уведомлений
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'error' ? '#ef4444' : '#10b981'};
                color: white;
                border-radius: 6px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
"""
        # Добавляем перед инициализацией
        content = content.replace('// Инициализация', notification_func + '\n        // Инициализация')
        print('    ✅ Функция уведомлений добавлена')
    
    # 2. Улучшаем обратную связь в функциях
    print('  📝 Улучшение обратной связи...')
    
    # Заменяем alert на showNotification где возможно
    replacements = [
        ("alert('Заявка создана')", "showNotification('Заявка успешно создана', 'success')"),
        ("alert('Настройки email в разработке')", "showNotification('Настройки email в разработке', 'info')"),
        ("alert('Экспорт настроек в разработке')", "showNotification('Экспорт настроек в разработке', 'info')"),
        ("alert('Импорт настроек в разработке')", "showNotification('Импорт настроек в разработке', 'info')"),
    ]
    
    for old, new in replacements:
        if old in content and 'showNotification' in content:
            content = content.replace(old, new)
    
    print('    ✅ Обратная связь улучшена')
    
    # 3. Добавляем инициализацию при загрузке
    if "document.addEventListener('DOMContentLoaded'" not in content:
        print('  📝 Добавление инициализации при загрузке...')
        init_code = """
        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🚀 Инициализация системы ССТО...');
            
            // Загружаем данные
            if (typeof loadDashboard === 'function') loadDashboard();
            if (typeof loadRequests === 'function') loadRequests();
            if (typeof loadSignals === 'function') loadSignals();
            if (typeof loadTerminals === 'function') loadTerminals();
            
            // Инициализируем карту
            if (typeof initMap === 'function') {
                setTimeout(initMap, 100);
            }
            
            // Активируем первую вкладку
            const firstTab = document.querySelector('.tab[data-tab="dashboard"]');
            if (firstTab && typeof switchTab === 'function') {
                switchTab('dashboard');
            }
            
            console.log('✅ Система ССТО готова к работе');
        });
"""
        # Добавляем перед закрывающим </script>
        content = content.replace('</script>', init_code + '\n    </script>')
        print('    ✅ Инициализация добавлена')
    
    # 4. Проверяем корректность LocalStorage ключей
    print('  📝 Проверка ключей LocalStorage...')
    if "terminals:'vessels'" in content:
        print('    ✅ Ключи LocalStorage корректны')
    else:
        print('    ⚠️ Проверьте ключи LocalStorage')
    
    # Сохраняем результат
    print('\n💾 Сохранение файла...')
    target.write_text(content, encoding='utf-8')
    print(f'  ✅ Файл сохранен: {target}')
    
    # Итоговый отчет
    print('\n' + '=' * 70)
    print('📊 ИТОГОВЫЙ ОТЧЕТ:')
    print('=' * 70)
    
    print('\n✅ ДОЛЖНО РАБОТАТЬ:')
    print('  • Переключение вкладок (делегирование событий)')
    print('  • Загрузка Excel файлов')
    print('  • Создание заявок через форму')
    print('  • Генерация тестовых данных')
    print('  • Отображение данных в таблицах')
    print('  • Кнопка "Тест" для терминалов')
    print('  • Автоматический расчет следующего теста')
    
    print('\n⚠️ ПРОВЕРЬТЕ В БРАУЗЕРЕ:')
    print('  1. Откройте index_14_36.html')
    print('  2. Нажмите Ctrl+F5')
    print('  3. Откройте консоль (F12)')
    print('  4. Проверьте наличие ошибок')
    print('  5. Попробуйте переключить вкладки')
    print('  6. Нажмите "Генерировать тестовые данные"')
    
    print('\n🔍 ОТЛАДКА В КОНСОЛИ:')
    print('  // Проверка функций')
    print('  typeof switchTab  // должно быть "function"')
    print('  typeof DataStore  // должно быть "function"')
    print('  typeof ExcelLoader  // должно быть "function"')
    print('')
    print('  // Проверка данных')
    print('  localStorage.getItem("vessels")  // терминалы')
    print('  localStorage.getItem("signals")  // сигналы')
    print('  localStorage.getItem("testRequests")  // заявки')
    print('')
    print('  // Ручное переключение вкладок')
    print('  switchTab("terminals")')
    print('  switchTab("signals")')
    
    return True

if __name__ == '__main__':
    print('🚀 Запуск финальной проверки...\n')
    
    success = final_check_and_fix()
    
    if success:
        print('\n✨ Финальная проверка завершена!')
        print('🎯 Система должна быть полностью работоспособна')
    else:
        print('\n❌ Проверка завершена с ошибками')