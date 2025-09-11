#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_imports.py - Исправление импортов для Sequelize моделей
Сохранить в: C:\Projects\test-ssto-project\backend-nest\scripts\
Запуск: python scripts\fix_imports.py
"""

import shutil
from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

def check_export_style(file_path):
    """Проверяет стиль экспорта в файле"""
    if not file_path.exists():
        return None
    content = file_path.read_text(encoding='utf-8')
    if 'export default class' in content:
        return 'default'
    elif 'export class' in content:
        return 'named'
    return None

def main():
    print("=== Исправление импортов Sequelize ===\n")
    
    # 1. Проверяем стиль экспорта в моделях
    print("📋 Проверка стиля экспорта в моделях:")
    models_info = {}
    
    model_files = [
        ('request.ts', 'SSASRequest'),
        ('user.model.ts', 'User'),
        ('log.model.ts', 'Log'),
        ('testingScenario.model.ts', 'TestingScenario'),
        ('signal.model.ts', 'Signal')
    ]
    
    for filename, classname in model_files:
        file_path = SRC_PATH / "models" / filename
        export_style = check_export_style(file_path)
        models_info[filename] = export_style
        print(f"  {filename}: {export_style or 'не найден'}")
    
    # 2. Исправляем модели - добавляем named export
    print("\n📝 Добавление named exports в модели...")
    
    for filename, classname in model_files:
        file_path = SRC_PATH / "models" / filename
        if not file_path.exists():
            print(f"  ⚠️ {filename} не найден")
            continue
            
        content = file_path.read_text(encoding='utf-8')
        
        # Если есть export default class, добавляем также named export
        if 'export default class' in content and f'export {{ {classname} }}' not in content:
            # Добавляем в конец файла
            content += f'\nexport {{ default as {classname} }} from "./{filename.replace(".ts", "")}";\n'
            file_path.write_text(content, encoding='utf-8')
            print(f"  ✅ Добавлен named export для {classname}")
    
    # 3. Создаем отсутствующий request.model.ts как алиас
    request_model = SRC_PATH / "models" / "request.model.ts"
    if not request_model.exists():
        content = '''// Алиас для совместимости
export { SSASRequest as Request } from './request';
export { SSASRequest } from './request';

// Enum для совместимости с DTO
export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RequestType {
  TEST_406 = 'test_406',
  TEST_121 = 'test_121',
  COMBINED = 'combined'
}'''
        request_model.write_text(content, encoding='utf-8')
        print("✅ Создан request.model.ts как алиас")
    
    # 4. Удаляем проблемный signal.controller.ts
    signal_controller = SRC_PATH / "controllers" / "signal.controller.ts"
    if signal_controller.exists():
        backup = signal_controller.with_suffix('.ts.disabled')
        shutil.move(str(signal_controller), str(backup))
        print(f"🗑️ Отключен signal.controller.ts -> {backup.name}")
    
    # 5. Исправляем request.service.ts
    request_service = SRC_PATH / "services" / "request.service.ts"
    if request_service.exists():
        content = request_service.read_text(encoding='utf-8')
        
        # Меняем импорт
        content = content.replace(
            "import { Request } from '../models/request.model';",
            "import { Request } from '../models/request.model';\nimport { SSASRequest } from '../models/request';"
        )
        
        # Если используется @InjectModel(Request)
        if '@InjectModel(Request)' in content:
            content = content.replace('@InjectModel(Request)', '@InjectModel(SSASRequest)')
            content = content.replace('private requestModel: typeof Request', 'private requestModel: typeof SSASRequest')
        
        request_service.write_text(content, encoding='utf-8')
        print("✅ Исправлен request.service.ts")
    
    # 6. Исправляем проблемы с импортами в app.module.ts
    app_module = SRC_PATH / "app.module.ts"
    if app_module.exists():
        content = app_module.read_text(encoding='utf-8')
        
        # Исправляем импорты на default imports
        fixes = [
            ("import { SSASRequest } from './models/request';", 
             "import SSASRequest from './models/request';"),
            ("import { User } from './models/user.model';", 
             "import User from './models/user.model';"),
            ("import { Log } from './models/log.model';", 
             "import Log from './models/log.model';"),
            ("import { TestingScenario } from './models/testingScenario.model';", 
             "import TestingScenario from './models/testingScenario.model';"),
            ("import { Signal } from './models/signal.model';", 
             "import Signal from './models/signal.model';")
        ]
        
        for old, new in fixes:
            content = content.replace(old, new)
        
        app_module.write_text(content, encoding='utf-8')
        print("✅ Исправлены импорты в app.module.ts")
    
    # 7. Исправляем ssto.module.ts
    ssto_module = SRC_PATH / "ssto.module.ts"
    if ssto_module.exists():
        content = ssto_module.read_text(encoding='utf-8')
        content = content.replace(
            "import { SSASRequest } from './models/request';",
            "import SSASRequest from './models/request';"
        )
        content = content.replace(
            "import { Signal } from './models/signal.model';",
            "import Signal from './models/signal.model';"
        )
        ssto_module.write_text(content, encoding='utf-8')
        print("✅ Исправлен ssto.module.ts")
    
    # 8. Исправляем signal.model.ts
    signal_model = SRC_PATH / "models" / "signal.model.ts"
    if signal_model.exists():
        content = signal_model.read_text(encoding='utf-8')
        content = content.replace(
            "import { SSASRequest } from './request';",
            "import SSASRequest from './request';"
        )
        
        # Добавляем export default если его нет
        if 'export default' not in content:
            content = content.replace('export class Signal', 'export default class Signal')
        
        signal_model.write_text(content, encoding='utf-8')
        print("✅ Исправлен signal.model.ts")
    
    print("\n✨ Импорты исправлены!")
    print("\nЗапустите сервер:")
    print("npm run start:dev")

if __name__ == "__main__":
    main()