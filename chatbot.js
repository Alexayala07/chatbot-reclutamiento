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
    content: "Hola 👋 Soy el asistente de reclutamiento. Puedo ayudarte con vacantes operativas, administrativas y orientación según tu CV."
  }
];

function renderMessages() {
  if (!messagesDiv) return;
  messagesDiv.innerHTML = "";

  chatHistory.forEach((m) => {
    const el = document.createElement("div");
    el.className = `msg ${m.role}`;
    el.textContent = m.content;
    messagesDiv.appendChild(el);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

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
  chatHistory.push({ role: "user", content: userText });
  renderMessages();

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: chatHistory,
        candidateProfile
      })
    });

    const data = await response.json();

    if (data.reply) {
      chatHistory.push(data.reply);
    } else {
      chatHistory.push({
        role: "assistant",
        content: "⚠️ No pude responder en este momento."
      });
    }
  } catch (error) {
    console.error("Error enviando mensaje al chatbot:", error);
    chatHistory.push({
      role: "assistant",
      content: "⚠️ Error de conexión con el servidor."
    });
  }

  renderMessages();
}

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
    btn.addEventListener("click", async () => {
      const vacante = vacantesData.find((v) => v.id === btn.dataset.id);
      if (!vacante) return;

      openChat();

      applicationFlow = {
        active: true,
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

      chatHistory.push({
        role: "assistant",
        content: `Perfecto. Ya registré tu interés en la vacante "${vacante.titulo}" de ${vacante.grupo} en ${vacante.ciudad}. Ahora dime: ¿cuál es tu nombre completo?`
      });

      renderMessages();
    });
  });
}

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

function startApplicationFlow() {
  applicationFlow = {
    active: true,
    step: 1,
    data: {},
    cvFile: null,
    ineFile: null,
    curpFile: null,
    domicilioFile: null
  };

  openChat();

  chatHistory.push({
    role: "assistant",
    content: "Perfecto. Vamos a iniciar tu postulación. Primero dime: ¿buscas una vacante operativa/restaurante o administrativa/corporativo?"
  });

  renderMessages();
}

async function handleApplicationFlow(userText) {
  const text = userText.trim();

  switch (applicationFlow.step) {
    case 1:
      applicationFlow.data.tipoVacante = text.toLowerCase().includes("admin") ? "administrativa" : "operativa";
      applicationFlow.step = 2;
      chatHistory.push({
        role: "assistant",
        content: "¿En qué país te interesa trabajar? Ejemplo: México o Estados Unidos."
      });
      break;

    case 2:
      applicationFlow.data.pais = text;
      applicationFlow.step = 3;
      chatHistory.push({
        role: "assistant",
        content: "¿En qué estado te interesa trabajar?"
      });
      break;

    case 3:
      applicationFlow.data.estado = text;
      applicationFlow.step = 4;
      chatHistory.push({
        role: "assistant",
        content: "¿En qué ciudad te interesa trabajar?"
      });
      break;

    case 4:
      applicationFlow.data.ciudad = text;
      applicationFlow.step = 5;
      chatHistory.push({
        role: "assistant",
        content: applicationFlow.data.tipoVacante === "operativa"
          ? "¿Qué marca te interesa? Ejemplo: Wendy's, Applebee's, Great American, Ardeo, Yoko o Little Caesars."
          : "¿Qué departamento te interesa? Ejemplo: RH, Contabilidad, Sistemas, Mercadotecnia, Monitoreo o Capital Humano."
      });
      break;

    case 5: {
      applicationFlow.data.grupoSeleccionado = text;

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
        chatHistory.push({
          role: "assistant",
          content: "No encontré vacantes con esa combinación. Intenta con otra ciudad, grupo o tipo de vacante."
        });
        break;
      }

      applicationFlow.data.vacantesDisponibles = vacs;
      applicationFlow.step = 6;

      chatHistory.push({
        role: "assistant",
        content:
          "Estas son las vacantes disponibles:\n" +
          vacs.map((v, i) => `${i + 1}. ${v.titulo} - ${v.grupo} - ${v.ciudad}`).join("\n") +
          "\n\nEscríbeme el número de la vacante que te interesa. Ejemplo: 1"
      });
      break;
    }

    case 6: {
      const index = Number(text) - 1;
      const vacante = applicationFlow.data.vacantesDisponibles?.[index];

      if (!vacante) {
        chatHistory.push({
          role: "assistant",
          content: "No reconocí esa opción. Escríbeme el número de la vacante que te interesa. Ejemplo: 1"
        });
        break;
      }

      applicationFlow.data.vacanteId = vacante.id;
      applicationFlow.data.vacanteTitulo = vacante.titulo;
      applicationFlow.data.puestoInteres = vacante.titulo;

      applicationFlow.step = 7;
      chatHistory.push({
        role: "assistant",
        content: "¿Cuál es tu nombre completo?"
      });
      break;
    }

    case 7:
      applicationFlow.data.nombre = text;
      applicationFlow.step = 8;
      chatHistory.push({
        role: "assistant",
        content: "Compárteme tu correo electrónico."
      });
      break;

    case 8:
      applicationFlow.data.correo = text;
      applicationFlow.step = 9;
      chatHistory.push({
        role: "assistant",
        content: "Ahora tu teléfono, por favor."
      });
      break;

    case 9:
      applicationFlow.data.telefono = text;
      applicationFlow.step = 10;
      chatHistory.push({
        role: "assistant",
        content: "¿Qué edad tienes?"
      });
      break;

    case 10:
      applicationFlow.data.edad = text;
      applicationFlow.step = 11;
      chatHistory.push({
        role: "assistant",
        content: "¿Cuál es tu disponibilidad? Ejemplo: tiempo completo, medio tiempo o fines de semana."
      });
      break;

    case 11:
      applicationFlow.data.disponibilidad = text;
      applicationFlow.step = 12;
      chatHistory.push({
        role: "assistant",
        content: "¿Cuál es tu escolaridad?"
      });
      break;

    case 12:
      applicationFlow.data.escolaridad = text;
      applicationFlow.step = 13;
      chatHistory.push({
        role: "assistant",
        content: "Cuéntame brevemente tu experiencia laboral."
      });
      break;

    case 13:
      applicationFlow.data.experiencia = text;
      applicationFlow.step = 14;
      chatHistory.push({
        role: "assistant",
        content: "Ahora dime tus habilidades principales."
      });
      break;

    case 14:
      applicationFlow.data.habilidades = text;
      applicationFlow.step = 15;
      chatHistory.push({
        role: "assistant",
        content: "Muy bien. Ahora usa el botón 'Adjuntar CV PDF' para subir tu CV."
      });
      break;

    default:
      applicationFlow.active = false;
      break;
  }

  renderMessages();
}

async function submitApplicationFromChat() {
  if (!applicationFlow.cvFile) {
    chatHistory.push({
      role: "assistant",
      content: "⚠️ Debes adjuntar tu CV en PDF antes de enviar la postulación."
    });
    renderMessages();
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

    chatHistory.push({
      role: "assistant",
      content:
        `✅ Tu postulación fue enviada correctamente para ${data.postulacion.vacanteTitulo}. ` +
        `Tu folio es ${data.postulacion.id}. ` +
        `Resumen de tu CV: ${data.postulacion.resumenIA}`
    });

    renderMessages();
  } catch (error) {
    chatHistory.push({
      role: "assistant",
      content: `⚠️ ${error.message}`
    });
    renderMessages();
  }
}

if (toggle) toggle.addEventListener("click", openChat);
if (closeBtn) closeBtn.addEventListener("click", closeChat);

if (startApplicationBtn) {
  startApplicationBtn.addEventListener("click", startApplicationFlow);
}

if (startApplicationBtnSecondary) {
  startApplicationBtnSecondary.addEventListener("click", startApplicationFlow);
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
    if (!applicationFlow.active || applicationFlow.step < 15) {
      openChat();
      chatHistory.push({
        role: "assistant",
        content: "Primero completa los pasos iniciales de tu postulación y luego adjunta tu CV."
      });
      renderMessages();
      return;
    }

    chatCvFile.click();
  });

  chatCvFile.addEventListener("change", async () => {
    const file = chatCvFile.files?.[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      chatHistory.push({
        role: "assistant",
        content: "⚠️ Solo se permite subir el CV en formato PDF."
      });
      renderMessages();
      return;
    }

    applicationFlow.cvFile = file;

    chatHistory.push({
      role: "assistant",
      content: "✅ CV cargado correctamente. Si deseas, ahora puedes adjuntar INE, CURP o comprobante de domicilio. Si no, escribe 'continuar' para enviar tu postulación."
    });
    renderMessages();
  });
}

if (attachIneBtn && chatIneFile) {
  attachIneBtn.addEventListener("click", () => chatIneFile.click());
  chatIneFile.addEventListener("change", () => {
    const file = chatIneFile.files?.[0];
    if (!file) return;
    applicationFlow.ineFile = file;
    chatHistory.push({ role: "assistant", content: "✅ INE cargado correctamente." });
    renderMessages();
  });
}

if (attachCurpBtn && chatCurpFile) {
  attachCurpBtn.addEventListener("click", () => chatCurpFile.click());
  chatCurpFile.addEventListener("change", () => {
    const file = chatCurpFile.files?.[0];
    if (!file) return;
    applicationFlow.curpFile = file;
    chatHistory.push({ role: "assistant", content: "✅ CURP cargado correctamente." });
    renderMessages();
  });
}

if (attachDomicilioBtn && chatDomicilioFile) {
  attachDomicilioBtn.addEventListener("click", () => chatDomicilioFile.click());
  chatDomicilioFile.addEventListener("change", () => {
    const file = chatDomicilioFile.files?.[0];
    if (!file) return;
    applicationFlow.domicilioFile = file;
    chatHistory.push({ role: "assistant", content: "✅ Comprobante de domicilio cargado correctamente." });
    renderMessages();
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
      chatHistory.push({ role: "user", content: text });
      renderMessages();

      if (applicationFlow.step >= 15 && text.toLowerCase() === "continuar") {
        await submitApplicationFromChat();
        return;
      }

      await handleApplicationFlow(text);
      return;
    }

    await sendMessageToBot(text);
  });
}

async function init() {
  renderMessages();
  await cargarUbicaciones();
  llenarEstados(filtroPais, filtroEstado, filtroCiudad);
  await cargarVacantesVista();
}

init();