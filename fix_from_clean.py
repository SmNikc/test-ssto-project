#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Исправление системы ССТО от чистой резервной копии
Минимальные изменения для восстановления работоспособности
Путь: C:\Projects\test-ssto-project\fix_from_clean.py
"""

import re
import os
import shutil
from datetime import datetime
from pathlib import Path

def fix_from_clean():
    """Минимальные исправления от резервной копии"""
    
    project_dir = Path(r'C:\Projects\test-ssto-project')
    target_file = project_dir / 'index_14_36.html'
    
    # Ищем самую раннюю рабочую резервную копию
    backup_file = project_dir / 'index_14_36.html.backup_20250910_013247'
    
    if not backup_file.exists():
        # Пробуем другие резервные копии
        backups = list(project_dir.glob('index*.html.backup*'))
        if backups:
            backup_file = sorted(backups)[0]  # Берем самую раннюю
            print(f"Используем резервную копию: {backup_file.name}")
        else:
            print("❌ Резервная копия не найдена!")
            return False
    
    print("=" * 70)
    print("🔧 ИСПРАВЛЕНИЕ ОТ ЧИСТОЙ РЕЗЕРВНОЙ КОПИИ")
    print("=" * 70)
    
    # Создаем новую резервную копию текущего файла
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    new_backup = target_file.with_name(f'{target_file.name}.before_clean_fix_{timestamp}')
    if target_file.exists():
        shutil.copy(str(target_file), str(new_backup))
        print(f"💾 Создана резервная копия: {new_backup.name}")
    
    # Копируем чистую резервную копию
    print(f"\n📥 Восстановление из: {backup_file.name}")
    shutil.copy(str(backup_file), str(target_file))
    
    # Читаем восстановленный файл
    content = target_file.read_text(encoding='utf-8', errors='ignore')
    
    print("\n🔧 Применение минимальных исправлений...")
    
    # 1. КРИТИЧЕСКОЕ: Удаляем onclick из <style> если есть
    content = re.sub(r'<style[^>]*onclick="[^"]*"[^>]*>', '<style>', content)
    print("  ✅ Проверен тег <style>")
    
    # 2. Находим место для вставки JavaScript
    script_start = content.find('<script>')
    if script_start == -1:
        # Если нет script тега, добавляем перед </body>
        insert_point = content.find('</body>')
    else:
        insert_point = script_start + len('<script>')
    
    # 3. Минимальный рабочий JavaScript
    working_js = """
        // ===== МИНИМАЛЬНЫЙ РАБОЧИЙ КОД =====
        
        // Функция переключения вкладок
        function switchTab(tabName) {
            // Скрываем все вкладки
            var contents = document.querySelectorAll('.content');
            for (var i = 0; i < contents.length; i++) {
                contents[i].classList.remove('active');
            }
            
            // Показываем нужную
            var target = document.getElementById(tabName);
            if (target) {
                target.classList.add('active');
            }
            
            // Подсвечиваем кнопку
            var tabs = document.querySelectorAll('.tab');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].classList.remove('active');
            }
            
            // Находим и подсвечиваем активную кнопку
            var activeTab = document.querySelector('.tab[data-tab="' + tabName + '"]');
            if (activeTab) {
                activeTab.classList.add('active');
            }
            
            // Скроллим вверх
            window.scrollTo(0, 0);
            
            // Обновляем карту если нужно
            if (tabName === 'map' && window.olMap) {
                setTimeout(function() {
                    window.olMap.updateSize();
                }, 100);
            }
        }
        
        // Обработчики кликов для вкладок
        document.addEventListener('DOMContentLoaded', function() {
            // Привязываем обработчики к кнопкам
            var tabs = document.querySelectorAll('.tab[data-tab]');
            for (var i = 0; i < tabs.length; i++) {
                tabs[i].addEventListener('click', function(e) {
                    e.preventDefault();
                    var tabName = this.getAttribute('data-tab');
                    switchTab(tabName);
                });
            }
            
            // Показываем первую вкладку
            switchTab('dashboard');
        });
        
        // Простые функции-заглушки чтобы не было ошибок
        function uploadExcel() { alert('Загрузка Excel в разработке'); }
        function configureEmail() { alert('Настройки Email в разработке'); }
        function exportSettings() { alert('Экспорт настроек в разработке'); }
        function importSettings() { alert('Импорт настроек в разработке'); }
        function processEmailQueue() { alert('Обработка email в разработке'); }
        function syncSearchSea() { alert('Синхронизация в разработке'); }
        function systemCheck() { alert('Проверка системы в разработке'); }
        function toggleAutoConfirm() { alert('Автоподтверждение в разработке'); }
        function generateReport() { alert('Генерация отчёта в разработке'); }
        function exportPDF() { alert('Экспорт PDF в разработке'); }
        function addTerminal() { alert('Добавление терминала в разработке'); }
        function exportTerminalsCSV() { alert('Экспорт CSV в разработке'); }
        function showAllSignals() { alert('Показать сигналы в разработке'); }
        function measureDistance() { alert('Измерение в разработке'); }
        function takeScreenshot() { alert('Скриншот в разработке'); }
        function clearMap() { alert('Очистка карты в разработке'); }
        
        // Функция генерации тестовых данных
        function generateTestData() {
            // Простые тестовые данные в localStorage
            var testData = [
                {
                    id: 'TEST001',
                    terminal: '427309676',
                    vessel: 'Тестовое судно',
                    mmsi: '273456789',
                    status: 'active'
                }
            ];
            
            localStorage.setItem('testData', JSON.stringify(testData));
            alert('Тестовые данные созданы!\nПроверьте localStorage в консоли браузера.');
            
            // Обновляем счетчики если есть
            var counter = document.getElementById('active-requests');
            if (counter) {
                counter.textContent = '1';
            }
        }
        
        // Простая инициализация карты
        var olMap;
        function initMap() {
            var mapEl = document.getElementById('map');
            if (!mapEl) return;
            
            if (typeof ol !== 'undefined') {
                olMap = new ol.Map({
                    target: 'map',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM()
                        })
                    ],
                    view: new ol.View({
                        center: ol.proj.fromLonLat([37.6173, 55.7558]),
                        zoom: 4
                    })
                });
                window.olMap = olMap;
            }
        }
        
        // Инициализация карты при загрузке
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initMap, 500);
        });
"""
    
    # 4. Вставляем JavaScript в начало первого <script> тега
    if '<script>' in content:
        content = content.replace('<script>', '<script>\n' + working_js + '\n', 1)
    else:
        # Если нет script тега, добавляем перед </body>
        content = content.replace('</body>', '<script>\n' + working_js + '\n</script>\n</body>')
    
    print("  ✅ Добавлен минимальный рабочий JavaScript")
    
    # 5. Убеждаемся что у кнопок есть data-tab атрибуты
    tab_buttons = [
        ('dashboard', '📊 Главная'),
        ('new-request', '➕ Новая заявка'),
        ('requests', '📋 Заявки'),
        ('signals', '📡 Сигналы'),
        ('terminals', '🖥️ Терминалы'),
        ('map', '🗺️ Карта'),
        ('reports', '📈 Отчёты')
    ]
    
    for tab_id, tab_text in tab_buttons:
        # Проверяем наличие data-tab
        pattern = f'<button[^>]*class="tab[^"]*"[^>]*>{re.escape(tab_text)}</button>'
        replacement = f'<button class="tab" data-tab="{tab_id}">{tab_text}</button>'
        content = re.sub(pattern, replacement, content)
    
    print("  ✅ Проверены data-tab атрибуты")
    
    # 6. Сохраняем результат
    target_file.write_text(content, encoding='utf-8')
    
    print("\n" + "=" * 70)
    print("✅ ИСПРАВЛЕНИЕ ЗАВЕРШЕНО!")
    print("=" * 70)
    
    print("\n📋 ЧТО БЫЛО СДЕЛАНО:")
    print("  1. Восстановлен файл из чистой резервной копии")
    print("  2. Добавлен минимальный рабочий JavaScript")
    print("  3. Настроены обработчики для вкладок")
    print("  4. Добавлены функции-заглушки")
    print("  5. Проверены data-tab атрибуты")
    
    print("\n🎯 ПРОВЕРКА:")
    print("  1. Откройте index_14_36.html в браузере")
    print("  2. Нажмите Ctrl+F5")
    print("  3. Попробуйте переключить вкладки")
    print("  4. Нажмите 'Генерировать тестовые данные'")
    
    print("\n✅ ДОЛЖНО РАБОТАТЬ:")
    print("  • Переключение всех вкладок")
    print("  • Кнопка генерации тестовых данных")
    print("  • Базовая карта (если подключен OpenLayers)")
    print("  • Все кнопки (покажут сообщения)")
    
    print("\n💡 ЕСЛИ НЕ РАБОТАЕТ:")
    print("  1. Откройте консоль браузера (F12)")
    print("  2. Проверьте ошибки")
    print("  3. Попробуйте: switchTab('terminals')")
    print("  4. Проверьте: typeof switchTab")
    
    return True

if __name__ == "__main__":
    print("🚀 ЗАПУСК ИСПРАВЛЕНИЯ ОТ ЧИСТОЙ КОПИИ")
    print("-" * 70)
    
    success = fix_from_clean()
    
    if success:
        print("\n✨ Готово! Проверьте работу в браузере.")
    else:
        print("\n❌ Не удалось выполнить исправление")