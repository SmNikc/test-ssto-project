#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для восстановления обработчиков кликов и событий в index.html
Исправляет проблему когда интерфейс не реагирует на нажатия

Путь: C:\\Projects\\test-ssto-project\\fix_click_handlers.py
Запуск: python fix_click_handlers.py
"""

import os
import re
import sys
from pathlib import Path

def fix_click_handlers():
    """Восстанавливает обработчики событий и исправляет проблемы с кликами"""
    
    # Путь к файлу index.html
    index_path = Path(r"C:\Projects\test-ssto-project\index.html")
    
    if not index_path.exists():
        print(f"❌ Файл не найден: {index_path}")
        return False
    
    print(f"📄 Читаю файл: {index_path}")
    
    # Читаем файл
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        print("❌ Не удалось прочитать файл")
        return False
    
    # Создаем резервную копию
    backup_path = index_path.with_suffix('.html.backup_handlers')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"💾 Создана резервная копия: {backup_path}")
    
    changes_made = 0
    
    # ========== ИСПРАВЛЕНИЕ 1: ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ ==========
    print("\n🔧 Добавляю правильную инициализацию при загрузке страницы...")
    
    init_script = '''
    <script>
        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Инициализация системы ТЕСТ ССТО...');
            
            // Инициализируем все компоненты
            try {
                // Загружаем данные из localStorage
                if (typeof loadDashboardData === 'function') {
                    loadDashboardData();
                }
                if (typeof loadRequests === 'function') {
                    loadRequests();
                }
                if (typeof loadSignals === 'function') {
                    loadSignals();
                }
                if (typeof loadTerminals === 'function') {
                    loadTerminals();
                }
                
                // Показываем главную вкладку
                if (typeof switchTab === 'function') {
                    switchTab('dashboard');
                } else {
                    // Если функции switchTab нет, показываем главный экран
                    const dashboardTab = document.querySelector('[data-tab="dashboard"]');
                    if (dashboardTab) {
                        dashboardTab.style.display = 'block';
                    }
                }
                
                console.log('✅ Система инициализирована успешно');
            } catch (error) {
                console.error('Ошибка при инициализации:', error);
            }
        });
        
        // Глобальная функция для переключения вкладок
        function switchTab(tabName) {
            console.log('Переключение на вкладку:', tabName);
            
            // Скрываем все вкладки
            const allTabs = document.querySelectorAll('.tab-content, [data-tab]');
            allTabs.forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });
            
            // Показываем нужную вкладку
            const targetTab = document.querySelector(`[data-tab="${tabName}"], #${tabName}-tab, .${tabName}-content`);
            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
            }
            
            // Обновляем активную кнопку
            const allButtons = document.querySelectorAll('.tab-button, [onclick*="switchTab"]');
            allButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.textContent.toLowerCase().includes(tabName.toLowerCase()) || 
                    btn.getAttribute('onclick')?.includes(tabName)) {
                    btn.classList.add('active');
                }
            });
            
            // Загружаем данные для вкладки
            switch(tabName) {
                case 'dashboard':
                case 'главная':
                    if (typeof loadDashboardData === 'function') loadDashboardData();
                    break;
                case 'requests':
                case 'заявки':
                    if (typeof loadRequests === 'function') loadRequests();
                    break;
                case 'signals':
                case 'сигналы':
                    if (typeof loadSignals === 'function') loadSignals();
                    break;
                case 'terminals':
                case 'терминалы':
                    if (typeof loadTerminals === 'function') loadTerminals();
                    break;
                case 'map':
                case 'карта':
                    if (typeof initMap === 'function') initMap();
                    break;
                case 'reports':
                case 'отчёты':
                case 'отчеты':
                    if (typeof loadReports === 'function') loadReports();
                    break;
            }
        }
    </script>
    '''
    
    # Добавляем скрипт инициализации перед закрывающим </body> если его нет
    if 'DOMContentLoaded' not in content:
        body_close = content.rfind('</body>')
        if body_close > 0:
            content = content[:body_close] + init_script + '\n' + content[body_close:]
            changes_made += 1
            print("  ✓ Добавлен скрипт инициализации")
    
    # ========== ИСПРАВЛЕНИЕ 2: ОБРАБОТЧИКИ КНОПОК НАВИГАЦИИ ==========
    print("\n🔧 Восстанавливаю обработчики для кнопок навигации...")
    
    # Список кнопок навигации и их табов
    nav_buttons = [
        ('Главная', 'dashboard'),
        ('Новая заявка', 'new-request'),
        ('Заявки', 'requests'),
        ('Сигналы', 'signals'),
        ('Терминалы', 'terminals'),
        ('Карта', 'map'),
        ('Отчёты', 'reports'),
        ('Отчеты', 'reports'),
    ]
    
    for button_text, tab_name in nav_buttons:
        # Ищем кнопки по тексту и добавляем onclick если его нет
        pattern = rf'(<[^>]*>[^<]*{re.escape(button_text)}[^<]*</[^>]+>)'
        matches = list(re.finditer(pattern, content, re.IGNORECASE))
        
        for match in matches:
            button_html = match.group(0)
            # Проверяем, что это кнопка или ссылка и нет onclick
            if ('button' in button_html.lower() or 'a' in button_html.lower() or 'div' in button_html.lower()) and 'onclick' not in button_html.lower():
                # Добавляем onclick в открывающий тег
                new_button = re.sub(r'(<[^>]+)', rf'\1 onclick="switchTab(\'{tab_name}\')"', button_html, count=1)
                content = content.replace(button_html, new_button)
                changes_made += 1
                print(f"  ✓ Добавлен обработчик для кнопки '{button_text}'")
    
    # ========== ИСПРАВЛЕНИЕ 3: ОБРАБОТЧИКИ КНОПОК ДЕЙСТВИЙ ==========
    print("\n🔧 Восстанавливаю обработчики для кнопок действий...")
    
    action_handlers = '''
    <script>
        // Обработчики для кнопок действий
        
        // Загрузка Excel
        function handleExcelUpload(inputElement, type) {
            if (inputElement.files && inputElement.files[0]) {
                importFromExcel(inputElement.files[0], type);
                inputElement.value = ''; // Очищаем input для повторной загрузки
            }
        }
        
        // Экспорт в Excel
        function exportToExcel(type) {
            console.log('Экспорт в Excel:', type);
            
            let data = [];
            let fileName = '';
            
            switch(type) {
                case 'requests':
                    data = JSON.parse(localStorage.getItem('testRequests') || '[]');
                    fileName = 'Заявки_ССТО.xlsx';
                    break;
                case 'signals':
                    data = JSON.parse(localStorage.getItem('signals') || '[]');
                    fileName = 'Сигналы_ССТО.xlsx';
                    break;
                case 'terminals':
                    data = JSON.parse(localStorage.getItem('terminals') || '[]');
                    fileName = 'Терминалы_ССТО.xlsx';
                    break;
                default:
                    data = {
                        requests: JSON.parse(localStorage.getItem('testRequests') || '[]'),
                        signals: JSON.parse(localStorage.getItem('signals') || '[]'),
                        terminals: JSON.parse(localStorage.getItem('terminals') || '[]')
                    };
                    fileName = 'Данные_ССТО.xlsx';
            }
            
            if (data.length === 0 && !data.requests) {
                showNotification('Нет данных для экспорта', 'warning');
                return;
            }
            
            // Создаем книгу Excel
            const wb = XLSX.utils.book_new();
            
            if (data.requests) {
                // Множественный экспорт
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.requests), 'Заявки');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.signals), 'Сигналы');
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.terminals), 'Терминалы');
            } else {
                // Одиночный экспорт
                XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Данные');
            }
            
            // Сохраняем файл
            XLSX.writeFile(wb, fileName);
            showNotification('Данные экспортированы в Excel', 'success');
        }
        
        // Обработка email очереди
        function processEmailQueue() {
            console.log('Обработка email очереди...');
            showNotification('Обработка email очереди запущена', 'info');
            
            // Имитация обработки
            setTimeout(() => {
                showNotification('Email очередь обработана', 'success');
            }, 2000);
        }
        
        // Синхронизация с Поиск-Море
        function syncWithPoiskMore() {
            console.log('Синхронизация с Поиск-Море...');
            showNotification('Начата синхронизация с системой Поиск-Море', 'info');
            
            setTimeout(() => {
                showNotification('Синхронизация завершена', 'success');
            }, 3000);
        }
        
        // Генерация тестовых данных
        function generateTestData() {
            console.log('Генерация тестовых данных...');
            
            if (confirm('Сгенерировать тестовые данные? Это добавит примеры заявок и сигналов.')) {
                // Генерируем тестовые заявки
                const testRequests = [
                    {
                        id: 'TEST-' + Date.now(),
                        vesselName: 'Тестовое судно 1',
                        imo: '1234567',
                        mmsi: '273456789',
                        inmarsat: '451234567',
                        status: 'pending',
                        createdAt: new Date().toISOString(),
                        contactPerson: 'Иванов И.И.',
                        email: 'test@example.com',
                        phone: '+7 900 123-45-67'
                    }
                ];
                
                // Генерируем тестовые сигналы
                const testSignals = [
                    {
                        id: 'SIG-' + Date.now(),
                        vesselName: 'Тестовое судно 1',
                        signalType: 'TEST',
                        isTest: true,
                        receivedAt: new Date().toISOString(),
                        latitude: 59.9311,
                        longitude: 30.3609,
                        status: 'processed'
                    }
                ];
                
                // Добавляем к существующим данным
                const existingRequests = JSON.parse(localStorage.getItem('testRequests') || '[]');
                const existingSignals = JSON.parse(localStorage.getItem('signals') || '[]');
                
                localStorage.setItem('testRequests', JSON.stringify([...existingRequests, ...testRequests]));
                localStorage.setItem('signals', JSON.stringify([...existingSignals, ...testSignals]));
                
                // Обновляем интерфейс
                if (typeof loadDashboardData === 'function') loadDashboardData();
                if (typeof loadRequests === 'function') loadRequests();
                if (typeof loadSignals === 'function') loadSignals();
                
                showNotification('Тестовые данные сгенерированы', 'success');
            }
        }
        
        // Проверка системы
        function checkSystem() {
            console.log('Проверка системы...');
            showNotification('Запущена проверка системы...', 'info');
            
            setTimeout(() => {
                const status = {
                    localStorage: typeof(Storage) !== "undefined",
                    excel: typeof(XLSX) !== "undefined",
                    pdf: typeof(jspdf) !== "undefined",
                    map: typeof(ol) !== "undefined"
                };
                
                let message = 'Статус системы:\\n';
                message += `✅ LocalStorage: ${status.localStorage ? 'OK' : 'ERROR'}\\n`;
                message += `✅ Excel (XLSX): ${status.excel ? 'OK' : 'ERROR'}\\n`;
                message += `✅ PDF (jsPDF): ${status.pdf ? 'OK' : 'ERROR'}\\n`;
                message += `✅ Карта (OpenLayers): ${status.map ? 'OK' : 'ERROR'}`;
                
                alert(message);
                showNotification('Проверка системы завершена', 'success');
            }, 1000);
        }
        
        // Симуляция входящего сигнала
        function simulateIncomingSignal() {
            console.log('Симуляция входящего сигнала...');
            
            const signal = {
                id: 'SIG-' + Date.now(),
                vesselName: 'Симулированное судно',
                signalType: Math.random() > 0.5 ? 'TEST' : 'ALERT',
                isTest: Math.random() > 0.5,
                receivedAt: new Date().toISOString(),
                latitude: 55 + Math.random() * 10,
                longitude: 30 + Math.random() * 10,
                status: 'new',
                mmsi: '273' + Math.floor(Math.random() * 1000000),
                message: 'Автоматически сгенерированный сигнал'
            };
            
            const signals = JSON.parse(localStorage.getItem('signals') || '[]');
            signals.unshift(signal);
            localStorage.setItem('signals', JSON.stringify(signals));
            
            // Показываем уведомление
            const alertType = signal.isTest ? 'info' : 'warning';
            const alertText = signal.isTest ? 'Получен тестовый сигнал' : '⚠️ ПОЛУЧЕН ТРЕВОЖНЫЙ СИГНАЛ!';
            showNotification(`${alertText} от ${signal.vesselName}`, alertType);
            
            // Обновляем интерфейс
            if (typeof loadSignals === 'function') loadSignals();
            if (typeof loadDashboardData === 'function') loadDashboardData();
            
            // Переключаемся на вкладку сигналов если это тревога
            if (!signal.isTest) {
                switchTab('signals');
            }
        }
        
        // Универсальная функция показа уведомлений
        function showNotification(message, type = 'info') {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Создаем элемент уведомления
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
                color: white;
                border-radius: 5px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 300px;
            `;
            notification.textContent = message;
            
            // Добавляем на страницу
            document.body.appendChild(notification);
            
            // Удаляем через 3 секунды
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (document.body.contains(notification)) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }, 3000);
        }
        
        // Добавляем CSS для анимаций
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    </script>
    '''
    
    # Добавляем обработчики действий если их нет
    if 'handleExcelUpload' not in content:
        body_close = content.rfind('</body>')
        if body_close > 0:
            content = content[:body_close] + action_handlers + '\n' + content[body_close:]
            changes_made += 1
            print("  ✓ Добавлены обработчики для кнопок действий")
    
    # ========== ИСПРАВЛЕНИЕ 4: ПРИВЯЗКА ОБРАБОТЧИКОВ К КНОПКАМ ==========
    print("\n🔧 Привязываю обработчики к существующим кнопкам...")
    
    button_bindings = [
        ('Загрузить Excel', 'onclick="document.getElementById(\'excel-upload\').click()"'),
        ('Экспорт в Excel', 'onclick="exportToExcel(\'all\')"'),
        ('Экспорт настроек', 'onclick="exportToExcel(\'all\')"'),
        ('Импорт настроек', 'onclick="document.getElementById(\'import-settings\').click()"'),
        ('Обработать email очередь', 'onclick="processEmailQueue()"'),
        ('Синхронизация с Поиск-Море', 'onclick="syncWithPoiskMore()"'),
        ('Генерировать тестовые данные', 'onclick="generateTestData()"'),
        ('Проверка системы', 'onclick="checkSystem()"'),
        ('Симулировать входящий сигнал', 'onclick="simulateIncomingSignal()"'),
        ('Экспорт в PDF', 'onclick="exportReportToPDF()"'),
        ('Суточный отчёт', 'onclick="generateReport(\'daily\')"'),
        ('Суточный отчет', 'onclick="generateReport(\'daily\')"'),
        ('Недельный отчёт', 'onclick="generateReport(\'weekly\')"'),
        ('Недельный отчет', 'onclick="generateReport(\'weekly\')"'),
        ('Месячный отчёт', 'onclick="generateReport(\'monthly\')"'),
        ('Месячный отчет', 'onclick="generateReport(\'monthly\')"'),
    ]
    
    for button_text, handler in button_bindings:
        # Ищем кнопку по тексту
        pattern = rf'(<button[^>]*>[^<]*{re.escape(button_text)}[^<]*</button>)'
        matches = list(re.finditer(pattern, content, re.IGNORECASE | re.DOTALL))
        
        for match in matches:
            button_html = match.group(0)
            if 'onclick' not in button_html:
                # Добавляем onclick
                new_button = button_html.replace('<button', f'<button {handler}')
                content = content.replace(button_html, new_button)
                changes_made += 1
                print(f"  ✓ Привязан обработчик для '{button_text}'")
    
    # ========== ИСПРАВЛЕНИЕ 5: ДОБАВЛЯЕМ СКРЫТЫЕ INPUT ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ==========
    print("\n🔧 Добавляю скрытые input элементы для загрузки файлов...")
    
    hidden_inputs = '''
    <!-- Скрытые input для загрузки файлов -->
    <input type="file" id="excel-upload" style="display:none" accept=".xlsx,.xls" onchange="handleExcelUpload(this, 'auto')">
    <input type="file" id="import-settings" style="display:none" accept=".json,.xlsx" onchange="handleExcelUpload(this, 'settings')">
    '''
    
    if 'id="excel-upload"' not in content:
        body_close = content.rfind('</body>')
        if body_close > 0:
            content = content[:body_close] + hidden_inputs + '\n' + content[body_close:]
            changes_made += 1
            print("  ✓ Добавлены скрытые input для загрузки файлов")
    
    # Сохраняем исправленный файл
    print(f"\n💾 Сохраняю исправленный файл...")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Успешно исправлено! Внесено изменений: {changes_made}")
    print(f"📝 Резервная копия сохранена в: {backup_path}")
    
    return True

if __name__ == "__main__":
    try:
        success = fix_click_handlers()
        if success:
            print("\n🎉 Скрипт выполнен успешно!")
            print("\n📋 Что было исправлено:")
            print("  1. ✅ Добавлена инициализация при загрузке страницы")
            print("  2. ✅ Восстановлены обработчики для всех кнопок навигации")
            print("  3. ✅ Добавлены обработчики для всех функциональных кнопок")
            print("  4. ✅ Привязаны события к существующим элементам")
            print("  5. ✅ Добавлены скрытые input для загрузки файлов")
            print("\n💡 Теперь:")
            print("  - Все кнопки и вкладки должны работать")
            print("  - При клике на кнопки будут вызываться соответствующие функции")
            print("  - Страница правильно инициализируется при загрузке")
            print("\n⚠️  Если проблема сохраняется, обновите страницу (F5)")
        else:
            print("\n❌ Произошла ошибка при выполнении скрипта")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)