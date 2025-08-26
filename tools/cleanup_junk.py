import argparse
import os
import fnmatch
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]

PATTERNS = [
    "*.tmp", "*.bak", "*.old", "*.orig", "*.rej", "*~",
    "npm-debug.log*", "yarn-error.log*",
    "Thumbs.db", ".DS_Store",
]

EXACT_FILES = [
    # Старые названия контроллеров (если ещё остались)
    "backend-nest/src/controllers/requestController.ts",
    "backend-nest/src/controllers/signalController.ts",
]

def iter_candidates(root: Path):
    for rel in EXACT_FILES:
        yield (root / rel)
    for pattern in PATTERNS:
        for p in root.rglob("*"):
            if p.is_file() and fnmatch.fnmatch(p.name, pattern):
                yield p

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="удалить найденные файлы (иначе только показать)")
    args = ap.parse_args()

    root = PROJECT_ROOT
    to_delete = []
    for p in iter_candidates(root):
        if p.exists():
            to_delete.append(p)

    if not to_delete:
        print("Нечего удалять — мусор не найден.")
        return

    print("Файлы-кандидаты на удаление:")
    for p in to_delete:
        print(" -", p)

    if not args.apply:
        print("\nDRY-RUN: ничего не удалено. Запустите с --apply чтобы удалить.")
        return

    for p in to_delete:
        try:
            p.unlink()
            print("[DELETED]", p)
        except Exception as e:
            print("[SKIP]", p, "->", e)

if __name__ == "__main__":
    main()
