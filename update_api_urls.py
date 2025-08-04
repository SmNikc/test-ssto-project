<<<<<<< HEAD
import os

# Директория для поиска файлов
root_dir = r"C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\frontend\src"

# Функция для обновления файла
def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as file:
        content = file.read()

    # Проверяем, есть ли уже импорт config
    if "import config from" not in content:
        # Определяем относительный путь для импорта config.js
        relative_path = os.path.relpath(r"C:\Users\Admin\OneDrive\РАБОТА\ТЕСТ_ССТО\История разработки\test-ssto-project\frontend\src\config.js", os.path.dirname(filepath))
        relative_path = relative_path.replace('\\', '/').replace('config.js', '')
        import_statement = f"import config from '{relative_path}config';\n"
        content = import_statement + content

    # Заменяем http://localhost:3000 на ${config.API_BASE_URL}
    updated_content = content.replace('http://localhost:3000', '${config.API_BASE_URL}')

    # Сохраняем изменения
    with open(filepath, 'w', encoding='utf-8') as file:
        file.write(updated_content)
    print(f"Updated: {filepath}")

# Рекурсивно обходим все файлы .tsx в директории
for root, dirs, files in os.walk(root_dir):
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            update_file(filepath)
=======
CopyEdit
import os
def update_urls(root, old, new):
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith('.ts') or fname.endswith('.tsx') or fname.endswith('.js'):
                fpath = os.path.join(dirpath, fname)
                with open(fpath, 'r', encoding='utf-8') as f:
                    txt = f.read()
                if old in txt:
                    txt2 = txt.replace(old, new)
                    with open(fpath, 'w', encoding='utf-8') as f:
                        f.write(txt2)
#                     print(f'Обновлён: {fpath}')
if __name__ == "__main__":
    update_urls('frontend/src', 'http://localhost:3000', 'https://test-ssto-project.local:3000')
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
