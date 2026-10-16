const statusMap = {
  TA_LIVRE: {
    label: "Tá livre",
    copy: "Área segura. O objeto está distante.",
    className: "status--ta-livre",
    tone: "green",
  },
  CUIDADO: {
    label: "Cuidado",
    copy: "Aproximação detectada. Mantenha atenção.",
    className: "status--cuidado",
    tone: "yellow",
  },
  MUITO_CUIDADO: {
    label: "Muito cuidado",
    copy: "Distância baixa. Aumente a atenção.",
    className: "status--muito-cuidado",
    tone: "orange",
  },
  PERIGO: {
    label: "Perigo",
    copy: "Zona crítica. Aproximação muito alta.",
    className: "status--perigo",
    tone: "red",
  },
  COLISAO_EMINENTE: {
    label: "Colisão eminente",
    copy: "Ação imediata recomendada.",
    className: "status--colisao-eminente",
    tone: "rose",
  },
};

const state = {
  mode: "bar",
};

const els = {
  distancia: document.getElementById("distancia"),
  status: document.getElementById("status"),
  updatedAt: document.getElementById("atualizadoEm"),
  mainStatusTitle: document.getElementById("mainStatusTitle"),
  mainStatusCopy: document.getElementById("mainStatusCopy"),
  alertText: document.getElementById("alertText"),
  alertCard: document.getElementById("alertCard"),
  proximityBar: document.getElementById("proximidadeBar"),
  proximityTextBar: document.getElementById("proximidadeTextBar"),
  proximitySpeed: document.getElementById("proximidadeSpeed"),
  proximityTextSpeed: document.getElementById("proximidadeTextSpeed"),
  barFill: document.getElementById("barFill"),
  speedArc: document.getElementById("speedArc"),
  needle: document.getElementById("needle"),
  historyRows: document.getElementById("historyRows"),
  dbCount: document.getElementById("dbCount"),
  dbStatus: document.getElementById("dbStatus"),
  totalEventos: document.getElementById("totalEventos"),
  ultimaColisao: document.getElementById("ultimaColisao"),
  toggleGaugeBtn: document.getElementById("toggleGaugeBtn"),
  btnExportar: document.getElementById("btnExportar"),
  barGauge: document.getElementById("barGauge"),
  speedGauge: document.getElementById("speedGauge"),
  legend: [...document.querySelectorAll(".legend__item")],
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function prettyDate(value) {
  if (!value) return "--";
  return value;
}

function formatStatus(status) {
  return statusMap[status] || {
    label: String(status || "--").replaceAll("_", " "),
    copy: "Leitura recebida do sensor.",
    className: "",
    tone: "red",
  };
}

function setGaugeMode(mode) {
  state.mode = mode;
  const isBar = mode === "bar";
  els.barGauge.classList.toggle("is-active", isBar);
  els.barGauge.classList.toggle("hidden", !isBar);
  els.speedGauge.classList.toggle("is-active", !isBar);
  els.speedGauge.classList.toggle("hidden", isBar);
  els.toggleGaugeBtn.textContent = isBar ? "Trocar para velocímetro" : "Trocar para barra";
}

function updateLegend(activeStatus) {
  els.legend.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.status === activeStatus);
  });
}

function updateThemeByStatus(activeStatus) {
  document.body.dataset.status = activeStatus || "";
}

function updateBarGauge(proximidade, statusInfo) {
  els.barFill.style.width = `${proximidade}%`;
  els.proximityBar.textContent = `${proximidade}%`;
  els.proximityTextBar.textContent = statusInfo.label.toLowerCase();

  if (statusInfo.tone === "green") {
    els.barFill.style.filter = "hue-rotate(0deg)";
  } else if (statusInfo.tone === "yellow") {
    els.barFill.style.filter = "hue-rotate(40deg)";
  } else if (statusInfo.tone === "orange") {
    els.barFill.style.filter = "hue-rotate(70deg)";
  } else {
    els.barFill.style.filter = "hue-rotate(0deg) saturate(1.15)";
  }
}

function updateSpeedGauge(proximidade, statusInfo) {
  const circumference = 379;
  const offset = circumference - (circumference * proximidade) / 100;
  els.speedArc.style.strokeDashoffset = `${offset}`;
  const angle = -90 + (proximidade * 180) / 100;
  els.needle.style.transform = `rotate(${angle}deg)`;
  els.proximitySpeed.textContent = `${proximidade}%`;
  els.proximityTextSpeed.textContent = statusInfo.label.toLowerCase();
}

function renderStatus(data) {
  const statusInfo = formatStatus(data.status);
  const proximidade = clamp(Number(data.proximidade ?? 0), 0, 100);
  const distancia = Number(data.distancia ?? 0);

  els.distancia.textContent = `${Number.isFinite(distancia) ? distancia.toFixed(2) : "--"} cm`;
  els.status.textContent = data.status_legivel || statusInfo.label;
  els.updatedAt.textContent = prettyDate(data.atualizado_em);
  els.mainStatusTitle.textContent = statusInfo.label;
  els.mainStatusCopy.textContent = statusInfo.copy;
  els.alertText.textContent = statusInfo.copy;
  els.alertCard.className = `alert-card ${statusInfo.className || ""}`.trim();

  updateLegend(data.status);
  updateThemeByStatus(data.status);
  updateBarGauge(proximidade, statusInfo);
  updateSpeedGauge(proximidade, statusInfo);
}

function renderHistory(rows) {
  els.dbCount.textContent = `${rows.length} registro${rows.length === 1 ? "" : "s"}`;

  if (!rows.length) {
    els.historyRows.innerHTML = `<tr><td colspan="4" class="empty-row">Sem registros ainda.</td></tr>`;
    return;
  }

  els.historyRows.innerHTML = rows
    .map((row) => {
      const statusClass = `status--${String(row.status || "")
        .toLowerCase()
        .replaceAll("_", "-")}`;
      return `
        <tr>
          <td>${row.data_hora ?? "--"}</td>
          <td>${Number(row.distancia ?? 0).toFixed(2)} cm</td>
          <td><span class="status-tag ${statusClass}">${row.status ?? "--"}</span></td>
          <td>${row.descricao ?? "--"}</td>
        </tr>`;
    })
    .join("");
}

function renderStatistics(data) {
  els.totalEventos.textContent = `${Number(data.total_eventos ?? 0)}`;
  els.ultimaColisao.textContent = data.ultima_colisao || "--";
  els.dbStatus.textContent = "PostgreSQL";
}

async function atualizarDados() {
  try {
    const resposta = await fetch("/dados", { cache: "no-store" });
    const dados = await resposta.json();
    renderStatus(dados);
  } catch (erro) {
    console.error("Erro ao buscar dados:", erro);
  }
}

async function atualizarHistorico() {
  try {
    const resposta = await fetch("/historico", { cache: "no-store" });
    const dados = await resposta.json();
    renderHistory(dados);
  } catch (erro) {
    console.error("Erro ao buscar histórico:", erro);
  }
}

async function atualizarEstatisticas() {
  try {
    const resposta = await fetch("/estatisticas", { cache: "no-store" });
    const dados = await resposta.json();
    renderStatistics(dados);
  } catch (erro) {
    console.error("Erro ao buscar estatísticas:", erro);
  }
}

function initGaugeModeButton() {
  els.toggleGaugeBtn.addEventListener("click", () => {
    setGaugeMode(state.mode === "bar" ? "speed" : "bar");
  });
}

function initExportButton() {
  els.btnExportar.addEventListener("click", () => {
    window.location.href = "/exportar_csv";
  });
}

function init() {
  const style = document.createElement("style");
  style.textContent = `
    .speedometer__arc--fill {
      stroke-dasharray: 379;
    }
  `;
  document.head.appendChild(style);

  setGaugeMode("bar");
  initGaugeModeButton();
  initExportButton();

  atualizarDados();
  atualizarHistorico();
  atualizarEstatisticas();

  setInterval(atualizarDados, 500);
  setInterval(atualizarHistorico, 2500);
  setInterval(atualizarEstatisticas, 4000);
}

document.addEventListener("DOMContentLoaded", init);
