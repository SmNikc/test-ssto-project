import os
import re

def clean_merge_markers_in_file(filepath):
    with open(filepath, encoding="utf-8") as f:
        lines = f.readlines()

    cleaned_lines = []
    skip = False
    for line in lines:
        if line.startswith('<<<<<<<'):
            skip = True
            continue
        if line.startswith('======='):
            skip = False
            continue
        if line.startswith('>>>>>>>'):
            continue
        if not skip:
            cleaned_lines.append(line)

    # Убираем дублирующиеся пустые строки
    code = ''.join(cleaned_lines)
    code = re.sub(r'\n{3,}', '\n\n', code)
    with open(filepath, 'w', encoding="utf-8") as f:
        f.write(code)

def walk_and_clean_merge_markers(root_dir, exts=None):
    if exts is None:
        exts = ['.js', '.ts', '.tsx', '.json', '.py', '.md', '.yaml', '.yml']
    for dirpath, _, filenames in os.walk(root_dir):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext in exts:
                fpath = os.path.join(dirpath, fname)
                with open(fpath, encoding="utf-8") as f:
                    content = f.read()
                if '<<<<<<<' in content or '=======' in content or '>>>>>>>' in content:
                    print(f'[!] Чищу конфликтные маркеры: {fpath}')
                    clean_merge_markers_in_file(fpath)

if __name__ == "__main__":
    # путь до корня вашего проекта:
    project_root = r"C:\Projects\test-ssto-project"
    walk_and_clean_merge_markers(project_root)
    print('[OK] Проверка завершена. Все конфликтные маркеры удалены.')
