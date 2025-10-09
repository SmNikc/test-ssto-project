#!/usr/bin/env python3
"""
ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ SMOKE TEST
Основано на консенсусе 4 агентов Codex

ФАЙЛЫ, КОТОРЫЕ БУДУТ ИЗМЕНЕНЫ:
  ✓ C:\\Projects\\test-ssto-project\\tests\\smoke.sh
  ✓ C:\\Projects\\test-ssto-project\\backend-nest\\src\\controllers\\requests.controller.ts
  ✓ C:\\Projects\\test-ssto-project\\backend-nest\\src\\request\\request.service.ts

СОЗДАВАЕМЫЕ БЭКАПЫ:
  → C:\\Projects\\test-ssto-project\\backups\\fixes\\smoke.sh.TIMESTAMP.bak
  → C:\\Projects\\test-ssto-project\\backups\\fixes\\requests.controller.ts.TIMESTAMP.bak
  → C:\\Projects\\test-ssto-project\\backups\\fixes\\request.service.ts.TIMESTAMP.bak

ПРОБЛЕМА:
  Ошибка 400 при создании заявки - backend не получает mmsi/vessel_name
  из-за отсутствия заголовков Content-Type и Authorization в curl

РЕШЕНИЕ (согласовано всеми 4 агентами Codex):
  1. Добавить заголовки в curl запрос smoke.sh
  2. Использовать кросс-платформенный JQ_BIN
  3. Улучшить логирование в requests.controller.ts
  4. Гарантировать ship_owner в request.service.ts
"""

import os
import re
import shutil
from datetime import datetime

PROJECT_ROOT = r"C:\Projects\test-ssto-project"
BACKUP_DIR = os.path.join(PROJECT_ROOT, "backups", "fixes")

def create_backup(file_path):
    """Создает резервную копию файла"""
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    file_name = os.path.basename(file_path)
    backup_path = os.path.join(BACKUP_DIR, f"{file_name}.{timestamp}.bak")
    shutil.copy2(file_path, backup_path)
    print(f"✅ Бэкап: {backup_path}")
    return backup_path

def fix_smoke_sh():
    """Исправляет tests/smoke.sh - добавляет заголовки в curl"""
    file_path = os.path.join(PROJECT_ROOT, "tests", "smoke.sh")
    
    print("\n" + "="*70)
    print("ИСПРАВЛЕНИЕ: tests/smoke.sh")
    print("="*70)
    print(f"Путь: {file_path}")
    
    if not os.path.exists(file_path):
        print("❌ Файл не найден")
        return False
    
    create_backup(file_path)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    changes = []
    
    # 1. Заменить ./jq.exe на ${JQ_BIN}
    if './jq.exe' in content:
        content = content.replace('./jq.exe', '"${JQ_BIN}"')
        changes.append("Заменено ./jq.exe → ${JQ_BIN}")
    
    # 2. Добавить определение JQ_BIN в начало (после set -e)
    jq_definition = '''
# Определяем доступную утилиту jq (поддерживаем Linux, macOS и Windows среды)
JQ_BIN="${JQ_BIN:-$(command -v jq 2>/dev/null)}"
if [[ -z "${JQ_BIN}" && -x "./jq" ]]; then
    JQ_BIN="./jq"
fi
if [[ -z "${JQ_BIN}" && -x "./jq.exe" ]]; then
    JQ_BIN="./jq.exe"
fi

if [[ -z "${JQ_BIN}" ]]; then
    log "${RED}✗ jq utility not found. Install jq or place jq(.exe) next to smoke.sh${NC}"
    exit 1
fi
'''
    
    if 'JQ_BIN="${JQ_BIN:-' not in content:
        # Вставляем после "set -e"
        content = re.sub(
            r'(set -e\s*\n)',
            r'\1' + jq_definition + '\n',
            content,
            count=1
        )
        changes.append("Добавлено определение JQ_BIN")
    
    # 3. Исправить curl создания заявки - добавить заголовки
    old_curl_pattern = r'CREATE_RESPONSE=\$\(curl -fsS -X POST "\$\{API_BASE\}/requests" \\\s+-d "\$\{REQUEST_PAYLOAD\}"'
    
    if re.search(old_curl_pattern, content):
        new_curl = '''CREATE_RESPONSE=$(curl -fsS -X POST "${API_BASE}/requests" \\
    -H "Authorization: Bearer ${TOK}" \\
    -H 'Content-Type: application/json' \\
    -d "${REQUEST_PAYLOAD}"'''
        
        content = re.sub(old_curl_pattern, new_curl, content)
        changes.append("✅ Добавлены заголовки в curl создания заявки")
    elif '"Authorization: Bearer ${TOK}"' in content and 'POST "${API_BASE}/requests"' in content:
        changes.append("✅ Заголовки уже присутствуют")
    else:
        print("⚠️  Не найден ожидаемый curl запрос")
        return False
    
    # Записываем изменения
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("\n".join(changes) if changes else "⚠️  Изменений не требуется")
    return True

def fix_requests_controller():
    """Улучшает логирование в requests.controller.ts"""
    file_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "controllers", "requests.controller.ts")
    
    print("\n" + "="*70)
    print("ИСПРАВЛЕНИЕ: requests.controller.ts")
    print("="*70)
    print(f"Путь: {file_path}")
    
    if not os.path.exists(file_path):
        print("❌ Файл не найден")
        return False
    
    create_backup(file_path)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, уже есть ли логирование
    if '[REQUESTS] Incoming create payload' in content:
        print("✅ Логирование уже добавлено")
        return True
    
    # Ищем метод create и добавляем логирование после try {
    old_create_start = r'(@Post\(\)\s+async create\([^{]+\{)\s*try \{'
    
    new_create_start = r'''\1
    try {
      console.log('[REQUESTS] Incoming create payload', {
        receivedKeys: Object.keys(dto || {}),
        vessel_name: dto?.vessel_name,
        mmsi: dto?.mmsi,
        ship_owner: dto?.ship_owner,
      });'''
    
    if re.search(old_create_start, content, re.DOTALL):
        content = re.sub(old_create_start, new_create_start, content, count=1, flags=re.DOTALL)
        
        # Добавляем логирование нормализованного payload перед await
        old_before_create = r'(const payload = this\.normalizeCreateDto\(dto\);)\s*(const created = await)'
        new_before_create = r'''\1
      console.log('[REQUESTS] Normalized payload', payload);
      \2'''
        
        content = re.sub(old_before_create, new_before_create, content, count=1)
        
        print("✅ Добавлено подробное логирование")
    else:
        print("⚠️  Структура метода create отличается от ожидаемой")
        return False
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def fix_request_service():
    """Гарантирует заполнение ship_owner в request.service.ts"""
    file_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "request", "request.service.ts")
    
    print("\n" + "="*70)
    print("ИСПРАВЛЕНИЕ: request.service.ts")
    print("="*70)
    print(f"Путь: {file_path}")
    
    if not os.path.exists(file_path):
        print("❌ Файл не найден")
        return False
    
    create_backup(file_path)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем, уже исправлен ли
    if 'const shipOwner =' in content or "ship_owner: data.ship_owner ?? data.owner_organization ?? 'N/A" in content:
        print("✅ Гарантия ship_owner уже добавлена")
        return True
    
    # Ищем метод create и добавляем гарантию ship_owner
    old_create_body = r'''(async create\(data: Partial<SSASRequest>\) \{[^}]*?if \(!data\.mmsi \|\| !data\.vessel_name\)[^}]+\})(\s*const requestData = \{)'''
    
    new_create_body = r'''\1

    const shipOwner =
      (typeof data.ship_owner === 'string' && data.ship_owner.trim()) ||
      (typeof data.owner_organization === 'string' && data.owner_organization.trim()) ||
      'N/A SHIP OWNER';

    const requestData = {
      ...data,
      ship_owner: shipOwner,'''
    
    if re.search(old_create_body, content, re.DOTALL):
        content = re.sub(old_create_body, new_create_body, content, count=1, flags=re.DOTALL)
        print("✅ Добавлена гарантия ship_owner")
    else:
        print("⚠️  Структура метода create отличается - пропускаем")
        return True  # Не критично
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def verify_fixes():
    """Проверяет применение всех исправлений"""
    print("\n" + "="*70)
    print("ПРОВЕРКА ИСПРАВЛЕНИЙ")
    print("="*70)
    
    checks = {}
    
    # Проверка smoke.sh
    smoke_path = os.path.join(PROJECT_ROOT, "tests", "smoke.sh")
    if os.path.exists(smoke_path):
        with open(smoke_path, 'r', encoding='utf-8') as f:
            smoke_content = f.read()
        checks["smoke.sh: Content-Type заголовок"] = 'Content-Type: application/json' in smoke_content
        checks["smoke.sh: Authorization заголовок"] = '"Authorization: Bearer ${TOK}"' in smoke_content
        checks["smoke.sh: JQ_BIN определен"] = 'JQ_BIN="${JQ_BIN:-' in smoke_content
    
    # Проверка requests.controller.ts
    controller_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "controllers", "requests.controller.ts")
    if os.path.exists(controller_path):
        with open(controller_path, 'r', encoding='utf-8') as f:
            controller_content = f.read()
        checks["requests.controller.ts: Incoming payload логирование"] = '[REQUESTS] Incoming create payload' in controller_content
        checks["requests.controller.ts: Normalized payload логирование"] = '[REQUESTS] Normalized payload' in controller_content
    
    # Проверка request.service.ts
    service_path = os.path.join(PROJECT_ROOT, "backend-nest", "src", "request", "request.service.ts")
    if os.path.exists(service_path):
        with open(service_path, 'r', encoding='utf-8') as f:
            service_content = f.read()
        checks["request.service.ts: shipOwner гарантия"] = 'const shipOwner =' in service_content or "'N/A SHIP OWNER'" in service_content
    
    all_passed = True
    for check, passed in checks.items():
        status = "✅" if passed else "❌"
        print(f"{status} {check}")
        if not passed:
            all_passed = False
    
    return all_passed

def main():
    print("="*70)
    print("ФИНАЛЬНОЕ ИСПРАВЛЕНИЕ SMOKE TEST")
    print("Основано на консенсусе 4 агентов Codex")
    print("="*70)
    
    if not os.path.exists(PROJECT_ROOT):
        print(f"\n❌ Проект не найден: {PROJECT_ROOT}")
        return 1
    
    print(f"\n✅ Проект: {PROJECT_ROOT}")
    
    # Применяем исправления
    results = {
        "smoke.sh": fix_smoke_sh(),
        "requests.controller.ts": fix_requests_controller(),
        "request.service.ts": fix_request_service(),
    }
    
    # Проверка
    if verify_fixes():
        print("\n" + "="*70)
        print("✅ ВСЕ ИСПРАВЛЕНИЯ ПРИМЕНЕНЫ УСПЕШНО")
        print("="*70)
        print("\nСледующие шаги:")
        print("1. Перезапустите backend:")
        print("   docker-compose restart backend")
        print("2. Дождитесь готовности (10-15 секунд)")
        print("3. Запустите smoke test:")
        print("   bash tests/smoke.sh")
        print(f"\nБэкапы: {BACKUP_DIR}")
        return 0
    else:
        print("\n" + "="*70)
        print("⚠️  НЕКОТОРЫЕ ПРОВЕРКИ НЕ ПРОШЛИ")
        print("="*70)
        print("Проверьте сообщения выше")
        return 1

if __name__ == "__main__":
    try:
        exit(main())
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        exit(1)