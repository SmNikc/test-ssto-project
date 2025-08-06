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
