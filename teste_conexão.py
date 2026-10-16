from banco import conectar

try:
    conn = conectar()
    print("Conectado com sucesso!")
    conn.close()
except Exception as e:
    print("ERRO REAL:")
    print(type(e).__name__)
    print(repr(e))