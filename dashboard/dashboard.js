const API_URL = "https://chatbot-reclutamiento-cl32.onrender.com";

/* =========================
   POSTULACIONES
========================= */
const postulacionesList = document.getElementById("postulacionesList");
const dashboardStatus = document.getElementById("dashboardStatus");
const refreshBtn = document.getElementById("refreshBtn");

const statTotal = document.getElementById("statTotal");
const statPendiente = document.getElementById("statPendiente");
const statAprobado = document.getElementById("statAprobado");
const statRechazado = document.getElementById("statRechazado");

const modal = document.getElementById("candidateModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const closeModalBackdrop = document.getElementById("closeModalBackdrop");

const modalNombre = document.getElementById("modalNombre");
const modalEstado = document.getElementById("modalEstado");
const modalCiudad = document.getElementById("modalCiudad");
const modalPuesto = document.getElementById("modalPuesto");
const modalEscolaridad = document.getElementById("modalEscolaridad");
const modalFecha = document.getElementById("modalFecha");
const modalExperiencia = document.getElementById("modalExperiencia");
const modalHabilidades = document.getElementById("modalHabilidades");
const modalCvLink = document.getElementById("modalCvLink");

const approveBtn = document.getElementById("approveBtn");
const rejectBtn = document.getElementById("rejectBtn");

/* =========================
   VACANTES
========================= */
const vacantesAdminList = document.getElementById("vacantesAdminList");
const vacantesAdminStatus = document.getElementById("vacantesAdminStatus");
const refreshVacantesBtn = document.getElementById("refreshVacantesBtn");
const openVacanteModalBtn = document.getElementById("openVacanteModalBtn");

const adminFiltroTipo = document.getElementById("adminFiltroTipo");
const adminFiltroPais = document.getElementById("adminFiltroPais");
const adminFiltroEstado = document.getElementById("adminFiltroEstado");
const adminFiltroCiudad = document.getElementById("adminFiltroCiudad");

const vacanteModal = document.getElementById("vacanteModal");
const closeVacanteModalBtn = document.getElementById("closeVacanteModalBtn");
const closeVacanteBackdrop = document.getElementById("closeVacanteBackdrop");
const vacanteModalTitle = document.getElementById("vacanteModalTitle");
const saveVacanteBtn = document.getElementById("saveVacanteBtn");

const vacanteIdEdit = document.getElementById("vacanteIdEdit");
const vacanteTipo = document.getElementById("vacanteTipo");
const vacanteGrupo = document.getElementById("vacanteGrupo");
const vacanteTituloInput = document.getElementById("vacanteTituloInput");
const vacanteArea = document.getElementById("vacanteArea");
const vacantePais = document.getElementById("vacantePais");
const vacanteEstado = document.getElementById("vacanteEstado");
const vacanteCiudad = document.getElementById("vacanteCiudad");
const vacanteSucursal = document.getElementById("vacanteSucursal");
const vacanteRequisitos = document.getElementById("vacanteRequisitos");

let postulaciones = [];
let selectedCandidate = null;
let vacantes = [];
let ubicaciones = [];
let selectedVacante = null;

/* =========================
   HELPERS
========================= */
function setStatus(message, show = true) {
  if (!dashboardStatus) return;
  dashboardStatus.textContent = message;
  dashboardStatus.classList.toggle("hidden", !show);
}

function setVacantesStatus(message, show = true) {
  if (!vacantesAdminStatus) return;
  vacantesAdminStatus.textContent = message;
  vacantesAdminStatus.classList.toggle("hidden", !show);
}

function formatFecha(fechaIso) {
  if (!fechaIso) return "-";
  const date = new Date(fechaIso);
  return date.toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getEstadoClass(estado) {
  if (estado === "aprobado") return "estado estado--aprobado";
  if (estado === "rechazado") return "estado estado--rechazado";
  return "estado estado--pendiente";
}

/* =========================
   POSTULACIONES
========================= */
function updateStats() {
  const total = postulaciones.length;
  const pendientes = postulaciones.filter(p => p.estadoSolicitud === "pendiente").length;
  const aprobados = postulaciones.filter(p => p.estadoSolicitud === "aprobado").length;
  const rechazados = postulaciones.filter(p => p.estadoSolicitud === "rechazado").length;

  statTotal.textContent = total;
  statPendiente.textContent = pendientes;
  statAprobado.textContent = aprobados;
  statRechazado.textContent = rechazados;
}

function renderPostulaciones() {
  if (!postulacionesList) return;

  postulacionesList.innerHTML = "";

  if (!postulaciones.length) {
    postulacionesList.innerHTML = `
      <div class="status">
        No hay postulaciones registradas todavía.
      </div>
    `;
    updateStats();
    return;
  }

  postulaciones.forEach((postulacion) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
      <div class="dashboard-card__top">
        <div>
          <h3>${postulacion.nombre || "Sin nombre"}</h3>
          <p>${postulacion.vacanteTitulo || postulacion.puestoInteres || "Sin puesto de interés"}</p>
        </div>
        <span class="${getEstadoClass(postulacion.estadoSolicitud)}">
          ${postulacion.estadoSolicitud || "pendiente"}
        </span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ciudad:</strong> ${postulacion.ciudad || "-"}</p>
        <p><strong>Grupo:</strong> ${postulacion.grupoSeleccionado || "-"}</p>
        <p><strong>Tipo:</strong> ${postulacion.tipoVacante || "-"}</p>
        <p><strong>CV:</strong> ${postulacion.cvNombre || "No disponible"}</p>
      </div>

      <div class="dashboard-card__actions">
        <button class="btn btn--secondary view-btn" data-id="${postulacion.id}">
          Ver datos
        </button>
      </div>
    `;

    postulacionesList.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const candidate = postulaciones.find((p) => p.id === id);
      if (candidate) openCandidateModal(candidate);
    });
  });

  updateStats();
}

function openCandidateModal(candidate) {
  selectedCandidate = candidate;

  modalNombre.textContent = candidate.nombre || "Sin nombre";
  modalEstado.textContent = `Estado: ${candidate.estadoSolicitud || "pendiente"}`;
  modalCiudad.textContent = candidate.ciudad || "-";
  modalPuesto.textContent = candidate.vacanteTitulo || candidate.puestoInteres || "-";
  modalEscolaridad.textContent = candidate.escolaridad || "-";
  modalFecha.textContent = formatFecha(candidate.fechaRegistro);
  modalExperiencia.textContent = candidate.experiencia || "No proporcionada";
  modalHabilidades.textContent = candidate.habilidades || "No proporcionadas";
  modalCvLink.href = candidate.cvRuta ? `${API_URL}${candidate.cvRuta}` : "#";

  modal.classList.remove("hidden");
}

function closeCandidateModal() {
  modal.classList.add("hidden");
  selectedCandidate = null;
}

async function cargarPostulaciones() {
  try {
    setStatus("Cargando postulaciones...");

    const res = await fetch(`${API_URL}/api/postulaciones`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    postulaciones = await res.json();
    renderPostulaciones();
    setStatus("", false);
  } catch (error) {
    console.error("Error cargando postulaciones:", error);
    setStatus("⚠️ No fue posible cargar las postulaciones.");
  }
}

async function actualizarEstado(nuevoEstado) {
  if (!selectedCandidate?.id) return;

  try {
    const res = await fetch(`${API_URL}/api/postulaciones/${selectedCandidate.id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible actualizar el estado.");

    await cargarPostulaciones();
    closeCandidateModal();
    setStatus(`✅ Solicitud marcada como ${nuevoEstado}.`);
  } catch (error) {
    console.error("Error actualizando estado:", error);
    setStatus(`⚠️ ${error.message}`);
  }
}

/* =========================
   VACANTES
========================= */
async function cargarUbicaciones() {
  try {
    const res = await fetch(`${API_URL}/api/ubicaciones`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    ubicaciones = await res.json();
  } catch (error) {
    console.error("Error cargando ubicaciones:", error);
    ubicaciones = {};
  }
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

function llenarEstadosModal() {
  const pais = vacantePais.value;
  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !ubicaciones[pais]) return;

  Object.keys(ubicaciones[pais]).forEach((estado) => {
    const option = document.createElement("option");
    option.value = estado;
    option.textContent = estado;
    vacanteEstado.appendChild(option);
  });
}

function llenarCiudadesModal() {
  const pais = vacantePais.value;
  const estado = vacanteEstado.value;

  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;

  if (!pais || !estado || !ubicaciones[pais]?.[estado]) return;

  ubicaciones[pais][estado].forEach((ciudad) => {
    const option = document.createElement("option");
    option.value = ciudad;
    option.textContent = ciudad;
    vacanteCiudad.appendChild(option);
  });
}

async function cargarVacantesAdmin() {
  try {
    setVacantesStatus("Cargando vacantes...");

    const params = new URLSearchParams({
      tipoVacante: adminFiltroTipo.value,
      pais: adminFiltroPais.value,
      estado: adminFiltroEstado.value,
      ciudad: adminFiltroCiudad.value
    });

    const res = await fetch(`${API_URL}/api/vacantes?${params.toString()}`);
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

    vacantes = await res.json();
    renderVacantesAdmin();
    setVacantesStatus("", false);
  } catch (error) {
    console.error("Error cargando vacantes:", error);
    setVacantesStatus("⚠️ No fue posible cargar las vacantes.");
  }
}

function renderVacantesAdmin() {
  if (!vacantesAdminList) return;

  vacantesAdminList.innerHTML = "";

  if (!vacantes.length) {
    vacantesAdminList.innerHTML = `
      <div class="status">
        No hay vacantes registradas con esos filtros.
      </div>
    `;
    return;
  }

  vacantes.forEach((vacante) => {
    const card = document.createElement("article");
    card.className = "dashboard-card";

    card.innerHTML = `
      <div class="dashboard-card__top">
        <div>
          <h3>${vacante.titulo}</h3>
          <p>${vacante.grupo} • ${vacante.area}</p>
        </div>
        <span class="estado estado--pendiente">${vacante.tipoVacante}</span>
      </div>

      <div class="dashboard-card__info">
        <p><strong>Ubicación:</strong> ${vacante.pais} / ${vacante.estado} / ${vacante.ciudad}</p>
        <p><strong>Sucursal:</strong> ${vacante.sucursal}</p>
        <p><strong>Requisitos:</strong> ${Array.isArray(vacante.requisitos) ? vacante.requisitos.join(", ") : "-"}</p>
      </div>

      <div class="dashboard-card__actions">
        <button class="btn btn--secondary edit-vacante-btn" data-id="${vacante.id}">Editar</button>
        <button class="btn btn--secondary delete-vacante-btn" data-id="${vacante.id}">Eliminar</button>
      </div>
    `;

    vacantesAdminList.appendChild(card);
  });

  document.querySelectorAll(".edit-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = vacantes.find(v => v.id === btn.dataset.id);
      if (item) openVacanteModal(item);
    });
  });

  document.querySelectorAll(".delete-vacante-btn").forEach((btn) => {
    btn.addEventListener("click", () => eliminarVacante(btn.dataset.id));
  });
}

function resetVacanteForm() {
  vacanteIdEdit.value = "";
  vacanteTipo.value = "";
  vacanteGrupo.value = "";
  vacanteTituloInput.value = "";
  vacanteArea.value = "";
  vacantePais.value = "";
  vacanteEstado.innerHTML = `<option value="">Selecciona</option>`;
  vacanteCiudad.innerHTML = `<option value="">Selecciona</option>`;
  vacanteSucursal.value = "";
  vacanteRequisitos.value = "";
  selectedVacante = null;
}

function openVacanteModal(vacante = null) {
  resetVacanteForm();

  if (vacante) {
    selectedVacante = vacante;
    vacanteModalTitle.textContent = "Editar vacante";

    vacanteIdEdit.value = vacante.id || "";
    vacanteTipo.value = vacante.tipoVacante || "";
    vacanteGrupo.value = vacante.grupo || "";
    vacanteTituloInput.value = vacante.titulo || "";
    vacanteArea.value = vacante.area || "";
    vacantePais.value = vacante.pais || "";
    llenarEstadosModal();
    vacanteEstado.value = vacante.estado || "";
    llenarCiudadesModal();
    vacanteCiudad.value = vacante.ciudad || "";
    vacanteSucursal.value = vacante.sucursal || "";
    vacanteRequisitos.value = Array.isArray(vacante.requisitos) ? vacante.requisitos.join(", ") : "";
  } else {
    vacanteModalTitle.textContent = "Nueva vacante";
  }

  vacanteModal.classList.remove("hidden");
}

function closeVacanteModal() {
  vacanteModal.classList.add("hidden");
  resetVacanteForm();
}

async function guardarVacante() {
  const payload = {
    tipoVacante: vacanteTipo.value,
    grupo: vacanteGrupo.value.trim(),
    titulo: vacanteTituloInput.value.trim(),
    area: vacanteArea.value.trim(),
    pais: vacantePais.value,
    estado: vacanteEstado.value,
    ciudad: vacanteCiudad.value,
    sucursal: vacanteSucursal.value.trim(),
    requisitos: vacanteRequisitos.value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean)
  };

  if (!payload.tipoVacante || !payload.grupo || !payload.titulo || !payload.area || !payload.pais || !payload.estado || !payload.ciudad || !payload.sucursal || !payload.requisitos.length) {
    setVacantesStatus("⚠️ Completa todos los campos de la vacante.");
    return;
  }

  try {
    const isEdit = Boolean(vacanteIdEdit.value);
    const url = isEdit
      ? `${API_URL}/api/vacantes/${vacanteIdEdit.value}`
      : `${API_URL}/api/vacantes`;
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible guardar la vacante.");

    closeVacanteModal();
    await cargarVacantesAdmin();
    setVacantesStatus(`✅ Vacante ${isEdit ? "actualizada" : "creada"} correctamente.`);
  } catch (error) {
    console.error("Error guardando vacante:", error);
    setVacantesStatus(`⚠️ ${error.message}`);
  }
}

async function eliminarVacante(id) {
  const confirmDelete = confirm("¿Seguro que deseas eliminar esta vacante?");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${API_URL}/api/vacantes/${id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No fue posible eliminar la vacante.");

    await cargarVacantesAdmin();
    setVacantesStatus("✅ Vacante eliminada correctamente.");
  } catch (error) {
    console.error("Error eliminando vacante:", error);
    setVacantesStatus(`⚠️ ${error.message}`);
  }
}

/* =========================
   EVENTS
========================= */
if (refreshBtn) refreshBtn.addEventListener("click", cargarPostulaciones);
if (closeModalBtn) closeModalBtn.addEventListener("click", closeCandidateModal);
if (closeModalBackdrop) closeModalBackdrop.addEventListener("click", closeCandidateModal);
if (approveBtn) approveBtn.addEventListener("click", () => actualizarEstado("aprobado"));
if (rejectBtn) rejectBtn.addEventListener("click", () => actualizarEstado("rechazado"));

if (openVacanteModalBtn) openVacanteModalBtn.addEventListener("click", () => openVacanteModal());
if (refreshVacantesBtn) refreshVacantesBtn.addEventListener("click", cargarVacantesAdmin);
if (closeVacanteModalBtn) closeVacanteModalBtn.addEventListener("click", closeVacanteModal);
if (closeVacanteBackdrop) closeVacanteBackdrop.addEventListener("click", closeVacanteModal);
if (saveVacanteBtn) saveVacanteBtn.addEventListener("click", guardarVacante);

if (adminFiltroPais) {
  adminFiltroPais.addEventListener("change", () => {
    llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}
if (adminFiltroEstado) {
  adminFiltroEstado.addEventListener("change", () => {
    llenarCiudades(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
    cargarVacantesAdmin();
  });
}
if (adminFiltroCiudad) adminFiltroCiudad.addEventListener("change", cargarVacantesAdmin);
if (adminFiltroTipo) adminFiltroTipo.addEventListener("change", cargarVacantesAdmin);

if (vacantePais) vacantePais.addEventListener("change", llenarEstadosModal);
if (vacanteEstado) vacanteEstado.addEventListener("change", llenarCiudadesModal);

/* =========================
   INIT
========================= */
async function init() {
  await cargarUbicaciones();
  llenarEstados(adminFiltroPais, adminFiltroEstado, adminFiltroCiudad);
  await cargarPostulaciones();
  await cargarVacantesAdmin();
}

init();