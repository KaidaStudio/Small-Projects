// ATENÇÃO, Aqui é Só pra leitura e poder ver o código, para rodar é pelo app.py

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

// Endereco I2C do LCD
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Pinos do sensor ultrassonico
const int trigPin = 9;
const int echoPin = 10;

// Pino do buzzer ativo de 2 pinos
const int buzzerPin = 6;

// Variaveis
long duracao;
float distancia;
String status;

// Controle do buzzer sem travar o loop
unsigned long ultimoToggleBuzzer = 0;
bool estadoBuzzer = false;

void setup() {

  // Inicia comunicacao serial com o PC/Python
  Serial.begin(9600);

  // Configura pinos
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);

  // Garante buzzer desligado no inicio
  digitalWrite(buzzerPin, LOW);

  // Inicia LCD
  lcd.init();
  lcd.backlight();

  // Tela inicial
  lcd.setCursor(0, 0);
  lcd.print("Sistema ON");

  lcd.setCursor(0, 1);
  lcd.print("Iniciando...");

  delay(2000);

  lcd.clear();
}

void loop() {

  // Limpa TRIG
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);

  // Envia pulso ultrassonico
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // Le tempo do echo com timeout para nao travar o sistema
  duracao = pulseIn(echoPin, HIGH, 30000);

  // Se nao recebeu eco, considera muito longe
  if (duracao == 0) {
    distancia = 999.0;
    status = "TA_LIVRE";
  } else {
    // Calcula distancia em cm
    distancia = duracao * 0.034 / 2;

    // Define status de risco
    if (distancia > 50) {
      status = "TA_LIVRE";
    }
    else if (distancia > 20) {
      status = "CUIDADO";
    }
    else if (distancia > 10) {
      status = "MUITO_CUIDADO";
    }
    else if (distancia > 5) {
      status = "PERIGO";
    }
    else {
      status = "COLISAO_EMINENTE";
    }
  }

  // Envia dados pro Python
  // Formato:
  // distancia,status
  // Exemplo:
  // 12.50,CUIDADO
  Serial.print(distancia);
  Serial.print(",");
  Serial.println(status);

  // Controla buzzer conforme a distancia
  controlarBuzzer();

  // Atualiza LCD
  lcd.clear();

  // Linha 1 -> distancia
  lcd.setCursor(0, 0);
  lcd.print("Dist:");
  lcd.print(distancia, 1);
  lcd.print("cm");

  // Linha 2 -> status
  lcd.setCursor(0, 1);

  if (status == "TA_LIVRE") {
    lcd.print("Ta Livre");
  }
  else if (status == "CUIDADO") {
    lcd.print("Cuidado");
  }
  else if (status == "MUITO_CUIDADO") {
    lcd.print("Muito Cuidado");
  }
  else if (status == "PERIGO") {
    lcd.print("PERIGO!!!");
  }
  else {
    lcd.print("COLISAO!");
  }

  // Pequena pausa para deixar o sistema fluido
  delay(200);
}

void controlarBuzzer() {

  unsigned long agora = millis();

  // TA_LIVRE -> sem som
  if (status == "TA_LIVRE") {
    digitalWrite(buzzerPin, LOW);
    estadoBuzzer = false;
    ultimoToggleBuzzer = agora;
    return;
  }

  // COLISAO_EMINENTE -> som continuo
  if (status == "COLISAO_EMINENTE") {
    digitalWrite(buzzerPin, HIGH);
    return;
  }

  // Define intervalo do bip conforme o risco
  unsigned long intervalo = 0;

  if (status == "CUIDADO") {
    intervalo = 500;
  }
  else if (status == "MUITO_CUIDADO") {
    intervalo = 250;
  }
  else if (status == "PERIGO") {
    intervalo = 100;
  }
  else {
    digitalWrite(buzzerPin, LOW);
    estadoBuzzer = false;
    ultimoToggleBuzzer = agora;
    return;
  }

  // Alterna o estado do buzzer no intervalo definido
  if (agora - ultimoToggleBuzzer >= intervalo) {
    ultimoToggleBuzzer = agora;
    estadoBuzzer = !estadoBuzzer;
    digitalWrite(buzzerPin, estadoBuzzer ? HIGH : LOW);
  }
}