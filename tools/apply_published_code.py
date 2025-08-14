# C:\Projects\test-ssto-project\tools\apply_published_code.py
# Назначение: применяет «публикации кода» (формат --- FILE: path ---) к файлам проекта.
# Поддержка: Windows / PowerShell. Python 3.13 ОК.
# Безопасность: не позволит выход за пределы корня проекта, игнорирует служебные строки.

import argparse
import os
import re
import sys

LANG_HINTS = {
    'ts','tsx','js','jsx','json','yaml','yml','md','sql','sh','ps1','bat',
    'dockerfile','properties','env','conf','ini','toml','py','rb','cs','java',
    'kts','kt','psm1','psd1'
}

FILE_MARKER = re.compile(
    r'^[\-\u2014]{3,}\s*FILE:\s*(.+?)\s*[\-\u2014]{3,}\s*$',
    re.IGNORECASE
)

def _strip_code_fences(lines):
    """Убирает начальный/конечный ```...``` если есть."""
    if lines and lines[0].strip().startswith('```'):
        lines = lines[1:]
    if lines and lines[-1].strip().startswith('```'):
        lines = lines[:-1]
    return lines

def _clean_payload(buffer_lines):
    """Чистит содержимое: убирает Copy/Edit, кодовые заборы, пустые края."""
    # уберём завершающий/начальный ```...```
    buffer_lines = _strip_code_fences(buffer_lines)

    # срежем хвостовые служебные строки
    while buffer_lines and buffer_lines[-1].strip().lower() in ('copy', 'edit'):
        buffer_lines.pop()

    # и начальные служебные строки (на случай, если они встречались)
    while buffer_lines and buffer_lines[0].strip().lower() in ('copy', 'edit'):
        buffer_lines.pop(0)

    # итоговый текст (с единым \n)
    text = '\n'.join(buffer_lines).rstrip('\n')
    return text + '\n'

def parse_publication(text):
    """
    Парсит ленту публикаций в список (relative_path, content).
    Поддерживает:
      --- FILE: path/to/file.ext ---
      [опционально: строка с языком, затем 'Copy'/'Edit', затем код]
      ``` (опционально)
      <код>
      ``` (опционально)
    """
    lines = text.splitlines()
    i = 0
    chunks = []
    current_path = None
    buf = []

    def flush():
        nonlocal current_path, buf, chunks
        if current_path is not None:
            content = _clean_payload(buf)
            chunks.append((current_path, content))
            current_path, buf = None, []

    while i < len(lines):
        line = lines[i]
        m = FILE_MARKER.match(line.strip())
        if m:
            # Сохраняем предыдущий блок
            flush()
            current_path = m.group(1).strip()
            buf = []

            # пропускаем подсказки языка (ts/tsx/…)
            j = i + 1
            while j < len(lines) and lines[j].strip().lower() in LANG_HINTS:
                j += 1

            # пропускаем строки Copy/Edit сразу после подсказок
            while j < len(lines) and lines[j].strip().lower() in ('copy','edit'):
                j += 1

            # если дальше открывается ``` — пропустим её
            if j < len(lines) and lines[j].strip().startswith('```'):
                j += 1

            i = j
            continue

        # накапливаем только внутри блока
        if current_path is not None:
            buf.append(line)
        i += 1

    # финальный сброс
    flush()
    return chunks

def safe_write(root, relpath, content, write):
    root_abs = os.path.abspath(root)
    # нормализуем слэши
    relpath = relpath.replace('\\', '/')
    target = os.path.abspath(os.path.join(root_abs, relpath))
    # защита от выхода из корня
    if not target.startswith(root_abs):
        print(f"[SKIP ] вне корня: {relpath}")
        return

    os.makedirs(os.path.dirname(target), exist_ok=True)

    if write:
        with open(target, 'w', encoding='utf-8', newline='\n') as f:
            f.write(content)
        print(f"[WRITE] {target} ({len(content.splitlines())} lines)")
    else:
        print(f"[DRY  ] {target} <- {len(content.splitlines())} lines (симуляция)")

def main():
    ap = argparse.ArgumentParser(
        description="Применяет публикации кода (--- FILE: … ---) к файлам проекта."
    )
    ap.add_argument("--input", "-i", required=True,
                    help="Путь к .txt/.md с публикацией кода.")
    ap.add_argument("--root", "-r", required=True,
                    help="Корень проекта (куда писать файлы).")
    ap.add_argument("--write", action="store_true",
                    help="По умолчанию dry-run. Укажите --write для записи.")
    args = ap.parse_args()

    if not os.path.isfile(args.input):
        print(f"Не найден input-файл: {args.input}")
        sys.exit(2)
    if not os.path.isdir(args.root):
        print(f"Не найден корень проекта: {args.root}")
        sys.exit(2)

    with open(args.input, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = parse_publication(text)
    if not chunks:
        print("Блоков --- FILE: … --- не найдено. Проверьте формат публикации.")
        sys.exit(1)

    print(f"Найдено блоков: {len(chunks)}")
    for relpath, content in chunks:
        safe_write(args.root, relpath, content, args.write)

    print("Готово.")

if __name__ == "__main__":
    main()
