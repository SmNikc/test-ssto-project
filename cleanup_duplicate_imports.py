import os
import re

ROOT = r"C:\Projects\test-ssto-project\frontend\src"

RX_IMPORT = re.compile(r"^\s*import\s+.*\s+from\s+['\"]([^'\"]+)['\"]\s*;\s*$")

# Точные строки, которые мог добавить предыдущий скрипт:
ADDED_RRD = "import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';"
ADDED_RHF = "import { useForm, Controller } from 'react-hook-form';"

def cleanup_file(path: str) -> bool:
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    changed = False
    # Соберём индексы импортов по модулю
    imports_by_mod = {}
    for i, ln in enumerate(lines):
        m = RX_IMPORT.match(ln)
        if m:
            imports_by_mod.setdefault(m.group(1), []).append(i)

    def drop_line_if_duplicate(added_line: str, module: str):
        nonlocal lines, changed
        if module in imports_by_mod and len(imports_by_mod[module]) > 1:
            # Если «наша» строка присутствует и импортов >1 — удаляем именно нашу
            for idx in sorted(imports_by_mod[module], reverse=True):
                if lines[idx].strip() == added_line:
                    del lines[idx]
                    changed = True
                    break

    # Удаляем нашу «широкую» RRD-строку, если в файле есть другой импорт из RRD
    drop_line_if_duplicate(ADDED_RRD, "react-router-dom")
    # Удаляем нашу RHF-строку, если есть другой импорт из RHF
    drop_line_if_duplicate(ADDED_RHF, "react-hook-form")

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
    return changed

def walk():
    changed_any = False
    for root, _, files in os.walk(ROOT):
        for fn in files:
            if fn.endswith((".ts", ".tsx")):
                if cleanup_file(os.path.join(root, fn)):
                    print("[CLEANED]", os.path.join(root, fn))
                    changed_any = True
    if not changed_any:
        print("Дубликатов, требующих удаления, не найдено.")

if __name__ == "__main__":
    walk()
