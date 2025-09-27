#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
fix_module_conflict.py - Исправление конфликта RequestModule и SstoModule
Сохранить в: C:\Projects\test-ssto-project\backend-nest\scripts\
Запуск: python scripts\fix_module_conflict.py
"""

from pathlib import Path

PROJECT_PATH = Path("C:/Projects/test-ssto-project/backend-nest")
SRC_PATH = PROJECT_PATH / "src"

def main():
    print("Исправление конфликта модулей...\n")
    
    # 1. Обновляем RequestModule чтобы он использовал правильный сервис
    request_module = SRC_PATH / "request" / "request.module.ts"
    if request_module.exists():
        content = '''import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import SSASRequest from '../models/request';
import { RequestService } from './request.service';
import { RequestController } from './request.controller';

@Module({
  imports: [SequelizeModule.forFeature([SSASRequest])],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}'''
        
        request_module.write_text(content, encoding='utf-8')
        print("✅ Обновлен request/request.module.ts")
    
    # 2. Переименуем контроллер в request папке чтобы избежать конфликта
    old_controller = SRC_PATH / "request" / "request.controller.ts"
    if old_controller.exists():
        new_name = old_controller.with_name("request-old.controller.ts")
        old_controller.rename(new_name)
        print(f"✅ Переименован {old_controller.name} -> {new_name.name}")
    
    # 3. Обновляем app.module.ts - убираем дублирующий импорт
    app_module = SRC_PATH / "app.module.ts"
    if app_module.exists():
        content = app_module.read_text(encoding='utf-8')
        
        # Убираем SstoModule временно, так как он конфликтует
        lines = content.split('\n')
        new_lines = []
        for line in lines:
            if 'SstoModule' not in line:
                new_lines.append(line)
        
        content = '\n'.join(new_lines)
        app_module.write_text(content, encoding='utf-8')
        print("✅ Временно отключен SstoModule в app.module.ts")
    
    # 4. Переименуем контроллер в controllers чтобы не было конфликта
    controller_in_controllers = SRC_PATH / "controllers" / "request.controller.ts"
    if controller_in_controllers.exists():
        new_name = controller_in_controllers.with_name("request-ssto.controller.ts")
        controller_in_controllers.rename(new_name)
        print(f"✅ Переименован controllers/{controller_in_controllers.name} -> {new_name.name}")
    
    print("\n✨ Конфликт модулей исправлен!")
    print("\nПерезапустите сервер:")
    print("Ctrl+C")
    print("npm run start:dev")

if __name__ == "__main__":
    main()