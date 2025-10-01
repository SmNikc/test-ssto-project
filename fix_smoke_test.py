#!/usr/bin/env python3
"""
Скрипт для исправления проблемы с smoke test - добавление ship_owner
Исправляет файлы в проекте C:\Projects\test-ssto-project

РАСПОЛОЖЕНИЕ: scripts/fixes/fix_smoke_test.py
После применения переименовать: fix_smoke_test.APPLIED_YYYYMMDD.py
"""

import os
import sys
import shutil
from datetime import datetime
from pathlib import Path

# Настройки - путь относительно scripts/fixes/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
BACKUP_DIR = os.path.join(PROJECT_ROOT, "backups", "fixes")

def create_backup(file_path):
    """Создает резервную копию файла перед изменением"""
    if not os.path.exists(file_path):
        print(f"❌ Файл не найден: {file_path}")
        return False
    
    # Создаем директорию для бэкапов
    os.makedirs(BACKUP_DIR, exist_ok=True)
    
    # Формируем имя бэкапа с timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = os.path.basename(file_path)
    backup_path = os.path.join(BACKUP_DIR, f"{file_name}.{timestamp}.bak")
    
    # Копируем файл
    shutil.copy2(file_path, backup_path)
    print(f"✅ Создан бэкап: {backup_path}")
    return True


def fix_smoke_sh():
    """Исправляет tests/smoke.sh - добавляет ship_owner в REQUEST_PAYLOAD"""
    file_path = os.path.join(PROJECT_ROOT, "tests", "smoke.sh")
    
    print("\n" + "="*60)
    print("ИСПРАВЛЕНИЕ: tests/smoke.sh")
    print("="*60)
    
    if not os.path.exists(file_path):
        print(f"❌ Файл не найден: {file_path}")
        return False
    
    # Создаем бэкап
    if not create_backup(file_path):
        return False
    
    # Читаем содержимое
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, не исправлен ли уже файл
    if '"ship_owner": "Test Organization"' in content:
        print("⚠️  Файл уже содержит ship_owner - пропускаем")
        return True
    
    # Находим место для вставки (после owner_organization)
    old_text = '"owner_organization": "Test Organization",'
    new_text = '"owner_organization": "Test Organization",\n    "ship_owner": "Test Organization",'
    
    if old_text not in content:
        print("❌ Не найден текст для замены")
        print("Возможно, структура файла изменилась")
        return False
    
    # Выполняем замену
    new_content = content.replace(old_text, new_text)
    
    # Записываем обратно
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Добавлено поле ship_owner в REQUEST_PAYLOAD")
    print("   Строка: '\"ship_owner\": \"Test Organization\",'")
    return True


def fix_requests_controller():
    """Улучшает логирование в requests.controller.ts"""
    file_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "controllers", "requests.controller.ts")
    
    print("\n" + "="*60)
    print("ИСПРАВЛЕНИЕ: requests.controller.ts")
    print("="*60)
    
    if not os.path.exists(file_path):
        print(f"❌ Файл не найден: {file_path}")
        return False
    
    # Создаем бэкап
    if not create_backup(file_path):
        return False
    
    # Читаем содержимое
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, не исправлен ли уже
    if 'console.error(\'[REQUESTS] Failed to create request\'' in content:
        print("⚠️  Логирование уже улучшено - пропускаем")
        return True
    
    # Находим блок catch и заменяем
    old_catch = """    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка создания заявки',
        error: error.message,
      });
    }"""
    
    new_catch = """    } catch (error: any) {
      // Подробное логирование для диагностики
      const details = error?.errors?.map((e: any) => ({
        message: e?.message,
        path: e?.path,
        type: e?.type,
      }));
      console.error('[REQUESTS] Failed to create request', {
        error: error?.message,
        details,
        payload: dto,
      });
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка создания заявки',
        error: error.message,
        details,
      });
    }"""
    
    if old_catch not in content:
        print("⚠️  Не найден точный блок для замены")
        print("Возможно, файл уже модифицирован вручную")
        return True  # Не критично
    
    # Выполняем замену
    new_content = content.replace(old_catch, new_catch)
    
    # Записываем обратно
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Улучшено логирование ошибок валидации")
    return True


def fix_request_service():
    """Добавляет гарантию ship_owner в request.service.ts"""
    file_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "request", "request.service.ts")
    
    print("\n" + "="*60)
    print("ИСПРАВЛЕНИЕ: request.service.ts")
    print("="*60)
    
    if not os.path.exists(file_path):
        print(f"❌ Файл не найден: {file_path}")
        return False
    
    # Создаем бэкап
    if not create_backup(file_path):
        return False
    
    # Читаем содержимое
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, не исправлен ли уже
    if 'ship_owner: data.ship_owner ?? data.owner_organization' in content:
        print("⚠️  Гарантия ship_owner уже добавлена - пропускаем")
        return True
    
    # Находим метод create и добавляем гарантию ship_owner
    old_create = """    const requestData = {
      ...data,
      status: this.normalizeDbStatus(data.status ?? RequestStatus.DRAFT)
    };"""
    
    new_create = """    const requestData = {
      ...data,
      ship_owner: data.ship_owner ?? data.owner_organization ?? 'N/A SHIP OWNER',
      status: this.normalizeDbStatus(data.status ?? RequestStatus.DRAFT)
    };"""
    
    if old_create not in content:
        print("⚠️  Не найден точный блок для замены")
        print("Возможно, файл уже модифицирован")
        return True  # Не критично
    
    # Выполняем замену
    new_content = content.replace(old_create, new_create)
    
    # Записываем обратно
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print("✅ Добавлена гарантия заполнения ship_owner")
    return True


def verify_fixes():
    """Проверяет, что все исправления применены"""
    print("\n" + "="*60)
    print("ПРОВЕРКА ИСПРАВЛЕНИЙ")
    print("="*60)
    
    checks = {
        "smoke.sh содержит ship_owner": False,
        "requests.controller.ts содержит подробное логирование": False,
        "request.service.ts гарантирует ship_owner": False,
    }
    
    # Проверка smoke.sh
    smoke_path = os.path.join(PROJECT_ROOT, "tests", "smoke.sh")
    if os.path.exists(smoke_path):
        with open(smoke_path, 'r', encoding='utf-8') as f:
            if '"ship_owner": "Test Organization"' in f.read():
                checks["smoke.sh содержит ship_owner"] = True
    
    # Проверка requests.controller.ts
    controller_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "controllers", "requests.controller.ts")
    if os.path.exists(controller_path):
        with open(controller_path, 'r', encoding='utf-8') as f:
            if 'console.error(\'[REQUESTS] Failed to create request\'' in f.read():
                checks["requests.controller.ts содержит подробное логирование"] = True
    
    # Проверка request.service.ts
    service_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "request", "request.service.ts")
    if os.path.exists(service_path):
        with open(service_path, 'r', encoding='utf-8') as f:
            if 'ship_owner: data.ship_owner ?? data.owner_organization' in f.read():
                checks["request.service.ts гарантирует ship_owner"] = True
    
    # Выводим результаты
    all_passed = True
    for check, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"{status} {check}")
        if not passed:
            all_passed = False
    
    return all_passed


def main():
    """Основная функция"""
    print("="*60)
    print("АВТОМАТИЧЕСКОЕ ИСПРАВЛЕНИЕ SMOKE TEST")
    print("Проект: test-ssto-project")
    print("="*60)
    
    # Проверяем существование проекта
    if not os.path.exists(PROJECT_ROOT):
        print(f"\n❌ ОШИБКА: Директория проекта не найдена!")
        print(f"   Ожидалось: {PROJECT_ROOT}")
        print(f"\n💡 Укажите правильный путь в переменной PROJECT_ROOT")
        return 1
    
    print(f"\n✅ Проект найден: {PROJECT_ROOT}")
    
    # Выполняем исправления
    success = True
    
    # 1. Самое критичное - smoke.sh
    if not fix_smoke_sh():
        print("\n❌ Критическая ошибка при исправлении smoke.sh")
        success = False
    
    # 2. Улучшения (не критичны)
    fix_requests_controller()  # Игнорируем ошибки
    fix_request_service()      # Игнорируем ошибки
    
    # Проверка результатов
    print("\n")
    if verify_fixes():
        print("\n" + "="*60)
        print("✅ ВСЕ ИСПРАВЛЕНИЯ УСПЕШНО ПРИМЕНЕНЫ!")
        print("="*60)
        print("\nСледующие шаги:")
        print("1. Перезапустите backend: docker-compose restart backend")
        print("2. Запустите smoke тест: bash tests/smoke.sh")
        print("\nБэкапы сохранены в:", BACKUP_DIR)
        return 0
    else:
        print("\n" + "="*60)
        print("⚠️  НЕКОТОРЫЕ ИСПРАВЛЕНИЯ НЕ ПРИМЕНЕНЫ")
        print("="*60)
        print("\nПроверьте сообщения выше для деталей")
        print("Бэкапы сохранены в:", BACKUP_DIR)
        return 1 if not success else 0


if __name__ == "__main__":
    try:
        exit_code = main()
        sys.exit(exit_code)
    except Exception as e:
        print(f"\n❌ КРИТИЧЕСКАЯ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
