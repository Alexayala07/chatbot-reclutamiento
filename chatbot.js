const API_URL = window.location.origin;

const toggle = document.getElementById("chatbot-toggle");
const closeBtn = document.getElementById("chatbot-close");
const box = document.getElementById("chatbot-box");
const messagesDiv = document.getElementById("chatbot-messages");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");

const vacantesList = document.getElementById("vacantes-list");

const filtroTipo = document.getElementById("filtroTipo");
const filtroPais = document.getElementById("filtroPais");
const filtroEstado = document.getElementById("filtroEstado");
const filtroCiudad = document.getElementById("filtroCiudad");

const consultarStatusBtn = document.getElementById("consultarStatusBtn");
const folioConsulta = document.getElementById("folioConsulta");
const consultaStatusResultado = document.getElementById("consultaStatusResultado");

const startApplicationBtn = document.getElementById("startApplicationBtn");
const startApplicationBtnSecondary = document.getElementById("startApplicationBtnSecondary");

const attachCvBtn = document.getElementById("attachCvBtn");
const chatCvFile = document.getElementById("chatCvFile");

const attachIneBtn = document.getElementById("attachIneBtn");
const chatIneFile = document.getElementById("chatIneFile");

const attachCurpBtn = document.getElementById("attachCurpBtn");
const chatCurpFile = document.getElementById("chatCurpFile");

const attachDomicilioBtn = document.getElementById("attachDomicilioBtn");
const chatDomicilioFile = document.getElementById("chatDomicilioFile");

let ubicaciones = {};
let vacantesData = [];

let applicationFlow = {
  active: false,
  mode: "",
  step: 0,
  data: {},
  cvFile: null,
  ineFile: null,
  curpFile: null,
  domicilioFile: null
};

let candidateProfile = {
  nombre: "",
  correo: "",
  telefono: "",
  edad: "",
  pais: "",
  estado: "",
  ciudad: "",
  disponibilidad: "",
  tipoVacante: "",
  grupoSeleccionado: "",
  vacanteId: "",
  vacanteTitulo: "",
  puestoInteres: "",
  escolaridad: "",
  experiencia: "",
  habilidades: "",
  cvNombre: "",
  postulacionId: "",
  resumenIA: ""
};

const chatHistory = [
  {
    role: "assistant",
    type: "welcome",
    content: "Hola 👋 Soy tu asistente de reclutamiento. Puedo analizar tu CV, recomendarte vacantes y ayudarte a postularte.",
    options: [
      { label: "Analizar mi CV", value: "analizar_cv" },
      { label: "Ver vacantes", value: "ver_vacantes" },
      { label: "Iniciar postulación", value: "iniciar_postulacion" },
      { label: "Consultar estatus", value: "consultar_estatus" }
    ]
  }
];

/* =========================
   NORMALIZACIÓN Y ALIAS
========================= */
function normalizeText(text = "") {
  return String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b(cd|cd\.|ciudad)\b/g, "ciudad")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveTipoVacante(value = "") {
  const t = normalizeText(value);

  if (
    t.includes("admin") ||
    t.includes("corporativo") ||
    t.includes("oficina") ||
    t.includes("recursos humanos") ||
    t === "rh"
  ) {
    return "administrativa";
  }

  if (
    t.includes("operativa") ||
    t.includes("restaurante") ||
    t.includes("restaurant") ||
    t.includes("tienda") ||
    t.includes("sucursal")
  ) {
    return "operativa";
  }

  return value;
}

function resolvePais(value = "") {
  const t = normalizeText(value);

  const aliases = {
    "México": ["mexico", "méxico", "mx"],
    "Estados Unidos": ["estados unidos", "usa", "us", "eeuu", "eua", "united states"]
  };

  for (const [official, list] of Object.entries(aliases)) {
    if (list.some((alias) => t === normalizeText(alias) || t.includes(normalizeText(alias)))) {
      return official;
    }
  }

  return value;
}

function resolveEstado(value = "") {
  const t = normalizeText(value);

  const aliases = {
    "Chihuahua": ["chihuahua", "chih"],
    "Baja California": ["baja california", "baja", "bc", "mexicali"],
    "Jalisco": ["jalisco", "gdl", "guadalajara"],
    "Texas": ["texas", "tx", "el paso"]
  };

  for (const [official, list] of Object.entries(aliases)) {
    if (list.some((alias) => t === normalizeText(alias) || t.includes(normalizeText(alias)))) {
      return official;
    }
  }

  return value;
}

function resolveCiudad(value = "") {
  const t = normalizeText(value);

  const aliases = {
    "Ciudad Juárez": ["juarez", "ciudad juarez", "cd juarez", "cd. juarez", "jrz"],
    "Chihuahua": ["chihuahua", "chih", "cd chihuahua", "ciudad chihuahua"],
    "Guadalajara": ["guadalajara", "gdl"],
    "Mexicali": ["mexicali"],
    "El Paso": ["el paso", "paso", "elpaso"]
  };

  for (const [official, list] of Object.entries(aliases)) {
    if (list.some((alias) => t === normalizeText(alias) || t.includes(normalizeText(alias)))) {
      return official;
    }
  }

  return value;
}

function resolveGrupo(value = "", tipoVacante = "") {
  const t = normalizeText(value);
  const tipo = normalizeText(tipoVacante);

  const aliasesOperativas = {
    "Wendy's": ["wendys", "wendy", "wendy's"],
    "Applebee's": ["applebees", "applebee", "applebee's"],
    "Great American": ["great american", "great american steakhouse", "great"],
    "Ardeo": ["ardeo"],
    "Yoko": ["yoko"],
    "Little Caesars": ["little caesars", "little", "caesars", "little caesar"]
  };

  const aliasesAdministrativas = {
    "RH": ["rh", "recursos humanos", "reclutamiento"],
    "Contabilidad": ["contabilidad", "contador", "contable"],
    "Mercadotecnia": ["mercadotecnia", "marketing", "mkt"],
    "Sistemas": ["sistemas", "soporte", "soporte tecnico", "it", "tecnologia"],
    "Monitoreo": ["monitoreo", "monitorista"],
    "Proyectos y Construcción": ["proyectos", "construccion", "proyectos y construccion"],
    "Capital Humano": ["capital humano", "capital", "talento humano"]
  };

  const source = tipo === "administrativa" ? aliasesAdministrativas : aliasesOperativas;

  for (const [official, list] of Object.entries(source)) {
    if (list.some((alias) => t === normalizeText(alias) || t.includes(normalizeText(alias)))) {
      return official;
    }
  }

  return value;
}

/* =========================
   HELPERS
========================= */
function addAssistantText(content) {
  chatHistory.push({
    role: "assistant",
    type: "text",
    content
  });
  renderMessages();
}

function addUserText(content) {
  chatHistory.push({
    role: "user",
    content
  });
  renderMessages();
}

/* =========================
   RENDER
========================= */
function renderMessages() {
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  chatHistory.forEach((m) => {
    const wrapper = document.createElement("div");
    wrapper.className = `msg ${m.role}`;

    if (m.type === "welcome" || m.type === "options") {
      const text = document.createElement("div");
      text.textContent = m.content;
      wrapper.appendChild(text);

      const optionsWrap = document.createElement("div");
      optionsWrap.className = "chat-options";

      (m.options || []).forEach((opt) => {
        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = opt.label;
        btn.type = "button";

        btn.addEventListener("click", async () => {
          if (opt.value === "ver_vacantes") {
            await mostrarVacantesEnChat();
          } else if (opt.value === "iniciar_postulacion") {
            startApplicationFlow();
          } else if (opt.value === "analizar_cv") {
            startCvAnalysisFlow();
          } else if (opt.value === "consultar_estatus") {
            openChat();
            addAssistantText("Escribe tu folio en la sección de consulta de estatus para revisar tu proceso.");
          } else {
            await handleQuickOption(opt.value, opt.label);
          }
        });

        optionsWrap.appendChild(btn);
      });

      wrapper.appendChild(optionsWrap);
    } else if (m.type === "vacancies") {
      const text = document.createElement("div");
      text.textContent = m.content;
      wrapper.appendChild(text);

      const list = document.createElement("div");
      list.className = "chat-vacancies";

      (m.vacancies || []).forEach((vacante) => {
        const card = document.createElement("div");
        card.className = "chat-vacancy-card";

        card.innerHTML = `
          <h4>${vacante.titulo}</h4>
          <p><strong>${vacante.grupo}</strong></p>
          <p>${vacante.area}</p>
          <p>${vacante.ciudad}, ${vacante.estado}</p>
        `;

        const btn = document.createElement("button");
        btn.className = "chat-option-btn";
        btn.textContent = "Me interesa";
        btn.type = "button";

        btn.addEventListener("click", () => {
          seleccionarVacanteDesdeChat(vacante);
        });

        card.appendChild(btn);
        list.appendChild(card);
      });

      wrapper.appendChild(list);
    } else {
      wrapper.textContent = m.content;
    }

    messagesDiv.appendChild(wrapper);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/* =========================
   CHAT BÁSICO
========================= */
function openChat() {
  if (!box) return;
  box.classList.remove("hidden");
  if (input) input.focus();
}

function closeChat() {
  if (!box) return;
  box.classList.add("hidden");
}

async function sendMessageToBot(userText) {
  const saludo = normalizeText(userText);

  if (["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches"].includes(saludo)) {
    addUserText(userText);
    chatHistory.push({
      role: "assistant",
      type: "options",
      content: "¡Hola! Selecciona una opción para continuar:",
      options: [
        { label: "Analizar mi CV", value: "analizar_cv" },
        { label: "Ver vacantes operativas", value: "ver_operativas" },
        { label: "Ver vacantes administrativas", value: "ver_administrativas" },
        { label: "Iniciar postulación", value: "iniciar_postulacion" },
        { label: "Consultar estatus", value: "consultar_estatus" }
      ]
    });
    renderMessages();
    return;
  }

  addUserText(userText);

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chatHistory.map((m) => ({
          role: m.role,
          content: m.content
        })),
        candidateProfile
      })
    });

    const data = await response.json();

    if (data.reply) {
      chatHistory.push({
        role: data.reply.role || "assistant",
        type: "text",
        content: data.reply.content || "No pude responder en este momento."
      });
    } else {
      addAssistantText("⚠️ No pude responder en este momento.");
      return;
    }
  } catch (error) {
    console.error("Error enviando mensaje al chatbot:", error);
    addAssistantText("⚠️ Error de conexión con el servidor.");
    return;
  }

  renderMessages();
}

async function mostrarVacantesEnChat() {
  try {
    const res = await fetch(`${API_URL}/api/vacantes`);
    const vacantes = await res.json();

    if (!Array.isArray(vacantes) || !vacantes.length) {
      addAssistantText("No encontré vacantes disponibles en este momento.");
      return;
    }

    chatHistory.push({
      role: "assistant",
      type: "vacancies",
      content: "Estas son algunas vacantes disponibles. Selecciona la que te interese:",
      vacancies: vacantes.slice(0, 8)
    });

    renderMessages();
  } catch (error) {
    console.error("Error cargando vacantes en chat:", error);
    addAssistantText("No pude cargar las vacantes en este momento.");
  }
}

async function handleQuickOption(value, label) {
  addUserText(label);

  if (value === "ver_operativas") {
    await mostrarVacantesFiltradas("operativa");
    return;
  }

  if (value === "ver_administrativas") {
    await mostrarVacantesFiltradas("administrativa");
    return;
  }
}

async function mostrarVacantesFiltradas(tipo) {
  try {
    const res = await fetch(`${API_URL}/api/vacantes?tipoVacante=${encodeURIComponent(tipo)}`);
    const vacantes = await res.json();

    chatHistory.push({
      role: "assistant",
      type: "vacancies",
      content: tipo === "operativa"
        ? "Estas son las vacantes operativas disponibles:"
        : "Estas son las vacantes administrativas disponibles:",
      vacancies: vacantes
    });

    renderMessages();
  } catch (error) {
    console.error("Error filtrando vacantes:", error);
    addAssistantText("No fue posible cargar esas vacantes.");
  }
}

/* =========================
   ANÁLISIS DE CV
========================= */
function startCvAnalysisFlow() {
  applicationFlow = {
    active: true,
    mode: "cv_analysis",
    step: 100,
    data: {},
    cvFile: null,
    ineFile: null,
    curpFile: null,
    domicilioFile: null
  };

  openChat();
  addAssistantText("Perfecto. Vamos a analizar tu CV. Usa el botón 'Adjuntar CV PDF' para cargarlo y después escribe 'analizar'.");
}

async function processCvAnalysisOnly() {
  if (!applicationFlow.cvFile) {
    addAssistantText("⚠️ Primero debes adjuntar tu CV en formato PDF.");
    return;
  }

  const formData = new FormData();
  formData.append("cvFile", applicationFlow.cvFile);

  try {
    const response = await fetch(`${API_URL}/api/analizar-cv`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible analizar el CV.");
    }

    const analisis = data.analisis || {};
    const sugerencias = Array.isArray(analisis.sugerenciasIA) ? analisis.sugerenciasIA : [];

    candidateProfile.cvNombre = analisis.cvNombre || applicationFlow.cvFile.name;
    candidateProfile.resumenIA = analisis.resumenIA || "";

    addAssistantText(`✅ Análisis completado. Resumen detectado: ${candidateProfile.resumenIA || "No disponible"}`);

    if (sugerencias.length) {
      chatHistory.push({
        role: "assistant",
        type: "vacancies",
        content: "Estas son las vacantes que mejor podrían adaptarse a tu CV:",
        vacancies: sugerencias
      });
      renderMessages();
    } else {
      addAssistantText("No encontré sugerencias automáticas en este momento, pero puedes explorar las vacantes disponibles abajo.");
    }

    applicationFlow.active = false;
    applicationFlow.mode = "";
    applicationFlow.step = 0;
  } catch (error) {
    console.error("Error analizando CV:", error);
    addAssistantText(`⚠️ ${error.message}`);
  }
}

/* =========================
   UBICACIONES
========================= */
async function cargarUbicaciones() {
  const res = await fetch(`${API_URL}/api/ubicaciones`);
  ubicaciones = await res.json();
}

function llenarEstados(selectPais, targetEstado, targetCiudad) {
  const pais = selectPais.value;
  targetEstado.innerHTML = `<option value="">Todos</option>`;
  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    targetEstado.appendChild(option);
  });
}

function llenarCiudades(selectPais, selectEstado, targetCiudad) {
  const pais = selectPais.value;
  const estado = selectEstado.value;

  targetCiudad.innerHTML = `<option value="">Todas</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    targetCiudad.appendChild(option);
  });
}

/* =========================
   VACANTES EN PÁGINA
========================= */
async function cargarVacantesVista() {
  if (!vacantesList) return;

  const params = new URLSearchParams({
    tipoVacante: filtroTipo.value,
    pais: filtroPais.value,
    estado: filtroEstado.value,
    ciudad: filtroCiudad.value
  });

  const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
  vacantesData = await res.json();

  vacantesList.innerHTML = "";

  if (!vacantesData.length) {
    vacantesList.innerHTML = `<div class="status">No hay vacantes con esos filtros.</div>`;
    return;
  }

  vacantesData.forEach((vacante) => {
    const card = document.createElement("article");
    card.className = "vacante-card";
    card.innerHTML = `
      <h3>${vacante.titulo}</h3>
      <p><strong>Tipo:</strong> ${vacante.tipoVacante}</p>
      <p><strong>Grupo:</strong> ${vacante.grupo}</p>
      <p><strong>Área:</strong> ${vacante.area}</p>
      <p><strong>Ubicación:</strong> ${vacante.pais} / ${vacante.estado} / ${vacante.ciudad}</p>
      <p><strong>Sucursal:</strong> ${vacante.sucursal}</p>
      <div class="tags">
        ${vacante.requisitos.map((req) => `<span>${req}</span>`).join("")}
      </div>
      <button class="btn btn--secondary interes-btn" data-id="${vacante.id}">
        Me interesa
      </button>
    `;
    vacantesList.appendChild(card);
  });

  document.querySelectorAll(".interes-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const vacante = vacantesData.find((v) => v.id === btn.dataset.id);
      if (!vacante) return;
      seleccionarVacanteDesdeChat(vacante);
    });
  });
}

function seleccionarVacanteDesdeChat(vacante) {
  openChat();

  applicationFlow = {
    active: true,
    mode: "application",
    step: 7,
    data: {
      tipoVacante: vacante.tipoVacante,
      pais: vacante.pais,
      estado: vacante.estado,
      ciudad: vacante.ciudad,
      grupoSeleccionado: vacante.grupo,
      vacanteId: vacante.id,
      vacanteTitulo: vacante.titulo,
      puestoInteres: vacante.titulo
    },
    cvFile: null,
    ineFile: null,
    curpFile: null,
    domicilioFile: null
  };

  addAssistantText(`Perfecto. Ya registré tu interés en la vacante "${vacante.titulo}" de ${vacante.grupo} en ${vacante.ciudad}. Ahora dime: ¿cuál es tu nombre completo?`);
}

/* =========================
   ESTATUS
========================= */
async function consultarEstatus() {
  const folio = folioConsulta.value.trim();
  if (!folio) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = "⚠️ Ingresa un folio de postulación.";
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/postulacion/${encodeURIComponent(folio)}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "No fue posible consultar el estatus.");
    }

    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent =
      `✅ Estado actual: ${data.estadoSolicitud || "pendiente"} | Vacante: ${data.vacanteTitulo || "-"} | Ciudad: ${data.ciudad || "-"}`;
  } catch (error) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `⚠️ ${error.message}`;
  }
}

/* =========================
   FLUJO DE POSTULACIÓN
========================= */
function startApplicationFlow() {
  applicationFlow = {
    active: true,
    mode: "application",
    step: 1,
    data: {},
    cvFile: null,
    ineFile: null,
    curpFile: null,
    domicilioFile: null
  };

  openChat();
  addAssistantText("Perfecto. Vamos a iniciar tu postulación. Primero dime: ¿buscas una vacante operativa/restaurante o administrativa/corporativo?");
}

async function handleApplicationFlow(userText) {
  const text = userText.trim();

  switch (applicationFlow.step) {
    case 1:
      applicationFlow.data.tipoVacante = resolveTipoVacante(text);
      applicationFlow.step = 2;
      addAssistantText("¿En qué país te interesa trabajar? Ejemplo: México o Estados Unidos.");
      break;

    case 2:
      applicationFlow.data.pais = resolvePais(text);
      applicationFlow.step = 3;
      addAssistantText("¿En qué estado te interesa trabajar? Ejemplo: Chihuahua, Jalisco, Baja California o Texas.");
      break;

    case 3:
      applicationFlow.data.estado = resolveEstado(text);
      applicationFlow.step = 4;
      addAssistantText("¿En qué ciudad te interesa trabajar? Ejemplo: Ciudad Juárez, Chihuahua, Guadalajara, Mexicali o El Paso.");
      break;

    case 4:
      applicationFlow.data.ciudad = resolveCiudad(text);
      applicationFlow.step = 5;
      addAssistantText(
        applicationFlow.data.tipoVacante === "administrativa"
          ? "¿Qué departamento te interesa? Ejemplo: RH, Contabilidad, Sistemas, Mercadotecnia, Monitoreo o Capital Humano."
          : "¿Qué marca te interesa? Ejemplo: Wendy's, Applebee's, Great American, Ardeo, Yoko o Little Caesars."
      );
      break;

    case 5: {
      applicationFlow.data.grupoSeleccionado = resolveGrupo(text, applicationFlow.data.tipoVacante);

      const params = new URLSearchParams({
        tipoVacante: applicationFlow.data.tipoVacante || "",
        pais: applicationFlow.data.pais || "",
        estado: applicationFlow.data.estado || "",
        ciudad: applicationFlow.data.ciudad || "",
        grupo: applicationFlow.data.grupoSeleccionado || ""
      });

      const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
      const vacs = await res.json();

      if (!vacs.length) {
        addAssistantText("No encontré vacantes con esa combinación. Puedes intentar con otra ciudad, otra marca o escribir otra opción.");
        break;
      }

      applicationFlow.data.vacantesDisponibles = vacs;
      applicationFlow.step = 6;

      chatHistory.push({
        role: "assistant",
        type: "vacancies",
        content: "Encontré estas vacantes disponibles. Selecciona la que te interese:",
        vacancies: vacs
      });
      renderMessages();
      break;
    }

    case 6: {
      const index = Number(text) - 1;
      const vacante = applicationFlow.data.vacantesDisponibles?.[index];

      if (!vacante) {
        addAssistantText("No reconocí esa opción. Puedes escribir el número de la vacante o tocar el botón 'Me interesa' en la tarjeta.");
        break;
      }

      applicationFlow.data.vacanteId = vacante.id;
      applicationFlow.data.vacanteTitulo = vacante.titulo;
      applicationFlow.data.puestoInteres = vacante.titulo;
      applicationFlow.step = 7;
      addAssistantText("¿Cuál es tu nombre completo?");
      break;
    }

    case 7:
      applicationFlow.data.nombre = text;
      applicationFlow.step = 8;
      addAssistantText("Compárteme tu correo electrónico.");
      break;

    case 8:
      applicationFlow.data.correo = text;
      applicationFlow.step = 9;
      addAssistantText("Ahora tu teléfono, por favor.");
      break;

    case 9:
      applicationFlow.data.telefono = text;
      applicationFlow.step = 10;
      addAssistantText("¿Qué edad tienes?");
      break;

    case 10:
      applicationFlow.data.edad = text;
      applicationFlow.step = 11;
      addAssistantText("¿Cuál es tu disponibilidad? Ejemplo: tiempo completo, medio tiempo o fines de semana.");
      break;

    case 11:
      applicationFlow.data.disponibilidad = text;
      applicationFlow.step = 12;
      addAssistantText("¿Cuál es tu escolaridad?");
      break;

    case 12:
      applicationFlow.data.escolaridad = text;
      applicationFlow.step = 13;
      addAssistantText("Cuéntame brevemente tu experiencia laboral.");
      break;

    case 13:
      applicationFlow.data.experiencia = text;
      applicationFlow.step = 14;
      addAssistantText("Ahora dime tus habilidades principales.");
      break;

    case 14:
      applicationFlow.data.habilidades = text;
      applicationFlow.step = 15;
      addAssistantText("Muy bien. Ahora usa el botón 'Adjuntar CV PDF' para subir tu CV.");
      break;

    default:
      applicationFlow.active = false;
      applicationFlow.mode = "";
      break;
  }
}

async function submitApplicationFromChat() {
  if (!applicationFlow.cvFile) {
    addAssistantText("⚠️ Debes adjuntar tu CV en PDF antes de enviar la postulación.");
    return;
  }

  const formData = new FormData();
  Object.entries(applicationFlow.data).forEach(([key, value]) => {
    if (value && key !== "vacantesDisponibles") {
      formData.append(key, value);
    }
  });

  formData.append("vacanteSeleccionada", applicationFlow.data.vacanteId);
  formData.append("cvFile", applicationFlow.cvFile);

  if (applicationFlow.ineFile) formData.append("ineFile", applicationFlow.ineFile);
  if (applicationFlow.curpFile) formData.append("curpFile", applicationFlow.curpFile);
  if (applicationFlow.domicilioFile) formData.append("domicilioFile", applicationFlow.domicilioFile);

  try {
    const response = await fetch(`${API_URL}/api/postulacion`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible enviar la postulación.");
    }

    candidateProfile = {
      ...applicationFlow.data,
      postulacionId: data.postulacion.id,
      cvNombre: data.postulacion.cvNombre,
      resumenIA: data.postulacion.resumenIA,
      vacanteTitulo: data.postulacion.vacanteTitulo
    };

    applicationFlow.active = false;
    applicationFlow.mode = "";

    addAssistantText(
      `✅ Tu postulación fue enviada correctamente para ${data.postulacion.vacanteTitulo}. ` +
      `Tu folio es ${data.postulacion.id}. ` +
      `Resumen de tu CV: ${data.postulacion.resumenIA}`
    );
  } catch (error) {
    console.error("Error enviando postulación:", error);
    addAssistantText(`⚠️ ${error.message}`);
  }
}

/* =========================
   EVENTOS
========================= */
if (toggle) toggle.addEventListener("click", openChat);
if (closeBtn) closeBtn.addEventListener("click", closeChat);

if (startApplicationBtn) {
  startApplicationBtn.addEventListener("click", startCvAnalysisFlow);
}

if (startApplicationBtnSecondary) {
  startApplicationBtnSecondary.addEventListener("click", startCvAnalysisFlow);
}

if (filtroPais) {
  filtroPais.addEventListener("change", () => {
    llenarEstados(filtroPais, filtroEstado, filtroCiudad);
    cargarVacantesVista();
  });
}

if (filtroEstado) {
  filtroEstado.addEventListener("change", () => {
    llenarCiudades(filtroPais, filtroEstado, filtroCiudad);
    cargarVacantesVista();
  });
}

if (filtroCiudad) filtroCiudad.addEventListener("change", cargarVacantesVista);
if (filtroTipo) filtroTipo.addEventListener("change", cargarVacantesVista);
if (consultarStatusBtn) consultarStatusBtn.addEventListener("click", consultarEstatus);

if (attachCvBtn && chatCvFile) {
  attachCvBtn.addEventListener("click", () => {
    if (!applicationFlow.active) {
      openChat();
      addAssistantText("Primero inicia el análisis de CV o la postulación y luego adjunta tu archivo.");
      return;
    }

    if (applicationFlow.mode === "application" && applicationFlow.step < 15) {
      openChat();
      addAssistantText("Primero completa los pasos iniciales de tu postulación y luego adjunta tu CV.");
      return;
    }

    chatCvFile.click();
  });

  chatCvFile.addEventListener("change", async () => {
    const file = chatCvFile.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      addAssistantText("⚠️ Solo se permite subir el CV en formato PDF.");
      return;
    }

    applicationFlow.cvFile = file;

    if (applicationFlow.mode === "cv_analysis") {
      addAssistantText("✅ CV cargado correctamente. Ahora escribe 'analizar' para revisar tu perfil y recomendarte vacantes.");
    } else {
      addAssistantText("✅ CV cargado correctamente. Si deseas, ahora puedes adjuntar INE, CURP o comprobante de domicilio. Si no, escribe 'continuar' para enviar tu postulación.");
    }
  });
}

if (attachIneBtn && chatIneFile) {
  attachIneBtn.addEventListener("click", () => chatIneFile.click());
  chatIneFile.addEventListener("change", () => {
    const file = chatIneFile.files?.[0];
    if (!file) return;
    applicationFlow.ineFile = file;
    addAssistantText("✅ INE cargado correctamente.");
  });
}

if (attachCurpBtn && chatCurpFile) {
  attachCurpBtn.addEventListener("click", () => chatCurpFile.click());
  chatCurpFile.addEventListener("change", () => {
    const file = chatCurpFile.files?.[0];
    if (!file) return;
    applicationFlow.curpFile = file;
    addAssistantText("✅ CURP cargado correctamente.");
  });
}

if (attachDomicilioBtn && chatDomicilioFile) {
  attachDomicilioBtn.addEventListener("click", () => chatDomicilioFile.click());
  chatDomicilioFile.addEventListener("change", () => {
    const file = chatDomicilioFile.files?.[0];
    if (!file) return;
    applicationFlow.domicilioFile = file;
    addAssistantText("✅ Comprobante de domicilio cargado correctamente.");
  });
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    input.focus();

    if (applicationFlow.active) {
      addUserText(text);

      if (applicationFlow.mode === "cv_analysis" && normalizeText(text) === "analizar") {
        await processCvAnalysisOnly();
        return;
      }

      if (applicationFlow.mode === "application" && applicationFlow.step >= 15 && normalizeText(text) === "continuar") {
        await submitApplicationFromChat();
        return;
      }

      if (applicationFlow.mode === "application") {
        await handleApplicationFlow(text);
        return;
      }
    }

    await sendMessageToBot(text);
  });
}

/* =========================
   INIT
========================= */
async function init() {
  renderMessages();
  await cargarUbicaciones();
  llenarEstados(filtroPais, filtroEstado, filtroCiudad);
  await cargarVacantesVista();
}

init();