import os
from sqlalchemy import create_engine, text

# Настройки из .env (backend-nest/.env)
DB_USER = os.getenv('POSTGRES_USER', 'postgres')
DB_PASS = os.getenv('POSTGRES_PASSWORD', 'postgres')
DB_NAME = os.getenv('POSTGRES_DB', 'sstodb')
DB_HOST = os.getenv('POSTGRES_HOST', 'localhost')
DB_PORT = os.getenv('POSTGRES_PORT', '5432')

ENGINE = create_engine(f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}')

def create_vessels_table():
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
        year INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_vessels_imo_mmsi ON vessels(imo, mmsi);
    """
    with ENGINE.connect() as conn:
        conn.execute(text(create_table_sql))
        conn.commit()
        print("Таблица vessels создана или уже существует.")

if __name__ == "__main__":
    create_vessels_table()
    print("Создание таблицы завершено. Готово для импорта regbooks.")