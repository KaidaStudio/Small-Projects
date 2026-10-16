import os

# força o client a trabalhar em UTF-8
os.environ["PGCLIENTENCODING"] = "UTF8"

import psycopg2

CONFIG_BANCO = {
    "host": "localhost",
    "port": "5432",
    "database": "proximsys",
    "user": "postgres",
    "password": "J081163a$"       #Trocar a Senha do Banco Aqui!
}

def conectar():
    return psycopg2.connect(**CONFIG_BANCO)

def salvar_evento(distancia, status):
    conn = conectar()
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO eventos (distancia, status)
            VALUES (%s, %s)
            """,
            (distancia, status)
        )
        conn.commit()
        cursor.close()
    finally:
        conn.close()

def buscar_eventos():

    conn = conectar()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT
            id,
            data_hora,
            distancia,
            status
        FROM eventos
        ORDER BY id DESC
        LIMIT 50
    """)

    resultados = cursor.fetchall()

    cursor.close()
    conn.close()

    return resultados