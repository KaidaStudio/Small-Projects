from __future__ import annotations
from banco import salvar_evento, buscar_eventos


from datetime import datetime
import threading
import time


import serial
import csv
from io import StringIO
from flask import Response
from flask import Flask, jsonify, render_template

app = Flask(__name__)

PORTA_SERIAL = "COM6"
BAUD_RATE = 9600
MAX_RANGE_CM = 100.0

ultima_distancia = 0.0
ultimo_status = "INICIANDO"
ultima_atualizacao = None
historico_eventos: list[dict] = []
estado_anterior = None
ultimo_status_salvo = None

arduino = serial.Serial(PORTA_SERIAL, BAUD_RATE, timeout=1)


def rotular_status(status: str) -> str:
    mapa = {
        "TA_LIVRE": "Tá livre",
        "CUIDADO": "Cuidado",
        "MUITO_CUIDADO": "Muito cuidado",
        "PERIGO": "Perigo",
        "COLISAO_EMINENTE": "Colisão eminente",
    }
    return mapa.get(status, status.replace("_", " ").title())


def calcular_proximidade(distancia: float) -> int:
    if distancia is None:
        return 0
    distancia = max(0.0, min(MAX_RANGE_CM, float(distancia)))
    proximidade = 100.0 - ((distancia / MAX_RANGE_CM) * 100.0)
    return max(0, min(100, round(proximidade)))


def registrar_evento(distancia: float, status: str) -> None:
    # Mantém um histórico curto em memória para a tela do banco.
    # Depois, a mesma função pode inserir no PostgreSQL.
    if status == "TA_LIVRE":
        return

    historico_eventos.append(
        {
            "id": len(historico_eventos) + 1,
            "data_hora": datetime.now().strftime("%d/%m/%Y %H:%M:%S"),
            "distancia": round(float(distancia), 2),
            "status": status,
            "descricao": rotular_status(status),
        }
    )

    # Mantém só os últimos 25 eventos para a interface ficar leve.
    del historico_eventos[:-25]


def ler_serial() -> None:
    global ultima_distancia, ultimo_status, ultima_atualizacao, estado_anterior

    while True:
        try:
            dado = arduino.readline().decode(errors="ignore").strip()

            if not dado:
                continue

            partes = dado.split(",", 1)
            if len(partes) != 2:
                continue

            distancia = float(partes[0].replace(",", "."))
            status = partes[1].strip()

            ultima_distancia = distancia
            ultimo_status = status
            global ultimo_status_salvo

            if status in ["PERIGO", "COLISAO_EMINENTE"]:

                if status != ultimo_status_salvo:

                    try:

                        salvar_evento(
                            distancia,
                            status
                        )

                        print("EVENTO SALVO NO BANCO!")

                        ultimo_status_salvo = status

                    except Exception as erro:

                        print("ERRO AO SALVAR NO BANCO:")
                        print(erro)

                    

            elif status not in ["PERIGO", "COLISAO_EMINENTE"]:

                ultimo_status_salvo = None
            ultima_atualizacao = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

            if estado_anterior != status:
                registrar_evento(distancia, status)
                estado_anterior = status

            print(f"Distância: {ultima_distancia} cm | Status: {ultimo_status}")

        except Exception as e:
            print("Erro:", e)
            time.sleep(0.2)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/dados")
def dados():
    return jsonify(
        {
            "distancia": round(float(ultima_distancia), 2),
            "status": ultimo_status,
            "status_legivel": rotular_status(ultimo_status),
            "proximidade": calcular_proximidade(ultima_distancia),
            "atualizado_em": ultima_atualizacao,
        }
    )


@app.route("/historico")
def historico():

    eventos = buscar_eventos()

    resultado = []

    for evento in eventos:

        resultado.append({
            "id": evento[0],
            "data_hora": evento[1].strftime("%d/%m/%Y %H:%M:%S"),
            "distancia": float(evento[2]),
            "status": evento[3],
            "descricao": rotular_status(evento[3])
        })

    return jsonify(resultado)

@app.route("/estatisticas")
def estatisticas():

    eventos = buscar_eventos()

    total_eventos = len(eventos)

    ultima_colisao = None

    for evento in eventos:

        if evento[3] == "COLISAO_EMINENTE":

            ultima_colisao = evento[1].strftime(
                "%d/%m/%Y %H:%M:%S"
            )

            break

    return jsonify({
        "total_eventos": total_eventos,
        "ultima_colisao": ultima_colisao
    })

@app.route("/exportar_csv")
def exportar_csv():

    eventos = buscar_eventos()

    output = StringIO()

    writer = csv.writer(output)

    writer.writerow([
        "ID",
        "DATA_HORA",
        "DISTANCIA",
        "STATUS"
    ])

    for evento in eventos:

        writer.writerow([
            evento[0],
            evento[1],
            evento[2],
            evento[3]
        ])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={
            "Content-Disposition":
            "attachment; filename=historico_proximsys.csv"
        }
    )

@app.route("/health")
def health():
    return jsonify({"ok": True})


thread_serial = threading.Thread(target=ler_serial, daemon=True)
thread_serial.start()

if __name__ == "__main__":
    app.run(debug=False)
