# -*- coding: utf-8 -*-
"""
fix_code.py — единоразовая массовая корректировка кода проекта ССТО.
Запускать из корня: python fix_code.py

Что делает:
- FRONTEND (TSX/TS):
  * чистит мусорные вставки: ```*, --- FILE: ..., Copy/CopyEdit, markdown/ts/typescript метки
  * сливает дубли импортов react-router-dom в единый импорт
  * сливает дубли импортов react-hook-form в единый импорт
  * добавляет типы в Controller.render: ({ field, fieldState }: { field: any; fieldState: any })
  * если есть только field — типизирует как any
- BACKEND (TS):
  * вычищает русские вставки-строки, не являющиеся комментариями TS
  * правит Sequelize.Op -> Op и добавляет import { Op } from 'sequelize'
  * если видит @Controller и нет импорта Controller — добавляет базовый импорт из @nestjs/common

Выводит список изменённых файлов.
"""

from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent

FRONT_SRC = ROOT / "frontend" / "src"
BACK_SRC  = ROOT / "backend-nest" / "src"

changed_files: list[Path] = []

# ---------- общие утилиты ----------

FENCE_RE = re.compile(
    r"```[a-zA-Z]*\s*$.*?^```$",
    flags=re.MULTILINE | re.DOTALL
)
FILE_HEADER_RE = re.compile(r"^---\s*FILE:.*?---\s*$", re.MULTILINE)
TRASH_LINES_RE = re.compile(
    r"^\s*(?:CopyEdit|Copy|typescript|ts|markdown)\s*$", re.IGNORECASE | re.MULTILINE
)
# строки типа (Добавляем ...), (Аналогично ...), “2. Реализация ...”
RU_GARBAGE_LINE_RE = re.compile(
    r"^\s*(?:\((?:Добав|Аналог|Примеч|Тут|Врем|Заглуш).*\)|\d+\.\s*[А-Яа-яЁё].*)\s*$",
    re.MULTILINE
)

def write_if_changed(p: Path, original: str, updated: str):
    if updated != original:
        p.write_text(updated, encoding="utf-8")
        changed_files.append(p)

def strip_markdown_noise(code: str) -> str:
    code = FENCE_RE.sub("", code)
    code = FILE_HEADER_RE.sub("", code)
    code = TRASH_LINES_RE.sub("", code)
    return code

# ---------- FRONTEND правки ----------

IMPORT_RRD_RE = re.compile(
    r"^\s*import\s*\{([^}]*)\}\s*from\s*['\"]react-router-dom['\"]\s*;\s*$",
    re.MULTILINE
)
IMPORT_RRD_DEFAULT_RE = re.compile(
    r"^\s*import\s+([A-Za-z0-9_*{}\s,]+)\s+from\s+['\"]react-router-dom['\"]\s*;\s*$",
    re.MULTILINE
)

def merge_react_router_dom_imports(code: str) -> str:
    # соберём все именованные импорты
    named_sets: list[str] = []
    for m in IMPORT_RRD_RE.finditer(code):
        named = m.group(1)
        named_sets.extend([x.strip() for x in named.split(",") if x.strip()])

    # учтём возможные строки вида: import RouterStuff from 'react-router-dom'
    # (редко встречается, но удалим такие для чистоты)
    code = IMPORT_RRD_DEFAULT_RE.sub("", code)

    # удалим все исходные именованные импорты
    code = IMPORT_RRD_RE.sub("", code)

    if not named_sets:
        return code

    # нормализуем алиасы BrowserRouter as Router
    normalized = []
    has_alias = False
    for item in named_sets:
        if re.search(r"\bBrowserRouter\s+as\s+Router\b", item):
            has_alias = True
            normalized.append("BrowserRouter as Router")
        elif item == "BrowserRouter" and not has_alias:
            # если встречается BrowserRouter без алиаса — лучше алиас добавить
            has_alias = True
            normalized.append("BrowserRouter as Router")
        else:
            normalized.append(item)

    # уникализуем, сохраняя порядок
    seen = set()
    unique = []
    for itm in normalized:
        key = itm.replace(" ", "")
        if key not in seen:
            seen.add(key)
            unique.append(itm)

    # финальный импорт
    final = f"import {{ {', '.join(unique)} }} from 'react-router-dom';\n"
    # вставим в начало файла (после первых импортов) — здесь просто ставим в начало
    code = final + code.lstrip()
    return code

IMPORT_RHF_RE = re.compile(
    r"^\s*import\s*\{([^}]*)\}\s*from\s*['\"]react-hook-form['\"]\s*;\s*$",
    re.MULTILINE
)

def merge_react_hook_form_imports(code: str) -> str:
    names = []
    for m in IMPORT_RHF_RE.finditer(code):
        part = m.group(1)
        names.extend([x.strip() for x in part.split(",") if x.strip()])

    if not names:
        return code

    # удалить все импорты rhf
    code = IMPORT_RHF_RE.sub("", code)

    # нормализуем и уникализуем
    preferred_order = ["useForm", "Controller", "FieldErrors", "SubmitHandler", "FormState"]
    name_set = []
    seen = set()
    # сначала добавим известные в правильном порядке
    for n in preferred_order:
        if any(n == x.split(" as ")[0] for x in names) and n not in seen:
            seen.add(n)
            name_set.append(n)
    # потом всё остальное
    for n in names:
        base = n.split(" as ")[0]
        if base not in seen:
            seen.add(base)
            name_set.append(n)

    final = f"import {{ {', '.join(name_set)} }} from 'react-hook-form';\n"
    code = final + code.lstrip()
    return code

# типизация рендер-функций Controller
# случаи:
#   render={({ field, fieldState }) => ( ... )}
#   render={({ field }) => ( ... )}
RE_RENDER_BOTH = re.compile(r"render=\{\(\{\s*field\s*,\s*fieldState\s*\}\)\s*=>")
RE_RENDER_FIELD_ONLY = re.compile(r"render=\{\(\{\s*field\s*\}\)\s*=>")

def add_types_to_controller_render(code: str) -> str:
    code = RE_RENDER_BOTH.sub(
        "render={({ field, fieldState }: { field: any; fieldState: any }) =>", code
    )
    code = RE_RENDER_FIELD_ONLY.sub(
        "render={({ field }: { field: any }) =>", code
    )
    return code

def fix_frontend_file(p: Path):
    original = p.read_text(encoding="utf-8")
    code = original

    # 1) убрать мусорные маркдауны/вставки
    code = strip_markdown_noise(code)

    # 2) слить импорты react-router-dom/react-hook-form
    if "react-router-dom" in code:
        code = merge_react_router_dom_imports(code)
    if "react-hook-form" in code:
        code = merge_react_hook_form_imports(code)

    # 3) добавить типы в Controller.render
    if "render={" in code and "Controller" in code:
        code = add_types_to_controller_render(code)

    # 4) подсушить лишние пустые строки
    code = re.sub(r"\n{3,}", "\n\n", code)

    write_if_changed(p, original, code)

# ---------- BACKEND правки ----------

IMPORT_NEST_RE = re.compile(r"from\s+['\"]@nestjs/common['\"]")
HAS_CONTROLLER_NAME_RE = re.compile(r"\bController\b")
HAS_DECORATOR_CONTROLLER_RE = re.compile(r"@\s*Controller\b")

def ensure_nest_controller_import(code: str) -> str:
    if HAS_DECORATOR_CONTROLLER_RE.search(code):
        if not (IMPORT_NEST_RE.search(code) and HAS_CONTROLLER_NAME_RE.search(code)):
            # добавим базовый импорт
            code = "import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';\n" + code
    return code

# Sequelize.Op -> Op
SEQUELIZE_OP_RE = re.compile(r"\bSequelize\.Op\b")
IMPORT_SEQUELIZE_NAMED_RE = re.compile(r"^\s*import\s*\{([^}]*)\}\s*from\s*['\"]sequelize['\"]\s*;\s*$", re.MULTILINE)

def ensure_op_import_and_replace(code: str) -> str:
    if SEQUELIZE_OP_RE.search(code):
        code = SEQUELIZE_OP_RE.sub("Op", code)
        # проверить есть ли import { Op } from 'sequelize'
        has_named_import = False
        updated = []
        added_op = False
        for m in IMPORT_SEQUELIZE_NAMED_RE.finditer(code):
            has_named_import = True
            break
        if has_named_import:
            # добавим Op в существующий именованный импорт
            def add_op(m):
                names = [x.strip() for x in m.group(1).split(",") if x.strip()]
                if "Op" not in names:
                    names.append("Op")
                return f"import {{ {', '.join(names)} }} from 'sequelize';"
            code = IMPORT_SEQUELIZE_NAMED_RE.sub(add_op, code, count=1)
        else:
            # нет именованного импорта — добавим
            code = "import { Op } from 'sequelize';\n" + code
    return code

def strip_ru_garbage_backend(code: str) -> str:
    code = strip_markdown_noise(code)
    code = RU_GARBAGE_LINE_RE.sub("", code)
    # убрать строки вида одиночный “)” или “(”
    code = re.sub(r"^\s*[\(\)]\s*$", "", code, flags=re.MULTILINE)
    code = re.sub(r"\n{3,}", "\n\n", code)
    return code

def fix_backend_file(p: Path):
    original = p.read_text(encoding="utf-8")
    code = original

    code = strip_ru_garbage_backend(code)
    code = ensure_op_import_and_replace(code)
    code = ensure_nest_controller_import(code)

    write_if_changed(p, original, code)

# ---------- запуск ----------

def main():
    if not FRONT_SRC.exists() and not BACK_SRC.exists():
        print("Не найден ни frontend/src, ни backend-nest/src. Проверьте расположение проекта.")
        return

    print("=== Автокорректировка кода ССТО ===")

    # FRONTEND
    if FRONT_SRC.exists():
        for p in FRONT_SRC.rglob("*"):
            if p.suffix.lower() in (".tsx", ".ts") and p.is_file():
                fix_frontend_file(p)

    # BACKEND
    if BACK_SRC.exists():
        for p in BACK_SRC.rglob("*"):
            if p.suffix.lower() == ".ts" and p.is_file():
                fix_backend_file(p)

    if changed_files:
        print("\n[UPDATED FILES]")
        for p in changed_files:
            print(str(p))
    else:
        print("\nИзменений не потребовалось — всё уже чисто.")

    print("\n=== Готово ===")

if __name__ == "__main__":
    main()
