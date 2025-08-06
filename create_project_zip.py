import os
import zipfile

def create_zip(source_dir, zip_filename, exclude_names):
    """
    Создает ZIP-архив из указанной директории, включая все подпапки и файлы,
    кроме директорий с именами из exclude_names (рекурсивно).
    """
    if os.path.exists(zip_filename):
        os.remove(zip_filename)
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in exclude_names]
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)

# === ВНИМАНИЕ! ===
# Используйте r"..." для путей или двойные обратные слэши!
source_dir = r"C:\Projects\test-ssto-project"
zip_filename = r"C:\Projects\test-ssto-project_output\SSTO_project_full.zip"
exclude_names = ['node_modules', '.git', '.angular', 'dist', '__pycache__']

create_zip(source_dir, zip_filename, exclude_names)

print("[OK] Архив project_full.zip создан.")
