#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
final_fix.py - Финальное исправление импортов
Сохранить в: C:\Projects\test-ssto-project\backend-nest\scripts\
Запуск: python scripts\final_fix.py
"""

from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

def main():
    print("Финальное исправление импортов...\n")
    
    # Исправляем email.service.ts
    email_service = SRC_PATH / "services" / "email.service.ts"
    if email_service.exists():
        content = email_service.read_text(encoding='utf-8')
        
        # Меняем named import на default import
        content = content.replace(
            "import { Signal } from '../models/signal.model';",
            "import Signal from '../models/signal.model';"
        )
        
        email_service.write_text(content, encoding='utf-8')
        print("✅ Исправлен email.service.ts")
    
    # Проверяем другие файлы на всякий случай
    files_to_check = [
        SRC_PATH / "ssto.module.ts",
        SRC_PATH / "models" / "signal.model.ts"
    ]
    
    for file in files_to_check:
        if file.exists():
            content = file.read_text(encoding='utf-8')
            
            # Исправляем если есть проблемы
            if "import { Signal }" in content:
                content = content.replace("import { Signal }", "import Signal")
                file.write_text(content, encoding='utf-8')
                print(f"✅ Исправлен {file.name}")
            
            if "import { SSASRequest }" in content:
                content = content.replace("import { SSASRequest }", "import SSASRequest")
                file.write_text(content, encoding='utf-8')
                print(f"✅ Исправлен {file.name}")
    
    print("\n✨ Все импорты исправлены!")
    print("Сервер должен запуститься без ошибок.")

if __name__ == "__main__":
    main()