import os
import zipfile

def create_zip(source_dir, zip_filename, exclude_names):
    """
    Создает ZIP-архив из указанной директории, включая все подпапки и файлы,
    кроме директорий с именами из exclude_names (рекурсивно).
    
    :param source_dir: Путь к исходной директории.
    :param zip_filename: Имя создаваемого ZIP-файла.
    :param exclude_names: Список имен директорий для исключения.
    """
    # Удаляем старый архив, если существует
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            # Исключаем директории из дальнейшего обхода
            dirs[:] = [d for d in dirs if d not in exclude_names]
            for file in files:
                file_path = os.path.join(root, file)
                # Сохраняем относительный путь в архиве
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

# Пример использования
source_dir = r"C:\Projects\test-ssto-project"
zip_filename = "project_full.zip"
exclude_names = ['node_modules', '.git', '.angular', 'dist', '__pycache__']

create_zip(source_dir, zip_filename, exclude_names)

print("[OK] Архив project_full.zip создан.")