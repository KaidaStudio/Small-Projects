# Kaida Studio - ProximSys

## Como rodar

1. Instale as dependências:
   ```bash
   pip install flask pyserial
   ```

2. Ajuste a porta do Arduino no `app.py` se necessário:
   ```python
   PORTA_SERIAL = "COM6"
   ```

3. Execute:
   ```bash
   python app.py
   ```

4. Abra no navegador:
   `http://127.0.0.1:5000`

## Estrutura
- `app.py` → back-end Flask + leitura serial
- `templates/index.html` → front-end
- `static/css/style.css` → visual
- `static/js/script.js` → atualização em tempo real
- `static/img/kaida-studio-logo.jpg` → logo da Kaida Studio


# Kaida Studio - ProximSys

Sistema de monitoramento de proximidade com Arduino, interface web em tempo real, backend em Flask e persistência em PostgreSQL.

---

## Visão geral

O ProximSys mede a distância de um obstáculo usando um sensor ultrassônico HC-SR04, exibe o valor no LCD, emite alertas sonoros com buzzer, envia os dados para um backend em Python e registra eventos críticos no banco de dados.

A interface web mostra:
- distância atual;
- status de risco;
- gauge visual;
- histórico de eventos;
- estatísticas;
- exportação em CSV.

---

## Tecnologias utilizadas

### Hardware
- Arduino Uno
- Sensor ultrassônico HC-SR04
- Display LCD I2C 16x2
- Buzzer ativo 5V
- Protoboard e jumpers

### Software
- Python 3
- Flask
- PySerial
- PostgreSQL
- HTML5
- CSS3
- JavaScript
- VS Code
- Arduino IDE

---

## Estrutura do projeto

```text
kaida_studio_proximsys/
├── app.py
├── banco.py
├── sensor_proximsys.ino
├── templates/
│   └── index.html
├── static/
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
└── static/img/
    └── kaida-studio-logo.jpg




Como rodar do zero em outro computador
1. Baixe ou clone o projeto

Abra a pasta do projeto no VS Code.

2. Instale as dependências do Python

No terminal do VS Code, dentro da pasta do projeto:

pip install flask pyserial psycopg2-binary
3. Configure o PostgreSQL

Crie uma base de dados chamada:

proximsys

Crie a tabela eventos com o SQL abaixo:

CREATE TABLE eventos (
    id SERIAL PRIMARY KEY,
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    distancia NUMERIC(10,2) NOT NULL,
    status VARCHAR(30) NOT NULL
);

Se necessário, ajuste em banco.py:

usuário
senha
host
porta
nome do banco

Exemplo:

CONFIG_BANCO = {
    "host": "localhost",
    "port": "5432",
    "database": "proximsys",
    "user": "postgres",
    "password": "SUA_SENHA_AQUI"
}
4. Ajuste a porta do Arduino

No arquivo app.py, altere a porta serial conforme o computador:

PORTA_SERIAL = "COM6"

No outro PC, isso pode virar:

COM3
COM5
COM7

Confira a porta correta no Arduino IDE em Ferramentas > Porta.

5. Grave o código no Arduino

Abra o arquivo:

sensor_proximsys.ino

na Arduino IDE e faça o upload para a placa.

Conexões principais:

HC-SR04:
TRIG → D9
ECHO → D10
LCD I2C:
SDA / SCL conforme a placa
Buzzer ativo:
→ D6
→ GND
6. Execute o backend

No terminal do VS Code:

python app.py

Se tudo estiver correto, o Flask vai subir localmente.

7. Abra no navegador

Acesse:

http://127.0.0.1:5000

A interface web vai mostrar:

distância em tempo real;
status atual;
gauge visual;
histórico;
estatísticas.