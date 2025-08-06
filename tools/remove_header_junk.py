import os

HEADER_JUNK = {
    'typescript', 'javascript', 'json', 'bash', 'CopyEdit', 'CopyEdit,', 'Copy', 'Edit', 'python', 'markdown'
}

def clean_file_header(filepath):
    with open(filepath, encoding="utf-8") as f:
        lines = f.readlines()
    idx = 0
    while idx < min(2, len(lines)) and lines[idx].strip() in HEADER_JUNK:
        print(f'[!] Удаляю строку "{lines[idx].strip()}" из {filepath}')
        idx += 1
    # Остальной код файла (все строки кроме junk-строк в начале)
    cleaned_lines = lines[idx:]
    # Записать обратно только если были изменения
    if idx > 0:
        with open(filepath, 'w', encoding="utf-8") as f:
            f.writelines(cleaned_lines)

def walk_and_clean_headers(root_dir, exts=None):
    if exts is None:
        exts = ['.js', '.ts', '.tsx', '.json', '.py', '.md']
    for dirpath, _, filenames in os.walk(root_dir):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext in exts:
                fpath = os.path.join(dirpath, fname)
                with open(fpath, encoding="utf-8") as f:
                    head1 = f.readline().strip()
                    head2 = f.readline().strip()
                if head1 in HEADER_JUNK or head2 in HEADER_JUNK:
                    clean_file_header(fpath)

if __name__ == "__main__":
    # Укажите путь до корня проекта:
    project_root = r"C:\Projects\test-ssto-project"
    walk_and_clean_headers(project_root)
    print("[OK] Проверка завершена. Все мусорные строки типа CopyEdit удалены из заголовков файлов.")
