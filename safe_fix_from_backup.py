#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
БЕЗОПАСНЫЙ скрипт: сначала восстанавливает из резервной копии, потом исправляет
Путь для сохранения: C:\Projects\test-ssto-project\safe_fix_from_backup.py
"""

import os
import shutil
import re
from datetime import datetime

def safe_fix_from_backup():
    """Восстанавливает из резервной копии и вносит минимальные исправления"""
    
    base_path = r'C:\Projects\test-ssto-project'
    target_file = os.path.join(base_path, 'index_14_36.html')
    backup_file = os.path.join(base_path, 'index_14_36.html.backup_20250910_013247')
    
    print("=" * 70)
    print("БЕЗОПАСНОЕ ИСПРАВЛЕНИЕ С ВОССТАНОВЛЕНИЕМ ИЗ РЕЗЕРВНОЙ КОПИИ")
    print("=" * 70)
    
    # ШАГ 1: ВОССТАНОВЛЕНИЕ ИЗ РЕЗЕРВНОЙ КОПИИ
    print("\n📁 ШАГ 1: Восстановление из резервной копии...")
    print(f"   Источник: {os.path.basename(backup_file)}")
    
    if not os.path.exists(backup_file):
        print(f"❌ ОШИБКА: Резервная копия не найдена: {backup_file}")
        print("   Проверьте наличие файла!")
        return False
    
    # Создаем новую аварийную копию текущего состояния
    if os.path.exists(target_file):
        emergency_backup = f"{target_file}.BEFORE_FIX_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        shutil.copy2(target_file, emergency_backup)
        print(f"   💾 Текущее состояние сохранено: {os.path.basename(emergency_backup)}")
    
    # Восстанавливаем из резервной копии
    try:
        shutil.copy2(backup_file, target_file)
        print(f"   ✅ Восстановлено из: {os.path.basename(backup_file)}")
    except Exception as e:
        print(f"❌ ОШИБКА при восстановлении: {str(e)}")
        return False
    
    # ШАГ 2: ЧИТАЕМ ВОССТАНОВЛЕННЫЙ ФАЙЛ
    print("\n📖 ШАГ 2: Чтение восстановленного файла...")
    try:
        with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        print(f"   ✅ Файл прочитан: {len(content)} символов")
    except Exception as e:
        print(f"❌ ОШИБКА при чтении: {str(e)}")
        return False
    
    # ШАГ 3: МИНИМАЛЬНЫЕ ИСПРАВЛЕНИЯ
    print("\n🔧 ШАГ 3: Внесение минимальных исправлений...")
    
    # 3.1 Исправляем только критичную функцию loadRequests
    print("   • Исправление функции loadRequests...")
    
    # Находим существующую функцию loadRequests
    load_requests_match = re.search(
        r'function loadRequests\(\)\s*\{.*?\n\}',
        content,
        re.DOTALL
    )
    
    if load_requests_match:
        old_function = load_requests_match.group(0)
        
        # Создаем исправленную версию с правильным порядком колонок
        new_function = """function loadRequests() {
    console.log('📋 Загрузка заявок...');
    
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const tbody = document.getElementById('requests-tbody');
    
    if (tbody) {
        tbody.innerHTML = '';
        
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Нет заявок</td></tr>';
        } else {
            requests.forEach(request => {
                const row = document.createElement('tr');
                // Правильный порядок: ID, Номер стойки, Судно, MMSI, IMO, Дата теста, Статус, Действия
                row.innerHTML = `
                    <td>${request.id || 'N/A'}</td>
                    <td>${request.stationNumber || ''}</td>
                    <td>${request.vesselName || ''}</td>
                    <td>${request.mmsi || ''}</td>
                    <td>${request.imo || ''}</td>
                    <td>${request.testDate || ''}</td>
                    <td><span class="status-badge">${request.status === 'pending' ? 'Ожидает' : request.status === 'confirmed' ? 'Подтверждено' : 'Новая'}</span></td>
                    <td><button class="btn btn-primary btn-sm" onclick="viewRequest('${request.id}')">Просмотр</button></td>
                `;
                tbody.appendChild(row);
            });
        }
    }
    
    // Обновляем дашборд если функция существует
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    } else if (typeof updateDashboardData === 'function') {
        updateDashboardData();
    }
}"""
        
        content = content.replace(old_function, new_function)
        print("      ✅ Функция loadRequests исправлена")
    
    # 3.2 Добавляем недостающие функции-алиасы
    print("   • Добавление недостающих функций...")
    
    # Проверяем и добавляем updateDashboardData если её нет
    if 'function updateDashboardData' not in content and 'function loadDashboard' in content:
        # Находим место после loadDashboard для добавления алиаса
        dashboard_match = re.search(r'(function loadDashboard\(\)[^}]+\})', content, re.DOTALL)
        if dashboard_match:
            insert_pos = dashboard_match.end()
            alias = """

// Алиас для совместимости
function updateDashboardData() {
    loadDashboard();
}
"""
            content = content[:insert_pos] + alias + content[insert_pos:]
            print("      ✅ Добавлен алиас updateDashboardData")
    
    # 3.3 Добавляем функцию viewRequest если её нет
    if 'function viewRequest' not in content:
        view_function = """
// Функция просмотра заявки
function viewRequest(requestId) {
    const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
    const request = requests.find(r => r.id === requestId);
    
    if (!request) {
        alert('Заявка не найдена');
        return;
    }
    
    const info = `ЗАЯВКА НА ТЕСТИРОВАНИЕ
    
ID: ${request.id}
Номер станции: ${request.stationNumber}
Судно: ${request.vesselName || 'Не указано'}
MMSI: ${request.mmsi || 'Не указан'}
IMO: ${request.imo || 'Не указан'}
Дата теста: ${request.testDate || 'Не указана'}
Статус: ${request.status === 'pending' ? 'Ожидает' : 'Подтверждено'}`;
    
    alert(info);
}
"""
        # Добавляем перед закрывающим </script>
        last_script_pos = content.rfind('</script>')
        if last_script_pos > 0:
            content = content[:last_script_pos] + view_function + '\n' + content[last_script_pos:]
            print("      ✅ Добавлена функция viewRequest")
    
    # ШАГ 4: СОХРАНЕНИЕ ИСПРАВЛЕННОГО ФАЙЛА
    print("\n💾 ШАГ 4: Сохранение исправленного файла...")
    
    try:
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"   ✅ Файл сохранен: {target_file}")
    except Exception as e:
        print(f"❌ ОШИБКА при сохранении: {str(e)}")
        return False
    
    # ШАГ 5: ПРОВЕРКА
    print("\n🔍 ШАГ 5: Проверка результата...")
    
    # Проверяем наличие ключевых функций
    with open(target_file, 'r', encoding='utf-8', errors='ignore') as f:
        final_content = f.read()
    
    checks = {
        'switchTab': 'function switchTab' in final_content,
        'loadDashboard или updateDashboardData': 
            'function loadDashboard' in final_content or 'function updateDashboardData' in final_content,
        'loadRequests': 'function loadRequests' in final_content,
        'viewRequest': 'function viewRequest' in final_content,
        'ExcelLoader': 'class ExcelLoader' in final_content or 'ExcelLoader' in final_content,
    }
    
    all_ok = True
    for component, exists in checks.items():
        status = "✅" if exists else "❌"
        print(f"   {status} {component}: {'найден' if exists else 'НЕ НАЙДЕН'}")
        if not exists:
            all_ok = False
    
    print("\n" + "=" * 70)
    if all_ok:
        print("✅ ИСПРАВЛЕНИЕ ВЫПОЛНЕНО УСПЕШНО!")
        print("\n📋 Что было сделано:")
        print("  1. Восстановлен файл из резервной копии")
        print("  2. Исправлен порядок колонок в таблице заявок")
        print("  3. Добавлены недостающие функции")
        print("\n⚠️ Теперь:")
        print("  1. Обновите страницу в браузере: Ctrl+F5")
        print("  2. Проверьте работу вкладок")
        print("  3. Попробуйте загрузить Excel файл")
    else:
        print("⚠️ ВНИМАНИЕ: Некоторые компоненты не найдены")
        print("  Возможно потребуется дополнительная проверка")
    
    return all_ok

if __name__ == "__main__":
    safe_fix_from_backup()
    print("\n✨ Скрипт завершен")