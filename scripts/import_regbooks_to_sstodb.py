import os
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime
import logging
import argparse
import shutil
from dotenv import load_dotenv

# Загрузка .env файла (backend-nest/.env)
load_dotenv('backend-nest/.env')

# Создание папки logs, если отсутствует
LOGS_DIR = 'logs'
if not os.path.exists(LOGS_DIR):
    os.makedirs(LOGS_DIR)

# Настройка логирования
logging.basicConfig(
    filename='logs/import.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Настройки из .env
DB_USER = os.getenv('POSTGRES_USER', 'postgres')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'postgres')
DB_NAME = os.getenv('POSTGRES_DB', 'sstodb')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')

# Логирование строки подключения (без пароля)
logging.info(f"Подключение к БД: postgresql+psycopg2://{DB_USER}:***@{DB_HOST}:{DB_PORT}/{DB_NAME}")

# Обработка пароля (декодирование как UTF-8)
try:
    DB_PASS = DB_PASS.encode('utf-8').decode('utf-8')
except UnicodeDecodeError as e:
    logging.error(f"Ошибка кодировки в POSTGRES_PASSWORD: {str(e)}. Проверьте .env на UTF-8.")
    raise

ENGINE = create_engine(f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

# Папка для файлов regbooks
REGBOOKS_DIR = 'data/regbooks'

# Файлы для импорта
FILES = [
    'regbook2019.xlsx', 'regbook2020.xlsx', 'regbook2023.xlsx',
    'regbook2024.xlsx', 'regbook2025.xlsx'
]

# Маппинг колонок (адаптируем под вариации)
COLUMN_MAP = {
    'Рег. №': 'reg_number',
    'Наименование': 'name',
    'Позывной сигнал': 'call_sign',  # MMSI или callsign
    'Тип и назначение': 'vessel_type',
    'Дата постройки': 'build_date',
    'Валовая вместимость': 'gross_tonnage',
    'Длина габаритная': 'length',
    'Ширина габаритная': 'width',
    'Материал корпуса': 'material',
    'Мощность гл. ДВС (кВт)': 'engine_power',
}

def parse_date(date_str):
    try:
        return datetime.strptime(date_str, '%d.%m.%Y').year if date_str else None
    except:
        return None

def create_vessels_table():
    """Создание таблицы vessels с индексами (идемпотентно)."""
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS vessels (
        id SERIAL PRIMARY KEY,
        reg_number VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255),
        imo VARCHAR(20),
        mmsi VARCHAR(20),
        call_sign VARCHAR(50),
        build_year INTEGER,
        vessel_type VARCHAR(255),
        gross_tonnage FLOAT,
        length FLOAT,
        width FLOAT,
        material VARCHAR(100),
        engine_power FLOAT,
        year INTEGER,  -- год книги
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_vessels_imo_mmsi ON vessels(imo, mmsi);
    """
    try:
        with ENGINE.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
        logging.info("Таблица vessels создана или уже существует.")
        print("Таблица vessels создана или уже существует.")
    except Exception as e:
        logging.error(f"Ошибка при создании таблицы vessels: {str(e)}")
        raise

def import_file(file_path, year):
    df = pd.read_excel(file_path, sheet_name=0, header=0)
    df = df.rename(columns=COLUMN_MAP)  # Нормализация имен
    df['year'] = year  # Год книги
    df['build_year'] = df.get('build_date', '').apply(parse_date)  # Извлечение года постройки
    df['gross_tonnage'] = pd.to_numeric(df.get('gross_tonnage', 0), errors='coerce')
    df['length'] = pd.to_numeric(df.get('length', 0), errors='coerce')
    df['width'] = pd.to_numeric(df.get('width', 0), errors='coerce')
    df['engine_power'] = pd.to_numeric(df.get('engine_power', 0), errors='coerce')
    # Очистка текстов (убираем _x000D_)
    for col in ['name', 'vessel_type', 'material']:
        if col in df:
            df[col] = df[col].str.replace('_x000D_', '').str.strip()
    # Фильтр: только с reg_number
    df = df[df['reg_number'].notnull()]
    # IMO/MMSI: если нет, добавить логику поиска (например, если в call_sign выглядит как MMSI)
    df['mmsi'] = df.get('call_sign', None).apply(lambda x: x if x and len(x) == 9 and x.isdigit() else None)
    df['imo'] = None  # Заполните, если найдете в данных
    return df[['reg_number', 'name', 'imo', 'mmsi', 'call_sign', 'build_year', 'vessel_type',
               'gross_tonnage', 'length', 'width', 'material', 'engine_power', 'year']]

def main(truncate=False, delete_after_import=False):
    logging.info("Запуск импорта regbooks в sstodb...")
    print("Запуск импорта regbooks в sstodb...")

    # Создание таблицы (всегда перед импортом)
    create_vessels_table()

    # Очистка таблицы (если указано --truncate)
    if truncate:
        try:
            with ENGINE.connect() as conn:
                conn.execute(text("TRUNCATE TABLE vessels RESTART IDENTITY;"))
                conn.commit()
            logging.info("Таблица vessels очищена.")
            print("Таблица vessels очищена.")
        except Exception as e:
            logging.error(f"Ошибка при очистке таблицы vessels: {str(e)}")
            raise

    # Проверка существования папки
    if not os.path.exists(REGBOOKS_DIR):
        logging.error(f"Папка {REGBOOKS_DIR} не найдена.")
        raise FileNotFoundError(f"Папка {REGBOOKS_DIR} не найдена.")

    for file in FILES:
        file_path = os.path.join(REGBOOKS_DIR, file)
        if not os.path.exists(file_path):
            logging.warning(f"Файл {file_path} не найден, пропускаем.")
            print(f"Файл {file_path} не найден, пропускаем.")
            continue

        try:
            year = int(file.split('regbook')[1][:4])  # Извлечение года из имени файла
            logging.info(f"Импорт {file} (год {year})...")
            print(f"Импорт {file} (год {year})...")
            df = import_file(file_path, year)
            # Вставка с игнором дублей (ON CONFLICT DO NOTHING через unique constraint)
            df.to_sql('vessels', ENGINE, if_exists='append', index=False,
                      method='multi', chunksize=1000)  # Батчами для производительности
            logging.info(f"Вставлено {len(df)} записей из {file}.")
            print(f"Вставлено {len(df)} записей.")
            
            # Удаление файла, если указано
            if delete_after_import:
                os.remove(file_path)
                logging.info(f"Файл {file_path} удален после импорта.")
                print(f"Файл {file_path} удален после импорта.")
        except Exception as e:
            logging.error(f"Ошибка при импорте {file}: {str(e)}")
            raise

    logging.info("Импорт завершен. Данные в sstodb.vessels готовы для проверок по IMO/MMSI.")
    print("Импорт завершен. Данные в sstodb.vessels готовы для проверок по IMO/MMSI.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Импорт regbooks в sstodb для test-ssto-project.")
    parser.add_argument('--truncate', action='store_true', help='Очистить таблицу vessels перед импортом.')
    parser.add_argument('--delete-after-import', action='store_true', help='Удалить файлы regbooks после импорта.')
    args = parser.parse_args()
    main(truncate=args.truncate, delete_after_import=args.delete_after_import)