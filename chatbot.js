const API_URL = window.location.origin;

const toggle = document.getElementById("chatbot-toggle");
const closeBtn = document.getElementById("chatbot-close");
const box = document.getElementById("chatbot-box");
const messagesDiv = document.getElementById("chatbot-messages");
const form = document.getElementById("chatbot-form");
const input = document.getElementById("chatbot-input");

const candidateForm = document.getElementById("candidate-form");
const profileStatus = document.getElementById("profile-status");
const vacantesList = document.getElementById("vacantes-list");
const cvFileInput = document.getElementById("cvFile");
const ineFileInput = document.getElementById("ineFile");
const curpFileInput = document.getElementById("curpFile");
const domicilioFileInput = document.getElementById("domicilioFile");

const paisSelect = document.getElementById("pais");
const estadoSelect = document.getElementById("estado");
const ciudadSelect = document.getElementById("ciudad");
const tipoVacanteSelect = document.getElementById("tipoVacante");
const grupoSeleccionadoSelect = document.getElementById("grupoSeleccionado");
const vacanteSeleccionadaSelect = document.getElementById("vacanteSeleccionada");

const filtroTipo = document.getElementById("filtroTipo");
const filtroPais = document.getElementById("filtroPais");
const filtroEstado = document.getElementById("filtroEstado");
const filtroCiudad = document.getElementById("filtroCiudad");

const consultarStatusBtn = document.getElementById("consultarStatusBtn");
const folioConsulta = document.getElementById("folioConsulta");
const consultaStatusResultado = document.getElementById("consultaStatusResultado");

let ubicaciones = {};
let vacantesData = [];

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

function getCandidateProfileFromForm() {
  return {
    nombre: document.getElementById("nombre")?.value.trim() || "",
    correo: document.getElementById("correo")?.value.trim() || "",
    telefono: document.getElementById("telefono")?.value.trim() || "",
    edad: document.getElementById("edad")?.value.trim() || "",
    pais: paisSelect?.value || "",
    estado: estadoSelect?.value || "",
    ciudad: ciudadSelect?.value || "",
    disponibilidad: document.getElementById("disponibilidad")?.value || "",
    tipoVacante: tipoVacanteSelect?.value || "",
    grupoSeleccionado: grupoSeleccionadoSelect?.value || "",
    vacanteId: vacanteSeleccionadaSelect?.value || "",
    vacanteTitulo: vacanteSeleccionadaSelect?.selectedOptions?.[0]?.text || "",
    puestoInteres: document.getElementById("puestoInteres")?.value.trim() || "",
    escolaridad: document.getElementById("escolaridad")?.value.trim() || "",
    experiencia: document.getElementById("experiencia")?.value.trim() || "",
    habilidades: document.getElementById("habilidades")?.value.trim() || "",
    cvNombre: candidateProfile.cvNombre || "",
    postulacionId: candidateProfile.postulacionId || "",
    resumenIA: candidateProfile.resumenIA || ""
  };
}

async function cargarUbicaciones() {
  const res = await fetch(`${API_URL}/api/ubicaciones`);
  ubicaciones = await res.json();
}

function llenarEstados(selectPais, targetEstado, targetCiudad) {
  const pais = selectPais.value;
  targetEstado.innerHTML = `<option value="">Selecciona un estado</option>`;
  targetCiudad.innerHTML = `<option value="">Selecciona una ciudad</option>`;

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

  targetCiudad.innerHTML = `<option value="">Selecciona una ciudad</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    targetCiudad.appendChild(option);
  });
}

async function cargarGruposPorTipo(tipoVacante) {
  grupoSeleccionadoSelect.innerHTML = `<option value="">Selecciona una opción</option>`;
  vacanteSeleccionadaSelect.innerHTML = `<option value="">Selecciona una vacante</option>`;
  if (!tipoVacante) return;

  const res = await fetch(`${API_URL}/api/grupos?tipoVacante=${encodeURIComponent(tipoVacante)}`);
  const grupos = await res.json();

  grupos.forEach((grupo) => {
    const option = document.createElement("option");
    option.value = grupo;
    option.textContent = grupo;
    grupoSeleccionadoSelect.appendChild(option);
  });
}

async function cargarVacantesParaFormulario() {
  vacanteSeleccionadaSelect.innerHTML = `<option value="">Selecciona una vacante</option>`;

  const params = new URLSearchParams({
    tipoVacante: tipoVacanteSelect.value,
    pais: paisSelect.value,
    estado: estadoSelect.value,
    ciudad: ciudadSelect.value,
    grupo: grupoSeleccionadoSelect.value
  });

  const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
  const vacantes = await res.json();

  vacantes.forEach((vacante) => {
    const option = document.createElement("option");
    option.value = vacante.id;
    option.textContent = `${vacante.titulo} - ${vacante.grupo} - ${vacante.ciudad}`;
    vacanteSeleccionadaSelect.appendChild(option);
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
      const vacante = vacantesData.find(v => v.id === btn.dataset.id);
      if (!vacante) return;

      tipoVacanteSelect.value = vacante.tipoVacante;
      await cargarGruposPorTipo(vacante.tipoVacante);

      paisSelect.value = vacante.pais;
      llenarEstados(paisSelect, estadoSelect, ciudadSelect);
      estadoSelect.value = vacante.estado;
      llenarCiudades(paisSelect, estadoSelect, ciudadSelect);
      ciudadSelect.value = vacante.ciudad;

      grupoSeleccionadoSelect.value = vacante.grupo;
      await cargarVacantesParaFormulario();
      vacanteSeleccionadaSelect.value = vacante.id;
      document.getElementById("puestoInteres").value = vacante.titulo;

      openChat();
      await sendMessageToBot(`Me interesa la vacante ${vacante.titulo} de ${vacante.grupo} en ${vacante.ciudad}. ¿Qué requisitos necesito y cómo encaja mi perfil?`);
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
    consultaStatusResultado.textContent = `✅ Estado actual: ${data.estadoSolicitud || "pendiente"} | Vacante: ${data.vacanteTitulo || "-"} | Ciudad: ${data.ciudad || "-"}`;
  } catch (error) {
    consultaStatusResultado.classList.remove("hidden");
    consultaStatusResultado.textContent = `⚠️ ${error.message}`;
  }
}

if (toggle) toggle.addEventListener("click", openChat);
if (closeBtn) closeBtn.addEventListener("click", closeChat);

if (paisSelect) {
  paisSelect.addEventListener("change", async () => {
    llenarEstados(paisSelect, estadoSelect, ciudadSelect);
    await cargarVacantesParaFormulario();
  });
}

if (estadoSelect) {
  estadoSelect.addEventListener("change", async () => {
    llenarCiudades(paisSelect, estadoSelect, ciudadSelect);
    await cargarVacantesParaFormulario();
  });
}

if (ciudadSelect) {
  ciudadSelect.addEventListener("change", cargarVacantesParaFormulario);
}

if (tipoVacanteSelect) {
  tipoVacanteSelect.addEventListener("change", async () => {
    await cargarGruposPorTipo(tipoVacanteSelect.value);
    await cargarVacantesParaFormulario();
  });
}

if (grupoSeleccionadoSelect) {
  grupoSeleccionadoSelect.addEventListener("change", cargarVacantesParaFormulario);
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

if (candidateForm) {
  candidateForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const profile = getCandidateProfileFromForm();
    const cvFile = cvFileInput?.files?.[0];

    const obligatorios = [
      ["nombre", profile.nombre],
      ["correo", profile.correo],
      ["telefono", profile.telefono],
      ["pais", profile.pais],
      ["estado", profile.estado],
      ["ciudad", profile.ciudad],
      ["tipoVacante", profile.tipoVacante],
      ["grupoSeleccionado", profile.grupoSeleccionado],
      ["vacanteSeleccionada", profile.vacanteId]
    ];

    const faltantes = obligatorios.filter(([, valor]) => !valor).map(([key]) => key);
    if (faltantes.length) {
      profileStatus.classList.remove("hidden");
      profileStatus.textContent = "⚠️ Completa todos los campos obligatorios antes de enviar.";
      return;
    }

    if (!cvFile) {
      profileStatus.classList.remove("hidden");
      profileStatus.textContent = "⚠️ Debes adjuntar tu CV en formato PDF.";
      return;
    }

    const isPdf = cvFile.type === "application/pdf" || cvFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      profileStatus.classList.remove("hidden");
      profileStatus.textContent = "⚠️ Solo se permite el CV en PDF.";
      return;
    }

    const formData = new FormData();
    Object.entries(profile).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    formData.append("cvFile", cvFile);
    if (ineFileInput?.files?.[0]) formData.append("ineFile", ineFileInput.files[0]);
    if (curpFileInput?.files?.[0]) formData.append("curpFile", curpFileInput.files[0]);
    if (domicilioFileInput?.files?.[0]) formData.append("domicilioFile", domicilioFileInput.files[0]);

    profileStatus.classList.remove("hidden");
    profileStatus.textContent = "⏳ Enviando tu postulación y analizando tu CV...";

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
        ...profile,
        postulacionId: data.postulacion.id,
        cvNombre: data.postulacion.cvNombre,
        resumenIA: data.postulacion.resumenIA,
        vacanteTitulo: data.postulacion.vacanteTitulo
      };

      profileStatus.classList.remove("hidden");
      profileStatus.textContent =
        `✅ Postulación enviada correctamente. Tu folio es ${candidateProfile.postulacionId}. Guarda este número para consultar tu estatus.`;

      chatHistory.push({
        role: "assistant",
        content: `✅ Recibí tu postulación para ${candidateProfile.vacanteTitulo}. Folio: ${candidateProfile.postulacionId}. Resumen de tu CV: ${candidateProfile.resumenIA}`
      });
      renderMessages();
    } catch (error) {
      profileStatus.classList.remove("hidden");
      profileStatus.textContent = `⚠️ ${error.message}`;
    }
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

    candidateProfile = {
      ...getCandidateProfileFromForm(),
      cvNombre: candidateProfile.cvNombre,
      postulacionId: candidateProfile.postulacionId,
      resumenIA: candidateProfile.resumenIA
    };

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