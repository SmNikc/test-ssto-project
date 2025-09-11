# Создаем Python скрипт
@'
import psycopg2

try:
    # Подключение к БД
    conn = psycopg2.connect(
        host="localhost",
        port=5432,
        database="sstodb",
        user="ssto",
        password="sstopass"
    )
    
    cur = conn.cursor()
    print("Подключено к БД")
    
    # Удаляем таблицы
    cur.execute("DROP TABLE IF EXISTS signals CASCADE")
    print("Таблица signals удалена")
    
    cur.execute("DROP TABLE IF EXISTS requests CASCADE")
    print("Таблица requests удалена")
    
    # Применяем изменения
    conn.commit()
    print("Все таблицы очищены!")
    
except Exception as e:
    print(f"Ошибка: {e}")
    
finally:
    if cur:
        cur.close()
    if conn:
        conn.close()
'@ | Out-File -FilePath scripts\clean_tables.py -Encoding UTF8