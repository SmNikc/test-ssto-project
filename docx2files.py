import os
import re
from docx import Document

HEADER_JUNK = {
    'typescript', 'javascript', 'json', 'bash', 'CopyEdit', 'CopyEdit,', 'Copy', 'Edit', 'python'
}

def extract_code_blocks(docx_path):
    doc = Document(docx_path)
    lines = []
    for para in doc.paragraphs:
        lines.append(para.text)
    text = '\n'.join(lines)
    file_blocks = re.findall(
        r'--- FILE: (.*?) ---\s*([\s\S]*?)(?=(?:--- FILE: |$))',
        text
    )
    return file_blocks

def clean_content(content):
    lines = content.strip('\n').split('\n')
    idx = 0
    # Удаляем до двух первых мусорных строк после заголовка
    while idx < min(2, len(lines)) and lines[idx].strip() in HEADER_JUNK:
        idx += 1
    skip_lines = {
        'Copy', 'Edit', 'bash', 'typescript', 'javascript', 'python', 'json',
        'You said:', 'ChatGPT said:', '',
    }
    result = []
    for line in lines[idx:]:
        s = line.strip()
        if s in skip_lines:
            continue
        if s.startswith('Публикация продолжается'):
            continue
        if s.startswith('Осталось немного'):
            continue
        if s.startswith('--- FILE:'):
            continue
        if s.startswith('См. далее'):
            continue
        if s.startswith('Пояснения:'):
            continue
        result.append(line)
    return '\n'.join(result).strip('\n')

def auto_comment_non_code(content, ext):
    if ext not in ('.py', '.js', '.ts', '.java'):
        return content
    lines = []
    for line in content.strip().split('\n'):
        lines.append(line)
    return '\n'.join(lines)

def save_code_blocks(blocks, root_dir):
    for i, (file_path, content) in enumerate(blocks, 1):
        file_path = file_path.strip().replace('\\', '/')
        if not file_path or file_path in {'.', '/', '\\'} or not re.search(r'\w', file_path):
            print(f"⚠️ Пропущен некорректный или пустой файл #{i}: {repr(file_path)}")
            continue
        abs_path = os.path.abspath(os.path.join(root_dir, file_path))
        ext = os.path.splitext(abs_path)[1].lower()
        if ext in ('.png', '.jpg', '.ico', '.exe', '.dll') or 'бинарный файл' in content.lower():
            print(f"⚠️ Пропускаю бинарный файл: {abs_path}")
            continue
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        content2 = clean_content(content)
        content2 = auto_comment_non_code(content2, ext)
        with open(abs_path, 'w', encoding='utf-8') as f:
            f.write(content2.strip() + '\n')
        print(f"✅ Сохранён: {abs_path}")

if __name__ == "__main__":
    docx_path = r"C:\Projects\test-ssto-project_output\ЛЕНТА_ССТО.docx"
    project_dir = r"C:\Projects\test-ssto-project"
    blocks = extract_code_blocks(docx_path)
    print(f"Найдено файлов: {len(blocks)}")
    save_code_blocks(blocks, project_dir)
    print("[OK] Все файлы успешно сохранены и очищены от служебных строк (CopyEdit и т.п.).")
