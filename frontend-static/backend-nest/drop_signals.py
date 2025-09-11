# drop_table.py
import psycopg2

conn = None
try:
    conn = psycopg2.connect(
        database="ssto_test",
        user="postgres",
        password="postgres",
        host="localhost",
        port="5432"
    )
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS signals CASCADE")
    conn.commit()
    print("Table signals dropped successfully")
except Exception as e:
    print(f"Error: {e}")
finally:
    if conn:
        cur.close()
        conn.close()