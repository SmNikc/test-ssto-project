#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Скрипт для исправления ошибки updateDashboardData is not defined в index_14_36.html
Путь для сохранения: C:\Projects\test-ssto-project\fix_updateDashboardData_error.py
"""

import re
import os
from datetime import datetime

def fix_dashboard_error():
    """Исправляет ошибку с неопределенной функцией updateDashboardData"""
    
    file_path = r'C:\Projects\test-ssto-project\index_14_36.html'
    
    # Читаем файл
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # Создаем резервную копию
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Резервная копия: {backup_path}")
    
    # Проверяем, есть ли функция updateDashboardData
    if 'function updateDashboardData' not in content:
        print("⚠️ Функция updateDashboardData не найдена. Добавляем...")
        
        # Вариант 1: Заменяем все вызовы updateDashboardData на loadDashboard
        replacements_made = 0
        
        # Заменяем вызовы updateDashboardData на loadDashboard
        pattern = r'updateDashboardData\(\)'
        matches = re.findall(pattern, content)
        if matches:
            print(f"  Найдено {len(matches)} вызовов updateDashboardData")
            content = re.sub(pattern, 'loadDashboard()', content)
            replacements_made += len(matches)
        
        # Альтернативный вариант - создаем алиас функции
        if replacements_made == 0:
            print("  Создаем алиас функции updateDashboardData")
            # Находим место после определения loadDashboard
            dashboard_pattern = r'(function loadDashboard\(\)[^}]+\})'
            match = re.search(dashboard_pattern, content, re.DOTALL)
            if match:
                insert_pos = match.end()
                alias_function = """

// Алиас для совместимости
function updateDashboardData() {
    loadDashboard();
}
"""
                content = content[:insert_pos] + alias_function + content[insert_pos:]
                print("  ✅ Добавлен алиас updateDashboardData")
    else:
        print("✅ Функция updateDashboardData уже существует")
    
    # Проверяем и исправляем функцию loadDashboard если она повреждена
    print("\n🔧 Проверяем функцию loadDashboard...")
    
    if 'function loadDashboard' not in content:
        print("  ⚠️ Функция loadDashboard не найдена! Восстанавливаем...")
        
        # Находим место после определения app
        app_pattern = r'const app = \{[^}]+\};\s*'
        app_match = re.search(app_pattern, content)
        
        if app_match:
            dashboard_function = """

// Функция обновления дашборда
function loadDashboard() {
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const signals = JSON.parse(localStorage.getItem('signals') || '[]');
    const terminals = JSON.parse(localStorage.getItem('ssasTerminals') || localStorage.getItem('terminals') || '[]');
    
    // Обновляем счетчики
    const totalRequestsEl = document.getElementById('total-requests');
    const pendingRequestsEl = document.getElementById('pending-requests');
    const confirmedRequestsEl = document.getElementById('confirmed-requests');
    const totalSignalsEl = document.getElementById('total-signals');
    
    if (totalRequestsEl) totalRequestsEl.textContent = requests.length;
    if (pendingRequestsEl) pendingRequestsEl.textContent = requests.filter(r => r.status === 'pending').length;
    if (confirmedRequestsEl) confirmedRequestsEl.textContent = requests.filter(r => r.status === 'confirmed').length;
    if (totalSignalsEl) totalSignalsEl.textContent = signals.length;
}

// Алиас для совместимости
function updateDashboardData() {
    loadDashboard();
}

// Еще один алиас для совместимости
function updateStats() {
    loadDashboard();
}
"""
            insert_pos = app_match.end()
            content = content[:insert_pos] + dashboard_function + content[insert_pos:]
            print("  ✅ Функция loadDashboard восстановлена")
    
    # Убедимся что есть алиас updateDashboardData
    if 'function updateDashboardData' not in content:
        # Добавляем в конец скриптов перед </script>
        script_end = content.rfind('</script>')
        if script_end > 0:
            alias = """

// Алиасы для совместимости с разными версиями
if (typeof updateDashboardData === 'undefined') {
    window.updateDashboardData = function() {
        if (typeof loadDashboard !== 'undefined') {
            loadDashboard();
        } else {
            console.log('Обновление дашборда...');
            const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            const signals = JSON.parse(localStorage.getItem('signals') || '[]');
            
            const totalRequestsEl = document.getElementById('total-requests');
            const pendingRequestsEl = document.getElementById('pending-requests');
            const confirmedRequestsEl = document.getElementById('confirmed-requests');
            const totalSignalsEl = document.getElementById('total-signals');
            
            if (totalRequestsEl) totalRequestsEl.textContent = requests.length;
            if (pendingRequestsEl) pendingRequestsEl.textContent = requests.filter(r => r.status === 'pending').length;
            if (confirmedRequestsEl) confirmedRequestsEl.textContent = requests.filter(r => r.status === 'confirmed').length;
            if (totalSignalsEl) totalSignalsEl.textContent = signals.length;
        }
    };
}

if (typeof updateStats === 'undefined') {
    window.updateStats = window.updateDashboardData;
}
"""
            content = content[:script_end] + alias + '\n' + content[script_end:]
            print("  ✅ Добавлены глобальные алиасы для совместимости")
    
    # Сохраняем исправленный файл
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Файл исправлен: {file_path}")
    print("\n📋 Что сделано:")
    print("  ✓ Исправлена ошибка updateDashboardData is not defined")
    print("  ✓ Добавлены алиасы для совместимости")
    print("  ✓ Проверена функция loadDashboard")
    print("\n🎯 Теперь должно работать:")
    print("  • Загрузка Excel без ошибок")
    print("  • Обновление счетчиков на дашборде")
    print("  • Все функции обновления статистики")
    print("\n⚠️ Обновите страницу в браузере: Ctrl+F5")

if __name__ == "__main__":
    fix_dashboard_error()
    print("\n✨ Готово! Попробуйте загрузить Excel файл снова.")