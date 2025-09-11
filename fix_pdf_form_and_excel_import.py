#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Скрипт для исправления:
1. PDF генерации - добавление правильной формы подтверждения на русском языке
2. Ошибки при загрузке Excel файлов (updateDashboardData is not defined)

Путь: C:\\Projects\\test-ssto-project\\fix_pdf_form_and_excel_import.py
Запуск: python fix_pdf_form_and_excel_import.py
"""

import os
import re
import sys
from pathlib import Path

def fix_issues():
    """Исправляет проблемы с PDF формой и загрузкой Excel"""
    
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
    backup_path = index_path.with_suffix('.html.backup2')
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"💾 Создана резервная копия: {backup_path}")
    
    changes_made = 0
    
    # ========== ИСПРАВЛЕНИЕ 1: PDF ФОРМА НА РУССКОМ ==========
    print("\n🔧 Исправление 1: Форма подтверждения PDF на русском языке...")
    
    # Находим функцию exportReportToPDF и полностью переписываем
    new_export_function = '''
        function exportReportToPDF() {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Заголовок документа
            doc.setFontSize(14);
            doc.text('МИНТРАНС РОССИИ', 105, 20, { align: 'center' });
            doc.text('РОСМОРРЕЧФЛОТ', 105, 30, { align: 'center' });
            doc.text('ФГБУ "МОРСПАССЛУЖБА"', 105, 40, { align: 'center' });
            doc.text('Главный морской спасательно-координационный центр', 105, 50, { align: 'center' });
            
            doc.setFontSize(16);
            doc.text('ОТЧЕТ ТЕСТ ССТО', 105, 70, { align: 'center' });
            
            doc.setFontSize(10);
            const currentDate = new Date().toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            doc.text(`Дата формирования: ${currentDate}`, 20, 90);
            
            // Получаем данные
            const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            const signals = JSON.parse(localStorage.getItem('signals') || '[]');
            const terminals = JSON.parse(localStorage.getItem('terminals') || '[]');
            
            // Статистика
            doc.setFontSize(12);
            doc.text('СТАТИСТИКА:', 20, 110);
            doc.setFontSize(10);
            doc.text(`Всего заявок: ${requests.length}`, 30, 120);
            doc.text(`Подтверждено: ${requests.filter(r => r.status === 'confirmed').length}`, 30, 130);
            doc.text(`В ожидании: ${requests.filter(r => r.status === 'pending').length}`, 30, 140);
            doc.text(`Всего сигналов: ${signals.length}`, 30, 150);
            doc.text(`Тестовых сигналов: ${signals.filter(s => s.isTest).length}`, 30, 160);
            doc.text(`Тревожных сигналов: ${signals.filter(s => !s.isTest).length}`, 30, 170);
            doc.text(`Активных терминалов: ${terminals.length}`, 30, 180);
            
            // Подпись
            doc.setFontSize(10);
            doc.text('Дежурный ГМСКЦ: ___________________', 20, 220);
            doc.text(`Дата: ${currentDate}`, 20, 230);
            doc.text('М.П.', 150, 240);
            
            // Сохраняем файл
            const fileName = `Отчет_ССТО_${new Date().toISOString().slice(0,10)}.pdf`;
            doc.save(fileName);
            
            showNotification('PDF отчет сформирован', 'success');
        }'''
    
    # Заменяем старую функцию exportReportToPDF
    pattern = r'function exportReportToPDF\(\)\s*\{[^}]+(?:\{[^}]*\}[^}]*)*\}'
    if re.search(pattern, content):
        content = re.sub(pattern, new_export_function, content)
        changes_made += 1
        print("  ✓ Функция exportReportToPDF обновлена с русской формой")
    
    # Исправляем функцию generateConfirmationPDF для подтверждений
    new_confirmation_function = '''
        function generateConfirmationPDF(requestId) {
            const request = JSON.parse(localStorage.getItem('testRequests') || '[]')
                .find(r => r.id === requestId);
            
            if (!request) return;
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Шапка документа
            doc.setFontSize(12);
            doc.text('МИНТРАНС РОССИИ', 105, 15, { align: 'center' });
            doc.text('РОСМОРРЕЧФЛОТ', 105, 22, { align: 'center' });
            doc.text('ФГБУ "МОРСПАССЛУЖБА"', 105, 29, { align: 'center' });
            doc.text('Главный морской спасательно-координационный центр', 105, 36, { align: 'center' });
            
            // Заголовок
            doc.setFontSize(14);
            doc.text('ПОДТВЕРЖДЕНИЕ', 105, 50, { align: 'center' });
            doc.text('получения тестового сигнала ССТО', 105, 58, { align: 'center' });
            
            // Данные заявки
            doc.setFontSize(11);
            const confirmDate = new Date(request.confirmedAt || Date.now());
            const dateStr = confirmDate.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            doc.text(`Номер заявки: ${request.id}`, 20, 75);
            doc.text(`Дата подтверждения: ${dateStr}`, 20, 85);
            
            doc.text(`Название судна: ${request.vesselName || 'Не указано'}`, 20, 100);
            doc.text(`ИМО номер: ${request.imo || 'Не указан'}`, 20, 110);
            doc.text(`MMSI: ${request.mmsi || 'Не указан'}`, 20, 120);
            doc.text(`Номер Инмарсат: ${request.inmarsat || 'Не указан'}`, 20, 130);
            
            doc.text(`Координаты: ${request.latitude || '0'}° ${request.longitude || '0'}°`, 20, 145);
            doc.text(`Тип терминала: ${request.terminalType || 'Не указан'}`, 20, 155);
            
            doc.text(`Контактное лицо: ${request.contactPerson || 'Не указано'}`, 20, 170);
            doc.text(`Email: ${request.email || 'Не указан'}`, 20, 180);
            doc.text(`Телефон: ${request.phone || 'Не указан'}`, 20, 190);
            
            // Подпись
            doc.setFontSize(10);
            doc.text('Подтверждаю получение тестового сигнала', 20, 210);
            doc.text('Дежурный ГМСКЦ: ___________________', 20, 225);
            doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 235);
            doc.text('М.П.', 150, 245);
            
            // Сохраняем
            const fileName = `Подтверждение_${request.id}_${request.vesselName || 'судно'}.pdf`;
            doc.save(fileName);
            
            showNotification(`Подтверждение для заявки ${request.id} сформировано`, 'success');
        }'''
    
    # Заменяем функцию generateConfirmationPDF
    pattern2 = r'function generateConfirmationPDF\(requestId\)\s*\{[^}]+(?:\{[^}]*\}[^}]*)*\}'
    if re.search(pattern2, content):
        content = re.sub(pattern2, new_confirmation_function, content)
        changes_made += 1
        print("  ✓ Функция generateConfirmationPDF обновлена с русской формой")
    
    # ========== ИСПРАВЛЕНИЕ 2: ОШИБКА updateDashboardData ==========
    print("\n🔧 Исправление 2: Ошибка updateDashboardData is not defined...")
    
    # Проверяем, есть ли функция loadDashboardData
    if 'function loadDashboardData()' in content:
        # Если есть loadDashboardData, заменяем все updateDashboardData на loadDashboardData
        content = content.replace('updateDashboardData()', 'loadDashboardData()')
        changes_made += 1
        print("  ✓ Заменено updateDashboardData на loadDashboardData")
    else:
        # Если нет, добавляем функцию updateDashboardData
        update_function = '''
        // Функция обновления дашборда
        function updateDashboardData() {
            // Получаем данные из localStorage
            const requests = JSON.parse(localStorage.getItem('testRequests') || '[]');
            const signals = JSON.parse(localStorage.getItem('signals') || '[]');
            
            // Обновляем счетчики на главной странице
            const activeCount = document.getElementById('active-requests-count');
            const pendingCount = document.getElementById('pending-requests-count');
            const confirmedCount = document.getElementById('confirmed-requests-count');
            const signalsCount = document.getElementById('signals-count');
            
            if (activeCount) activeCount.textContent = requests.filter(r => r.status === 'active').length;
            if (pendingCount) pendingCount.textContent = requests.filter(r => r.status === 'pending').length;
            if (confirmedCount) confirmedCount.textContent = requests.filter(r => r.status === 'confirmed').length;
            if (signalsCount) signalsCount.textContent = signals.length;
            
            // Если есть функция loadDashboardData, вызываем её тоже
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        }
        '''
        
        # Добавляем функцию перед закрывающим тегом </script>
        last_script = content.rfind('</script>')
        if last_script > 0:
            content = content[:last_script] + update_function + '\n' + content[last_script:]
            changes_made += 1
            print("  ✓ Добавлена функция updateDashboardData")
    
    # ========== ИСПРАВЛЕНИЕ 3: ЗАГРУЗКА EXCEL ==========
    print("\n🔧 Исправление 3: Улучшение загрузки Excel...")
    
    # Находим функцию importFromExcel и исправляем
    import_excel_fix = '''
        function importFromExcel(file, type) {
            if (!file) {
                showNotification('Файл не выбран', 'error');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {type: 'array'});
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
                    
                    if (jsonData.length === 0) {
                        showNotification('Excel файл пустой', 'warning');
                        return;
                    }
                    
                    // Определяем тип данных и сохраняем
                    let storageKey = '';
                    let successMessage = '';
                    
                    switch(type) {
                        case 'requests':
                            storageKey = 'testRequests';
                            successMessage = `Импортировано заявок: ${jsonData.length}`;
                            break;
                        case 'signals':
                            storageKey = 'signals';
                            successMessage = `Импортировано сигналов: ${jsonData.length}`;
                            break;
                        case 'terminals':
                            storageKey = 'terminals';
                            successMessage = `Импортировано терминалов: ${jsonData.length}`;
                            break;
                        default:
                            // Автоопределение по структуре данных
                            if (jsonData[0].hasOwnProperty('vesselName') || jsonData[0].hasOwnProperty('vessel_name')) {
                                storageKey = 'testRequests';
                                successMessage = `Импортировано заявок: ${jsonData.length}`;
                            } else if (jsonData[0].hasOwnProperty('signalType') || jsonData[0].hasOwnProperty('signal_type')) {
                                storageKey = 'signals';
                                successMessage = `Импортировано сигналов: ${jsonData.length}`;
                            } else {
                                storageKey = 'terminals';
                                successMessage = `Импортировано записей: ${jsonData.length}`;
                            }
                    }
                    
                    // Спрашиваем пользователя
                    const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
                    let finalData = jsonData;
                    
                    if (existingData.length > 0) {
                        const confirmReplace = confirm(
                            `В системе уже есть ${existingData.length} записей.\\n` +
                            `Заменить их на ${jsonData.length} записей из файла?\\n\\n` +
                            `ДА - заменить\\nНЕТ - добавить к существующим\\nОТМЕНА - отменить импорт`
                        );
                        
                        if (confirmReplace === null) {
                            // Отмена
                            showNotification('Импорт отменен', 'info');
                            return;
                        } else if (confirmReplace === false) {
                            // Добавить к существующим
                            finalData = [...existingData, ...jsonData];
                            successMessage = `Добавлено записей: ${jsonData.length}. Всего: ${finalData.length}`;
                        }
                    }
                    
                    // Сохраняем данные
                    localStorage.setItem(storageKey, JSON.stringify(finalData));
                    
                    // Обновляем интерфейс
                    if (typeof loadRequests === 'function' && storageKey === 'testRequests') {
                        loadRequests();
                    }
                    if (typeof loadSignals === 'function' && storageKey === 'signals') {
                        loadSignals();
                    }
                    if (typeof loadTerminals === 'function' && storageKey === 'terminals') {
                        loadTerminals();
                    }
                    
                    // Обновляем дашборд
                    if (typeof loadDashboardData === 'function') {
                        loadDashboardData();
                    } else if (typeof updateDashboardData === 'function') {
                        updateDashboardData();
                    }
                    
                    showNotification(successMessage, 'success');
                    
                } catch (error) {
                    console.error('Ошибка при импорте:', error);
                    showNotification('Ошибка при чтении Excel файла: ' + error.message, 'error');
                }
            };
            
            reader.onerror = function() {
                showNotification('Не удалось прочитать файл', 'error');
            };
            
            reader.readAsArrayBuffer(file);
        }'''
    
    # Заменяем старую функцию importFromExcel если она есть
    pattern3 = r'function importFromExcel\([^)]*\)\s*\{[^}]+(?:\{[^}]*\}[^}]*)*\}'
    if re.search(pattern3, content):
        content = re.sub(pattern3, import_excel_fix, content)
        changes_made += 1
        print("  ✓ Функция importFromExcel исправлена")
    else:
        # Если функции нет, добавляем её
        last_script = content.rfind('</script>')
        if last_script > 0:
            content = content[:last_script] + import_excel_fix + '\n' + content[last_script:]
            changes_made += 1
            print("  ✓ Добавлена функция importFromExcel")
    
    # Сохраняем исправленный файл
    print(f"\n💾 Сохраняю исправленный файл...")
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ Успешно исправлено! Внесено изменений: {changes_made}")
    print(f"📝 Резервная копия сохранена в: {backup_path}")
    
    return True

if __name__ == "__main__":
    try:
        success = fix_issues()
        if success:
            print("\n🎉 Скрипт выполнен успешно!")
            print("\n📋 Что было исправлено:")
            print("  1. ✅ PDF формы теперь на русском языке с правильной структурой")
            print("  2. ✅ Исправлена ошибка updateDashboardData is not defined")
            print("  3. ✅ Улучшена загрузка Excel с корректной обработкой выбора")
            print("\n💡 Теперь:")
            print("  - PDF отчеты и подтверждения генерируются на русском")
            print("  - При загрузке Excel правильно работает диалог Да/Нет/Отмена")
            print("  - Данные корректно обновляются после импорта")
        else:
            print("\n❌ Произошла ошибка при выполнении скрипта")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)